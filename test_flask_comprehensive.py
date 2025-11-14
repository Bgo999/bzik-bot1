#!/usr/bin/env python3
"""
Comprehensive Flask Backend Test Suite
"""
import requests
import json
import time
import sys

# Configuration
BASE_URL = "http://192.168.1.101:5000"
HEALTH_ENDPOINT = f"{BASE_URL}/api/health"
CHAT_ENDPOINT = f"{BASE_URL}/api/chat"
TIMEOUT = 10

print("\n" + "="*80)
print("FLASK BACKEND COMPREHENSIVE TEST SUITE")
print("="*80)
print(f"Base URL: {BASE_URL}")
print(f"Timeout: {TIMEOUT}s")
print("="*80 + "\n")

test_results = {
    "passed": 0,
    "failed": 0,
    "tests": []
}

def run_test(name, test_func):
    """Helper to run a test and record results"""
    print(f"\n[TEST] {name}")
    print("-" * 80)
    try:
        result = test_func()
        if result:
            print(f"✓ PASSED: {name}")
            test_results["passed"] += 1
            test_results["tests"].append({"name": name, "status": "PASSED", "result": result})
        else:
            print(f"✗ FAILED: {name}")
            test_results["failed"] += 1
            test_results["tests"].append({"name": name, "status": "FAILED", "result": "Test returned False"})
        return result
    except Exception as e:
        print(f"✗ FAILED: {name} - {e}")
        test_results["failed"] += 1
        test_results["tests"].append({"name": name, "status": "FAILED", "result": str(e)})
        return False

# Test 1: Health Check
def test_health():
    response = requests.get(HEALTH_ENDPOINT, timeout=TIMEOUT)
    data = response.json()
    print(f"  Status Code: {response.status_code}")
    print(f"  Response: {json.dumps(data, indent=2)}")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert data.get('ok') == True, "ok should be True"
    assert data.get('keys') > 0, "Should have API keys"
    assert data.get('openai_available') == True, "OpenAI should be available"
    return data

# Test 2: Chat - Boss Question (Custom Response)
def test_chat_boss():
    payload = {
        'message': 'who is your boss?',
        'user_id': 'test_user_boss',
        'voice': 'friendly'
    }
    response = requests.post(CHAT_ENDPOINT, json=payload, timeout=TIMEOUT)
    data = response.json()
    print(f"  Status Code: {response.status_code}")
    print(f"  Question: {payload['message']}")
    print(f"  Response: {data.get('reply')}")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert data.get('reply'), "Should have a reply"
    assert 'Bagrat' in data.get('reply', ''), "Should mention Bagrat"
    return data

# Test 3: Chat - Name Question (Custom Response)
def test_chat_name():
    payload = {
        'message': 'what is your name?',
        'user_id': 'test_user_name',
        'voice': 'friendly'
    }
    response = requests.post(CHAT_ENDPOINT, json=payload, timeout=TIMEOUT)
    data = response.json()
    print(f"  Status Code: {response.status_code}")
    print(f"  Question: {payload['message']}")
    print(f"  Response: {data.get('reply')}")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert data.get('reply'), "Should have a reply"
    assert 'Bzik' in data.get('reply', ''), "Should mention Bzik"
    return data

# Test 4: Chat - General Question (API Response)
def test_chat_general():
    payload = {
        'message': 'Hello, what can you help me with?',
        'user_id': 'test_user_general',
        'voice': 'friendly'
    }
    response = requests.post(CHAT_ENDPOINT, json=payload, timeout=TIMEOUT)
    data = response.json()
    print(f"  Status Code: {response.status_code}")
    print(f"  Question: {payload['message']}")
    print(f"  Response: {data.get('reply')[:100]}...")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert data.get('reply'), "Should have a reply"
    assert len(data.get('reply', '')) > 10, "Reply should be substantive"
    return data

# Test 5: Chat - Professional Voice
def test_chat_professional():
    payload = {
        'message': 'Tell me about your business features',
        'user_id': 'test_user_prof',
        'voice': 'professional'
    }
    response = requests.post(CHAT_ENDPOINT, json=payload, timeout=TIMEOUT)
    data = response.json()
    print(f"  Status Code: {response.status_code}")
    print(f"  Voice: professional")
    print(f"  Question: {payload['message']}")
    print(f"  Response: {data.get('reply')[:150]}...")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert data.get('reply'), "Should have a reply"
    return data

# Test 6: Multiple Messages from Same User (Memory)
def test_chat_memory():
    user_id = 'test_user_memory'
    
    # First message
    payload1 = {
        'message': 'My name is Alice',
        'user_id': user_id,
        'voice': 'friendly'
    }
    response1 = requests.post(CHAT_ENDPOINT, json=payload1, timeout=TIMEOUT)
    data1 = response1.json()
    print(f"  First Message: {payload1['message']}")
    print(f"  Response: {data1.get('reply')}")
    
    # Second message (should have memory of first)
    payload2 = {
        'message': 'Do you remember my name?',
        'user_id': user_id,
        'voice': 'friendly'
    }
    response2 = requests.post(CHAT_ENDPOINT, json=payload2, timeout=TIMEOUT)
    data2 = response2.json()
    print(f"  Second Message: {payload2['message']}")
    print(f"  Response: {data2.get('reply')}")
    
    assert response1.status_code == 200, "First message failed"
    assert response2.status_code == 200, "Second message failed"
    assert data1.get('reply'), "First reply empty"
    assert data2.get('reply'), "Second reply empty"
    return {"msg1": data1, "msg2": data2}

# Test 7: Error Handling - Missing Message
def test_error_missing_message():
    payload = {
        'user_id': 'test_error',
        'voice': 'friendly'
        # Missing 'message' field
    }
    response = requests.post(CHAT_ENDPOINT, json=payload, timeout=TIMEOUT)
    data = response.json()
    print(f"  Status Code: {response.status_code}")
    print(f"  Response: {data.get('reply')}")
    assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    assert 'message' in data.get('reply', '').lower(), "Should mention missing message"
    return data

# Run all tests
print("\n[RUNNING TESTS]\n")

run_test("Health Check Endpoint", test_health)
time.sleep(1)

run_test("Chat - Boss Question (Custom Response)", test_chat_boss)
time.sleep(1)

run_test("Chat - Name Question (Custom Response)", test_chat_name)
time.sleep(1)

run_test("Chat - General Question (API Response)", test_chat_general)
time.sleep(1)

run_test("Chat - Professional Voice", test_chat_professional)
time.sleep(1)

run_test("Chat - Memory Persistence", test_chat_memory)
time.sleep(1)

run_test("Error Handling - Missing Message", test_error_missing_message)

# Print Summary
print("\n\n" + "="*80)
print("TEST SUMMARY")
print("="*80)
print(f"Total Tests: {test_results['passed'] + test_results['failed']}")
print(f"Passed: {test_results['passed']} ✓")
print(f"Failed: {test_results['failed']} ✗")
print("="*80)

if test_results['failed'] == 0:
    print("\n✓ ALL TESTS PASSED!")
    sys.exit(0)
else:
    print(f"\n✗ {test_results['failed']} tests failed")
    sys.exit(1)
