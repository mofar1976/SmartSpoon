import io
import json
import threading
import unittest
import urllib.request
import urllib.error
from unittest.mock import patch
from PIL import Image
from server import RecognitionServer

class ServiceTests(unittest.TestCase):
    def setUp(self):
        self.server = RecognitionServer(('127.0.0.1', 0), 'x'*32, 'http://localhost:11434')
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
    def tearDown(self):
        self.server.shutdown(); self.server.server_close(); self.thread.join()
    def call(self, path, data=None, token='x'*32, content_type='image/jpeg'):
        request = urllib.request.Request(f'http://127.0.0.1:{self.server.server_port}'+path,
            data=data, headers={'Authorization':'Bearer '+token, 'Content-Type':content_type})
        try:
            response = urllib.request.urlopen(request, timeout=5)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            return response.status, json.load(response)
    def image(self):
        buffer=io.BytesIO();Image.new('RGB',(20,20)).save(buffer,format='JPEG')
        return buffer.getvalue()
    def test_auth_and_image_validation(self):
        self.assertEqual(self.call('/recognize',b'bad',token='wrong')[0],401)
        self.assertEqual(self.call('/recognize',b'bad',token='é')[0],401)
        self.assertEqual(self.call('/recognize',b'bad',content_type='text/plain')[0],415)
        self.assertEqual(self.call('/recognize',b'bad')[0],422)
    def test_result_timeout_and_busy(self):
        expected={'ingredients':[], 'uncertainItems':[], 'requiresConfirmation':True}
        with patch('server.recognize_prepared',return_value=expected):
            self.assertEqual(self.call('/recognize',self.image()),(200,expected))
        with patch('server.recognize_prepared',side_effect=TimeoutError):
            self.assertEqual(self.call('/recognize',self.image())[0],504)
        with patch('server.recognize_prepared',side_effect=ValueError):
            self.assertEqual(self.call('/recognize',self.image())[0],502)
        self.server.inference_slot.acquire()
        self.assertEqual(self.call('/recognize',self.image())[0],429)
        self.server.inference_slot.release()
    def test_health_readiness(self):
        self.assertEqual(self.call('/health')[0],200)
        with patch('server.api',return_value={'capabilities':['vision']}):
            self.assertEqual(self.call('/health/ready')[0],200)
        with patch('server.api',side_effect=OSError):
            self.assertEqual(self.call('/health/ready')[0],503)

if __name__=='__main__': unittest.main()
