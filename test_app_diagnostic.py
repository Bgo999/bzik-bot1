#!/usr/bin/env python3
"""
Quick diagnostic to test Bzik Flask app
"""
import time
import requests
import json

print("=" * 60)
print("🔍 Bzik Bot - Flask App Diagnostic")
print("=" * 60)

time.sleep(3)  # Give Flask time to start

# Test endpoints
endpoints = [
    ("GET", "http://localhost:5000/health", None),
    ("POST", "http://localhost:5000/api/chat", {
        "message": "Hello Bzik!",
        "user_id": "test_user",
        "voice": "friendly"
    }),
]

for method, url, data in endpoints:
    try:
        print(f"\n🧪 Testing: {method} {url}")
        if method == "GET":
            response = requests.get(url, timeout=5)
        else:
            response = requests.post(url, json=data, timeout=5)
        
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("   ✅ SUCCESS")
        else:
            print(f"   ⚠️  WARNING: Status {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ ERROR: {e}")

print("\n" + "=" * 60)
print("✅ Diagnostic Complete")
print("=" * 60)
