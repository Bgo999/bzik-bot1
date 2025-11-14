#!/usr/bin/env python3
"""
Simple Flask startup wrapper that stays in foreground
"""
import sys
import os

# Change to app directory
os.chdir(r'c:\My Web Sites\Bzik.bot')

# Import and run Flask app directly
if __name__ == '__main__':
    from app import app
    print("=" * 70)
    print("FLASK BACKEND STARTED")
    print("=" * 70)
    print("Endpoints available:")
    print("  GET  http://127.0.0.1:5000/api/health")
    print("  POST http://127.0.0.1:5000/api/chat")
    print("=" * 70)
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False, threaded=True)
