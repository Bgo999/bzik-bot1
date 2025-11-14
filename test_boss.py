import requests
import json

# Test the chat API with boss question
url = 'http://127.0.0.1:5000/api/chat'
headers = {'Content-Type': 'application/json'}

# Test data
test_data = {
    'message': 'who is your boss?',
    'user_id': 'boss_test',
    'voice': 'friendly'
}

try:
    response = requests.post(url, headers=headers, json=test_data)
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
