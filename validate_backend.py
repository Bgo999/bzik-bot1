#!/usr/bin/env python3
"""
Quick validation script to check if Bzik backend is properly configured
and the 'answers' endpoint is accessible.

Run this to diagnose any connection issues.
"""

import sys
import os
import subprocess
import socket
import time
import requests
import json

def check_python():
    """Check Python version"""
    print("[OK] Python {} installed".format(sys.version.split()[0]))
    return True

def check_dependencies():
    """Check required packages"""
    packages = ['flask', 'flask_cors', 'requests']
    for pkg in packages:
        try:
            __import__(pkg)
            print("[OK] {} available".format(pkg))
        except ImportError:
            print("[FAIL] {} NOT installed".format(pkg))
            return False
    return True

def check_openrouter_keys():
    """Check if OpenRouter API keys are configured"""
    try:
        from openrouter_keys_local import OPENROUTER_API_KEYS
        count = len(OPENROUTER_API_KEYS)
        if count > 0:
            print("[OK] Found {} OpenRouter API keys (local)".format(count))
            return True
    except ImportError:
        pass
    
    env_keys = os.getenv('OPENROUTER_API_KEYS', '')
    if env_keys:
        count = len([k.strip() for k in env_keys.split(',') if k.strip()])
        print("[OK] Found {} OpenRouter API keys (environment)".format(count))
        return True
    
    print("[FAIL] No OpenRouter API keys configured")
    print("  Add OPENROUTER_API_KEYS environment variable or create openrouter_keys_local.py")
    return False

def check_port_available(port=5000):
    """Check if port is available"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', port))
    sock.close()
    
    if result != 0:
        print("[OK] Port {} is available".format(port))
        return True
    else:
        print("[FAIL] Port {} is already in use".format(port))
        return False

def test_endpoint():
    """Test the chat endpoint"""
    try:
        response = requests.post(
            "http://localhost:5000/api/chat",
            json={
                "message": "test",
                "user_id": "validation",
                "voice": "Anna"
            },
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            if 'reply' in data:
                print("[OK] Endpoint responding correctly")
                print("  Sample reply: '{}'...".format(data['reply'][:50]))
                return True
            else:
                print("[FAIL] Response missing 'reply' field")
                print("  Got: {}".format(data))
                return False
        else:
            print("[FAIL] Endpoint returned {}".format(response.status_code))
            return False
    except requests.exceptions.ConnectionError:
        print("[FAIL] Cannot connect to http://localhost:5000")
        print("  Backend is not running")
        return False
    except Exception as e:
        print("[FAIL] Error testing endpoint: {}".format(e))
        return False

def main():
    print("=" * 60)
    print("BZIK BACKEND VALIDATION")
    print("=" * 60)
    print()
    
    checks = [
        ("Python Setup", check_python),
        ("Dependencies", check_dependencies),
        ("API Keys", check_openrouter_keys),
        ("Port Availability", lambda: check_port_available()),
    ]
    
    results = []
    for name, check_func in checks:
        print("\n[{}]".format(name))
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print("[ERROR] Error: {}".format(e))
            results.append((name, False))
    
    # Test endpoint only if backend might be running
    if all(r for _, r in results):
        print("\n[Backend Endpoint]")
        endpoint_ok = test_endpoint()
        results.append(("Endpoint", endpoint_ok))
    
    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    for name, result in results:
        status = "PASS" if result else "FAIL"
        print("[{}] {}".format(status, name))
    
    if all(r for _, r in results):
        print()
        print("SUCCESS: All checks passed! Backend is ready.")
        return 0
    else:
        print()
        print("ERROR: Some checks failed. See details above.")
        print()
        print("NEXT STEPS:")
        print("1. Install missing dependencies: pip install -r requirements.txt")
        print("2. Set OPENROUTER_API_KEYS environment variable")
        print("3. Start backend: python app.py")
        return 1

if __name__ == "__main__":
    sys.exit(main())
