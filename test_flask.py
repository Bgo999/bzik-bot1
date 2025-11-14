import requests
import json

url = 'http://127.0.0.1:5000/chat'
headers = {'Content-Type': 'application/json'}
data = {
    'message': 'Show me some use cases',
    'user_id': 'test',
    'voice': 'friendly'
}

try:
    response = requests.post(url, headers=headers, json=data)
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
