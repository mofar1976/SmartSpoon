"""Internal HTTP service; images are processed in memory, never stored."""
import hmac
import json
import os
import socket
import threading
import urllib.error
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from PIL import Image
from recognition import MODEL, MAX_BYTES, api, prepare_image_bytes, recognize_prepared


def configured_url(value):
    parsed = urllib.parse.urlsplit(value)
    if (parsed.scheme != 'http' or parsed.hostname not in
            ('127.0.0.1', 'localhost', '::1', 'host.docker.internal', 'ollama')
            or parsed.username or parsed.password or parsed.path not in ('', '/')
            or parsed.query or parsed.fragment):
        raise ValueError('OLLAMA_URL must address a local or internal Ollama instance.')
    return value.rstrip('/')


class RecognitionServer(ThreadingHTTPServer):
    daemon_threads = True
    def __init__(self, address, token, ollama_url, model=MODEL, timeout=180):
        if len(token) < 32 or 'cloud' in model.lower() or not 1 <= timeout <= 300:
            raise ValueError('A strong service token, local model and bounded timeout are required.')
        self.token = token
        self.ollama_url = configured_url(ollama_url)
        self.model = model
        self.inference_timeout = timeout
        self.inference_slot = threading.BoundedSemaphore(1)
        super().__init__(address, Handler)


class Handler(BaseHTTPRequestHandler):
    def setup(self):
        super().setup()
        self.connection.settimeout(15)

    def log_message(self, format, *args):
        # Do not log photos, model replies, tokens or incoming request data.
        pass

    def send_json(self, status, value):
        encoded = json.dumps(value, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(encoded)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(encoded)

    def do_GET(self):
        if self.path == '/health':
            self.send_json(200, {'status': 'ok'})
        elif self.path == '/health/ready':
            try:
                info = api(self.server.ollama_url, '/api/show', {'model': self.server.model}, 5)
                if 'vision' not in info.get('capabilities', []):
                    raise ValueError('Vision model unavailable')
            except (OSError, ValueError, TypeError):
                self.send_json(503, {'code': 'MODEL_UNAVAILABLE'})
                return
            self.send_json(200, {'status': 'ready'})
        else:
            self.send_json(404, {'code': 'NOT_FOUND'})

    def do_POST(self):
        if self.path != '/recognize':
            self.send_json(404, {'code': 'NOT_FOUND'})
            return
        if not hmac.compare_digest(self.headers.get('Authorization', '').encode('utf-8'),
                                   ('Bearer ' + self.server.token).encode('utf-8')):
            self.send_json(401, {'code': 'UNAUTHORIZED'})
            return
        if self.headers.get('Content-Type', '').split(';')[0].strip() not in ('image/jpeg', 'image/png', 'image/webp'):
            self.send_json(415, {'code': 'UNSUPPORTED_IMAGE_TYPE'})
            return
        try:
            size = int(self.headers.get('Content-Length', ''))
        except ValueError:
            self.send_json(411, {'code': 'CONTENT_LENGTH_REQUIRED'})
            return
        if self.headers.get('Transfer-Encoding') or size <= 0 or size > MAX_BYTES:
            self.send_json(413, {'code': 'IMAGE_SIZE_LIMIT'})
            return
        if not self.server.inference_slot.acquire(blocking=False):
            self.send_json(429, {'code': 'RECOGNITION_BUSY'})
            return
        try:
            try:
                data = self.rfile.read(size)
            except (OSError, socket.timeout):
                self.send_json(408, {'code': 'UPLOAD_TIMEOUT'})
                return
            if len(data) != size:
                self.send_json(400, {'code': 'INCOMPLETE_IMAGE'})
                return
            try:
                prepared = prepare_image_bytes(data)
            except (OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning):
                self.send_json(422, {'code': 'INVALID_IMAGE'})
                return
            try:
                result = recognize_prepared(prepared, self.server.ollama_url, self.server.model,
                                            self.server.inference_timeout)
            except (ValueError, KeyError, TypeError):
                self.send_json(502, {'code': 'INVALID_MODEL_RESULT'})
                return
            except (TimeoutError, socket.timeout):
                self.send_json(504, {'code': 'RECOGNITION_TIMEOUT'})
                return
            except urllib.error.URLError as error:
                if isinstance(error.reason, (TimeoutError, socket.timeout)):
                    self.send_json(504, {'code': 'RECOGNITION_TIMEOUT'})
                else:
                    self.send_json(503, {'code': 'MODEL_UNAVAILABLE'})
                return
            except OSError:
                self.send_json(503, {'code': 'MODEL_UNAVAILABLE'})
                return
            except (KeyError, TypeError):
                self.send_json(502, {'code': 'INVALID_MODEL_RESULT'})
                return
            self.send_json(200, result)
        finally:
            self.server.inference_slot.release()


if __name__ == '__main__':
    server = RecognitionServer(('0.0.0.0', int(os.getenv('PORT', '8090'))),
        os.environ['INGREDIENT_RECOGNITION_TOKEN'],
        os.getenv('OLLAMA_URL', 'http://host.docker.internal:11434'),
        os.getenv('VISION_MODEL', MODEL), int(os.getenv('VISION_TIMEOUT_SECONDS', '180')))
    print('Ingredient recognition service listening', flush=True)
    server.serve_forever()
