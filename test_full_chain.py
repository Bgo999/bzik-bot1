#!/usr/bin/env python3
"""
Full chain test to diagnose the answers endpoint issue
"""
import requests
import json
import time
import sys
import os

# Fix Windows encoding issues
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

print("=" * 60)
print("FULL CHAIN DIAGNOSTIC TEST")
print("=" * 60)

# Test 1: Check if backend is running
print("\n[1] Testing if Flask backend is running on localhost:5000...")
try:
    response = requests.post(
        "http://localhost:5000/api/chat",
        json={"message": "Hello", "user_id": "test"},
        timeout=3
    )
    print(f"   [SUCCESS] Backend is running! Status: {response.status_code}")
    print(f"   Response: {response.text[:200]}")
except requests.exceptions.ConnectionError:
    print("   [FAILED] Cannot connect to http://localhost:5000")
    print("   SOLUTION: Start Flask backend with: python app.py")
    sys.exit(1)
except Exception as e:
    print(f"   [ERROR] Error: {e}")
    sys.exit(1)

# Test 2: Check if health endpoint works
print("\n[2] Testing health endpoint...")
try:
    response = requests.get("http://localhost:5000/api/health", timeout=3)
    print(f"   [SUCCESS] Health endpoint works! Status: {response.status_code}")
    data = response.json()
    print(f"   OpenAI Available: {data.get('openai_available')}")
    print(f"   API Keys Count: {data.get('keys')}")
    if data.get('keys') == 0:
        print("   [WARNING] No API keys configured!")
except Exception as e:
    print(f"   [ERROR] Error: {e}")

# Test 3: Send a test message
print("\n[3] Testing /api/chat endpoint...")
try:
    response = requests.post(
        "http://localhost:5000/api/chat",
        json={
            "message": "What is your name?",
            "user_id": "diagnostic_test",
            "voice": "Anna"
        },
        timeout=10
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   [SUCCESS] Got response!")
        print(f"   Reply: {data.get('reply', 'N/A')[:100]}...")
        print(f"   Voice: {data.get('selected_voice')}")
    else:
        print(f"   [ERROR] HTTP Error: {response.text}")
except requests.exceptions.Timeout:
    print("   [ERROR] Request timed out - backend might be slow or stuck")
except Exception as e:
    print(f"   [ERROR] Error: {e}")

print("\n" + "=" * 60)
print("DIAGNOSTIC COMPLETE")
print("=" * 60)
