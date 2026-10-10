import argparse
import tempfile
import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
import unittest
from pathlib import Path
from PIL import Image
from recognize import local_url, prepare_image, validate_result, recognize

class RecognitionTests(unittest.TestCase):
    def test_image_content_and_resize(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'photo.png'
            Image.new('RGB', (2000, 1000)).save(path)
            encoded, original, resized = prepare_image(path)
            self.assertEqual(original, [2000, 1000])
            self.assertEqual(resized, [1280, 640])
            self.assertTrue(encoded)
            path.write_bytes(b'not an image')
            with self.assertRaises(OSError):
                prepare_image(path)

    def test_invalid_result_rejected(self):
        for value in ({}, {'ingredients': [{'name': 'Milch'}], 'uncertainItems': []},
                      {'ingredients': [], 'uncertainItems': [123]}):
            with self.assertRaises(ValueError):
                validate_result(value)
        self.assertEqual(validate_result({'ingredients': [], 'uncertainItems': []})['ingredients'], [])

    def test_external_servers_rejected(self):
        for url in ('https://example.com', 'http://127.0.0.1@evil.com', 'http://localhost/remote'):
            with self.assertRaises(argparse.ArgumentTypeError):
                local_url(url)

    def test_http_contract(self):
        requests = []
        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass
            def do_POST(self):
                requests.append(json.loads(self.rfile.read(int(self.headers['Content-Length']))))
                response = {'done': True, 'done_reason': 'stop', 'message': {'content':
                    json.dumps({'ingredients': [{'name': 'Banane', 'evidence': 'Gelbe Frucht'}],
                                'uncertainItems': []})}}
                self.send_response(200)
                self.end_headers()
                self.wfile.write(json.dumps(response).encode())
            def do_GET(self):
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'{"models": []}')
        server = HTTPServer(('127.0.0.1', 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / 'photo.png'
                Image.new('RGB', (10, 10)).save(path)
                result = recognize(path, f'http://127.0.0.1:{server.server_port}', 'test-local', 5)
            self.assertTrue(result['requiresConfirmation'])
            self.assertEqual(result['ingredients'][0]['name'], 'Banane')
            self.assertTrue(requests[0]['messages'][0]['images'])
            self.assertFalse(requests[0]['stream'])
            self.assertEqual(requests[0]['format']['type'], 'object')
        finally:
            server.shutdown()
            server.server_close()
            thread.join()

if __name__ == '__main__':
    unittest.main()
