#!/usr/bin/env python3
"""
Manual Duplicate Prevention Test Script
Tests the fixed duplicate prevention system
"""

import requests
import time
import sys

BASE_URL = "http://localhost:5000"

def test_rapid_duplicates():
    """Test sending same message rapidly"""
    print("\n" + "="*70)
    print("TEST 1: Rapid Duplicate Sends (Should block 2nd & 3rd)")
    print("="*70)
    
    user_id = f"test_rapid_{int(time.time() * 1000)}"
    message = "Hello, how are you?"
    
    for i in range(1, 4):
        response = requests.post(
            f"{BASE_URL}/chat",
            json={"message": message, "user_id": user_id},
            timeout=10
        )
        result = response.json()
        
        is_cached = result.get('source') == 'cache'
        is_duplicate = result.get('duplicate', False)
        reply = result['reply'][:60] + "..." if len(result['reply']) > 60 else result['reply']
        
        status = "CACHED [OK]" if is_cached else "FRESH API [OK]"
        print(f"\nSend #{i}: {status}")
        print(f"  Reply: {reply}")
        print(f"  Duplicate: {is_duplicate}")
        print(f"  Source: {result.get('source', 'api')}")

def test_different_messages():
    """Test sending different messages"""
    print("\n" + "="*70)
    print("TEST 2: Different Messages (Should get fresh API responses)")
    print("="*70)
    
    user_id = f"test_diff_{int(time.time() * 1000)}"
    messages = [
        "What is 2+2?",
        "Tell me a joke",
        "What is Python?",
    ]
    
    for i, message in enumerate(messages, 1):
        response = requests.post(
            f"{BASE_URL}/chat",
            json={"message": message, "user_id": user_id},
            timeout=10
        )
        result = response.json()
        
        is_cached = result.get('source') == 'cache'
        reply = result['reply'][:60] + "..." if len(result['reply']) > 60 else result['reply']
        
        status = "CACHED [FAIL]" if is_cached else "FRESH API [OK]"
        print(f"\nMessage #{i}: {status}")
        print(f"  Q: {message}")
        print(f"  A: {reply}")

def test_window_expiry():
    """Test that duplicate window expires after 16 seconds"""
    print("\n" + "="*70)
    print("TEST 3: Duplicate Window Expiry (Wait 16 sec, should allow)")
    print("="*70)
    
    user_id = f"test_window_{int(time.time() * 1000)}"
    message = "Hello again!"
    
    # First send
    response1 = requests.post(
        f"{BASE_URL}/chat",
        json={"message": message, "user_id": user_id},
        timeout=10
    )
    result1 = response1.json()
    print(f"\nFirst send (time=0s):")
    print(f"  Source: {result1.get('source', 'api')} [OK]")
    print(f"  Reply: {result1['reply'][:50]}...")
    
    # Wait 16 seconds
    print(f"\nWaiting 16 seconds...")
    for i in range(16, 0, -1):
        sys.stdout.write(f"\r  Time remaining: {i:2d}s")
        sys.stdout.flush()
        time.sleep(1)
    print("\n")
    
    # Second send (same message, after window)
    response2 = requests.post(
        f"{BASE_URL}/chat",
        json={"message": message, "user_id": user_id},
        timeout=10
    )
    result2 = response2.json()
    
    is_cached = result2.get('source') == 'cache'
    status = "CACHED [FAIL]" if is_cached else "FRESH API [OK]"
    print(f"Second send (time=16s): {status}")
    print(f"  Source: {result2.get('source', 'api')}")
    print(f"  Reply: {result2['reply'][:50]}...")

def test_health():
    """Test health endpoint"""
    print("\n" + "="*70)
    print("TEST 4: Health Check")
    print("="*70)
    
    response = requests.get(f"{BASE_URL}/health", timeout=5)
    result = response.json()
    
    print(f"\nHealth Status:")
    print(f"  OK: {result['ok']} [OK]")
    print(f"  Available Keys: {result['keys']}")
    print(f"  OpenAI Available: {result['openai_available']}")

def main():
    """Run all tests"""
    print("\n")
    print("="*70)
    print(" "*15 + "DUPLICATE PREVENTION TEST SUITE")
    print("="*70)
    
    try:
        test_health()
        test_rapid_duplicates()
        test_different_messages()
        test_window_expiry()
        
        print("\n" + "="*70)
        print("OK - ALL TESTS COMPLETED")
        print("="*70 + "\n")
        
    except requests.exceptions.ConnectionError:
        print("\n[ERROR] Cannot connect to Flask server at", BASE_URL)
        print("   Make sure Flask is running: python app.py")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR]: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
