#!/usr/bin/env python3
import sys
import traceback

try:
    from app import app
    print("App imported successfully, starting server...", flush=True)
    app.run(host='127.0.0.1', port=3000, debug=False, use_reloader=False, threaded=True)
except Exception as e:
    print(f"ERROR: {e}", flush=True)
    traceback.print_exc()
    sys.exit(1)
