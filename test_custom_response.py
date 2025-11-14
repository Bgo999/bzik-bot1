import requests
import json

url = 'http://127.0.0.1:5000/api/chat'
headers = {'Content-Type': 'application/json'}

# Test custom response
test_data = {
    'message': 'what is your name?',
    'user_id': 'test_user',
    'voice': 'friendly'
}

response = requests.post(url, headers=headers, json=test_data)
print(f'Status Code: {response.status_code}')
print('Response:')
print(response.text)
