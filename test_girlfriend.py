"""Run quick tests using Flask's test client so no external server is required.

This posts directly to the Flask `app` object in `app.py` and prints responses.
"""
from app import app
import json

def run_tests():
	with app.test_client() as client:
		# Test girlfriend question (should match CUSTOM_RESPONSES)
		resp = client.post('/chat', json={'message': 'who is kevin girlfriend', 'user_id': 'test'})
		print('Girlfriend test:')
		print(f'Status: {resp.status_code}')
		print(f'Response: {resp.get_data(as_text=True)}')

		# Test joke (known working custom response)
		resp = client.post('/chat', json={'message': 'tell me a joke', 'user_id': 'test'})
		print('\nJoke test:')
		print(f'Status: {resp.status_code}')
		print(f'Response: {resp.get_data(as_text=True)}')

if __name__ == '__main__':
	run_tests()
