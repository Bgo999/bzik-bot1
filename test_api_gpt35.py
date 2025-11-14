import requests

url = "http://localhost:5000/chat"
payload = {
    "message": "Hello, are you using GPT-3.5?",
    "voice": "Anna",
    "user_id": "apitest"
}
response = requests.post(url, json=payload)
print("Status:", response.status_code)
print("Response:", response.json())
