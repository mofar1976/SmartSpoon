import json
import unittest
from unittest.mock import patch
from recognition import InvalidModelResult, parse_model_result, recognize_prepared

VALID = {'ingredients': [{'name': 'Banane', 'evidence': 'Gelbe Frucht'}], 'uncertainItems': []}
def response(value=VALID):
    return {'done': True, 'done_reason': 'stop', 'message': {'content': json.dumps(value)}}

class ModelResultTests(unittest.TestCase):
    def test_invalid_result_categories(self):
        cases = [({'done': True, 'done_reason': 'length'}, 'MODEL_OUTPUT_TRUNCATED'),
                 ({'done': False}, 'MODEL_RESPONSE_INCOMPLETE'),
                 ({'done': True, 'message': {'content': '{'}}, 'MODEL_JSON_INVALID'),
                 (response({'ingredients': []}), 'MODEL_SCHEMA_INVALID')]
        for value, code in cases:
            with self.subTest(code=code), self.assertRaises(InvalidModelResult) as caught:
                parse_model_result(value)
            self.assertEqual(caught.exception.code, code)

    def test_one_correction_for_truncated_or_malformed_output(self):
        for invalid in ({'done': True, 'done_reason': 'length'}, response({'ingredients': []})):
            calls = []
            def api(base, endpoint, payload=None, timeout=180):
                if endpoint == '/api/ps': return {'models': []}
                calls.append((payload, timeout))
                return invalid if len(calls) == 1 else response()
            with patch('recognition.api', side_effect=api):
                result = recognize_prepared(('image', [10, 10], [10, 10]), 'http://localhost', 'model', 5)
            self.assertEqual(result['ingredients'], VALID['ingredients'])
            self.assertEqual(result['metrics']['attempts'], 2)
            self.assertEqual(len(calls), 2)
            self.assertGreater(calls[1][0]['options']['num_predict'], calls[0][0]['options']['num_predict'])
            self.assertLessEqual(calls[1][1], calls[0][1])
            self.assertEqual(calls[0][0]['messages'][0]['images'], calls[1][0]['messages'][0]['images'])

    def test_repeated_invalid_output_is_not_accepted(self):
        with patch('recognition.api', return_value={'done': True, 'done_reason': 'length'}) as api:
            with self.assertRaises(InvalidModelResult):
                recognize_prepared(('image', [10, 10], [10, 10]), 'http://localhost', 'model', 5)
        self.assertEqual(api.call_count, 2)

    def test_correction_cannot_extend_the_total_time_limit(self):
        with patch('recognition.time.perf_counter', side_effect=[0, 1, 6]), patch('recognition.api', return_value={'done': True, 'done_reason': 'length'}) as api:
            with self.assertRaises(TimeoutError):
                recognize_prepared(('image', [10, 10], [10, 10]), 'http://localhost', 'model', 5)
        self.assertEqual(api.call_count, 1)

    def test_unavailable_model_is_not_retried(self):
        with patch('recognition.api', side_effect=OSError('Unavailable')) as api:
            with self.assertRaises(OSError):
                recognize_prepared(('image', [10, 10], [10, 10]), 'http://localhost', 'model', 5)
        self.assertEqual(api.call_count, 1)

if __name__ == '__main__': unittest.main()
