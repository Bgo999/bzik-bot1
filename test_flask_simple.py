#!/usr/bin/env python3
import sys
import traceback

print("Starting test Flask app...", flush=True)
sys.stdout.flush()

try:
    from flask import Flask
    print("Flask imported", flush=True)
    
    app = Flask(__name__)
    print("App created", flush=True)
    
    @app.route('/test')
    def test():
        return {'status': 'ok'}
    
    print("Route registered", flush=True)
    sys.stdout.flush()
    
    print("Starting server on port 3000...", flush=True)
    sys.stdout.flush()
    
    app.run(host='127.0.0.1', port=3000, debug=False, use_reloader=False)
    
except Exception as e:
    print(f"ERROR: {e}", flush=True)
    traceback.print_exc()
    sys.exit(1)
