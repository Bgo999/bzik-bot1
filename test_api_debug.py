#!/usr/bin/env python3
import sys
import json
import traceback

# Test OpenRouter API directly
from openai import OpenAI
from openrouter_keys_local import OPENROUTER_API_KEYS

print(f"Testing with {len(OPENROUTER_API_KEYS)} OpenRouter keys...")

for attempt, key in enumerate(OPENROUTER_API_KEYS):
    print(f"\n{'='*60}")
    print(f"Attempt {attempt + 1}: Testing key {key[:20]}...")
    print(f"{'='*60}")
    
    try:
        client = OpenAI(api_key=key, base_url="https://openrouter.ai/api/v1")
        
        response = client.chat.completions.create(
            model="openai/gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say 'Hello, this is a test!' and nothing else."}
            ],
            max_tokens=50,
            temperature=0.5
        )
        
        reply = response.choices[0].message.content.strip()
        print(f"✓ SUCCESS! Got reply: {reply}")
        break
        
    except Exception as err:
        error_str = str(err)
        print(f"✗ FAILED with error:")
        print(f"  {error_str}")
        print(f"\nFull traceback:")
        traceback.print_exc()
        
        if "rate limit" in error_str.lower() or "quota" in error_str.lower():
            print(f"  → This key is rate-limited or quota-exhausted")
        elif "401" in error_str or "authentication" in error_str.lower():
            print(f"  → This key failed authentication (invalid or revoked)")
        elif "429" in error_str:
            print(f"  → HTTP 429 Too Many Requests (rate limited)")
        
        print()

print(f"\n{'='*60}")
print("Testing complete!")
