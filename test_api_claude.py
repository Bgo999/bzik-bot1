import requests

url = "http://localhost:5000/chat"
payload = {
    "message": "Hello, how are you?",
    "voice": "Anna",
    "user_id": "apitest"
}
response = requests.post(url, json=payload)
print("Status:", response.status_code)
print("Response:", response.json())
