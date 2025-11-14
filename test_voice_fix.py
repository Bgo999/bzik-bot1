#!/usr/bin/env python3
"""
Test script to verify the chat API is working correctly
Tests duplicate prevention and response handling
"""

import requests
import json
import time

BASE_URL = "http://localhost:5000"

def test_basic_chat():
    """Test basic chat functionality"""
    print("\n=== TEST 1: Basic Chat ===")
    response = requests.post(
        f"{BASE_URL}/chat",
        json={"message": "Hello", "user_id": "test_user_1"}
    )
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Reply: {data.get('reply')}")
    return response.status_code == 200

def test_duplicate_prevention():
    """Test that duplicate messages are blocked"""
    print("\n=== TEST 2: Duplicate Prevention (Same message within 10s) ===")
    
    user_id = "test_user_2"
    message = "What is your name?"
    
    # Send first message
    print(f"Sending: '{message}'")
    response1 = requests.post(
        f"{BASE_URL}/chat",
        json={"message": message, "user_id": user_id}
    )
    reply1 = response1.json().get('reply')
    print(f"Reply 1: {reply1}")
    
    # Immediately send same message again (should be blocked)
    print(f"Sending same message again immediately...")
    response2 = requests.post(
        f"{BASE_URL}/chat",
        json={"message": message, "user_id": user_id}
    )
    reply2 = response2.json().get('reply')
    print(f"Reply 2: {reply2}")
    
    # Check if replies are identical (duplicate blocked)
    if reply1 == reply2:
        print("✅ PASS: Duplicate message returned cached response")
        return True
    else:
        print("❌ FAIL: Different responses for same message")
        return False

def test_different_messages():
    """Test that different messages work"""
    print("\n=== TEST 3: Different Messages ===")
    
    user_id = "test_user_3"
    
    # Send first message
    print("Sending: 'Hi'")
    response1 = requests.post(
        f"{BASE_URL}/chat",
        json={"message": "Hi", "user_id": user_id}
    )
    reply1 = response1.json().get('reply')
    print(f"Reply 1: {reply1}")
    
    # Send different message
    print("Sending: 'Who is Bagrat?'")
    response2 = requests.post(
        f"{BASE_URL}/chat",
        json={"message": "Who is Bagrat?", "user_id": user_id}
    )
    reply2 = response2.json().get('reply')
    print(f"Reply 2: {reply2}")
    
    if reply1 != reply2:
        print("✅ PASS: Different messages got different responses")
        return True
    else:
        print("❌ FAIL: Same response for different messages")
        return False

def test_repeated_after_window():
    """Test that message can be repeated after 10 second window"""
    print("\n=== TEST 4: Message After 10 Second Window ===")
    
    user_id = "test_user_4"
    message = "Hey!"
    
    # Send first message
    print(f"Sending: '{message}'")
    response1 = requests.post(
        f"{BASE_URL}/chat",
        json={"message": message, "user_id": user_id}
    )
    reply1 = response1.json().get('reply')
    print(f"Reply 1: {reply1}")
    
    # Wait 11 seconds
    print("Waiting 11 seconds for duplicate window to expire...")
    time.sleep(11)
    
    # Send same message again
    print(f"Sending same message again after 11 seconds...")
    response2 = requests.post(
        f"{BASE_URL}/chat",
        json={"message": message, "user_id": user_id}
    )
    reply2 = response2.json().get('reply')
    print(f"Reply 2: {reply2}")
    
    # Both should succeed, but might have different sources
    if response1.status_code == 200 and response2.status_code == 200:
        print("✅ PASS: Both messages processed successfully after window")
        return True
    else:
        print("❌ FAIL: Second message failed")
        return False

def test_health():
    """Test health endpoint"""
    print("\n=== TEST 5: Health Check ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Response: {data}")
    return response.status_code == 200

if __name__ == "__main__":
    print("🧪 Testing Bzik AI Backend - Duplicate Prevention")
    print(f"Testing against: {BASE_URL}")
    
    results = []
    
    try:
        results.append(("Health Check", test_health()))
        results.append(("Basic Chat", test_basic_chat()))
        results.append(("Duplicate Prevention", test_duplicate_prevention()))
        results.append(("Different Messages", test_different_messages()))
        results.append(("Repeated After Window", test_repeated_after_window()))
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("Make sure Flask is running on http://localhost:5000")
    
    # Summary
    print("\n" + "="*50)
    print("TEST SUMMARY")
    print("="*50)
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    passed_count = sum(1 for _, p in results if p)
    total_count = len(results)
    print(f"\nResult: {passed_count}/{total_count} tests passed")
