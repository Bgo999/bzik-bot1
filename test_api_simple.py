import requests
import json

# Test the chat API
url = 'http://127.0.0.1:5000/api/chat'
headers = {'Content-Type': 'application/json'}

# Test data
test_data = {
    'message': 'Hello, how are you today?',
    'user_id': 'debug_test',
    'voice': 'friendly'
}

try:
    response = requests.post(url, headers=headers, json=test_data)
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
