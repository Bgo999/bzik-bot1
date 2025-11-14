#!/usr/bin/env python3
import requests
import json
import sys

print("=" * 60)
print("Testing Flask Backend")
print("=" * 60)

# Test 1: Health endpoint
print("\n[TEST 1] Health Endpoint")
print("-" * 60)
try:
    response = requests.get('http://127.0.0.1:5000/api/health', timeout=5)
    print(f"Status Code: {response.status_code}")
    data = response.json()
    print(f"Response: {json.dumps(data, indent=2)}")
    if response.status_code == 200 and data.get('ok'):
        print("✅ HEALTH CHECK PASSED")
    else:
        print("❌ HEALTH CHECK FAILED")
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)

# Test 2: Chat endpoint
print("\n[TEST 2] Chat Endpoint - Simple Message")
print("-" * 60)
try:
    payload = {
        'message': 'Hello, who is your boss?',
        'user_id': 'test_user',
        'voice': 'friendly'
    }
    response = requests.post('http://127.0.0.1:5000/api/chat', json=payload, timeout=10)
    print(f"Status Code: {response.status_code}")
    data = response.json()
    print(f"User Message: {payload['message']}")
    print(f"AI Response: {data.get('reply', 'NO RESPONSE')}")
    if response.status_code == 200 and data.get('reply'):
        print("✅ CHAT ENDPOINT PASSED")
    else:
        print("❌ CHAT ENDPOINT FAILED")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 3: Chat with custom response
print("\n[TEST 3] Chat Endpoint - Custom Response")
print("-" * 60)
try:
    payload = {
        'message': 'What is your name?',
        'user_id': 'test_user_2',
        'voice': 'friendly'
    }
    response = requests.post('http://127.0.0.1:5000/api/chat', json=payload, timeout=10)
    print(f"Status Code: {response.status_code}")
    data = response.json()
    print(f"User Message: {payload['message']}")
    print(f"AI Response: {data.get('reply', 'NO RESPONSE')}")
    if response.status_code == 200 and data.get('reply'):
        print("✅ CUSTOM RESPONSE TEST PASSED")
    else:
        print("❌ CUSTOM RESPONSE TEST FAILED")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 60)
print("All tests completed!")
print("=" * 60)
