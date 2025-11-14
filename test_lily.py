from app import app

def run_tests():
	with app.test_client() as client:
		# Test Lily question
		resp = client.post('/chat', json={'message': 'who is lily', 'user_id': 'test'})
		print('Lily test:')
		print(f'Status: {resp.status_code}')
		print(f'Response: {resp.get_data(as_text=True)}')

		# Test joke (known working custom response)
		resp = client.post('/chat', json={'message': 'tell me a joke', 'user_id': 'test'})
		print('\nJoke test:')
		print(f'Status: {resp.status_code}')
		print(f'Response: {resp.get_data(as_text=True)}')

if __name__ == '__main__':
	run_tests()
