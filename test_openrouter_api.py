#!/usr/bin/env python3
"""
Test script to verify OpenRouter API connectivity and response parsing
"""
import json
import requests

# List of API keys to test (from chat.py fallback)
API_KEYS = [
    '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',
    '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',
    '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',
    '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',
]

MODELS_TO_TEST = [
    'openai/gpt-3.5-turbo',
    'openai/gpt-4',
    'deepseek/deepseek-chat',
]

def test_api(api_key, model='openai/gpt-3.5-turbo'):
    """Test a single API key with a given model"""
    url = 'https://openrouter.ai/api/v1/chat/completions'
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}'
    }
    payload = {
        'model': model,
        'messages': [
            {'role': 'system', 'content': 'You are a helpful assistant.'},
            {'role': 'user', 'content': 'Say hello in one word.'}
        ],
        'max_tokens': 50,
        'temperature': 0.5
    }
    
    try:
        print(f"\n📡 Testing {model} with key {api_key[:20]}...")
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            reply = data.get('choices', [{}])[0].get('message', {}).get('content', '').strip()
            print(f"   ✅ Success! Reply: {reply[:50]}")
            return True
        else:
            error_text = response.text[:200]
            print(f"   ❌ Error: {error_text}")
            return False
    except Exception as e:
        print(f"   ❌ Exception: {str(e)[:100]}")
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("OpenRouter API Connectivity Test")
    print("=" * 60)
    
    success_count = 0
    total_tests = len(API_KEYS) * len(MODELS_TO_TEST)
    
    for model in MODELS_TO_TEST:
        print(f"\n🔧 Testing model: {model}")
        for key in API_KEYS:
            if test_api(key, model):
                success_count += 1
                print(f"   ✅ Model {model} works with this key!")
                break  # Found a working key for this model
    
    print("\n" + "=" * 60)
    print(f"Summary: {success_count}/{len(MODELS_TO_TEST)} models have working keys")
    print("=" * 60)
