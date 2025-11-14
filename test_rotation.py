#!/usr/bin/env python3
"""
Test script to verify API key rotation works correctly
Tests with real OpenRouter API
"""
import json
import requests
import time

API_KEYS = [
    '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',
    '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',
    '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',
    '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',
]

def test_single_key(api_key, key_index):
    """Test a single API key"""
    url = 'https://openrouter.ai/api/v1/chat/completions'
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}'
    }
    payload = {
        'model': 'openai/gpt-3.5-turbo',
        'messages': [
            {'role': 'system', 'content': 'You are a helpful assistant.'},
            {'role': 'user', 'content': 'Say hello briefly.'}
        ],
        'max_tokens': 50,
        'temperature': 0.5
    }
    
    try:
        print(f"\n🔑 Key {key_index}: {api_key[:20]}...")
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            reply = data.get('choices', [{}])[0].get('message', {}).get('content', '').strip()
            print(f"   ✅ SUCCESS - Reply: {reply[:50]}")
            return True
        elif response.status_code == 402:
            print(f"   ⚠️  402 INSUFFICIENT CREDITS - Should rotate to end")
            return False
        elif response.status_code == 429:
            print(f"   ⚠️  429 RATE LIMITED - Should rotate to end")
            return False
        else:
            error = response.text[:100]
            print(f"   ❌ Error {response.status_code}: {error}")
            return False
    except Exception as e:
        print(f"   ❌ Exception: {str(e)[:80]}")
        return False

def simulate_rotation(keys):
    """Simulate key rotation logic"""
    print("\n" + "="*60)
    print("Testing Key Rotation Logic")
    print("="*60)
    
    working_keys = []
    failed_keys = []
    
    for idx, key in enumerate(keys):
        success = test_single_key(key, idx)
        if success:
            working_keys.append((idx, key))
        else:
            failed_keys.append((idx, key))
        time.sleep(0.5)  # Rate limit ourselves
    
    print("\n" + "="*60)
    print(f"Results: {len(working_keys)} working, {len(failed_keys)} failed")
    print("="*60)
    
    if working_keys:
        print(f"\n✅ ROTATION WILL WORK - Found {len(working_keys)} working key(s):")
        for idx, key in working_keys:
            print(f"   - Key {idx}: {key[:20]}...")
    else:
        print(f"\n❌ NO WORKING KEYS - All {len(keys)} keys failed")
    
    return len(working_keys) > 0

if __name__ == '__main__':
    print("="*60)
    print("OpenRouter API Key Rotation Test")
    print("="*60)
    
    success = simulate_rotation(API_KEYS)
    
    if success:
        print("\n✅ Rotation should work fine!")
    else:
        print("\n❌ No working keys available - need new API keys!")
