#!/usr/bin/env python3
"""
Flask app runner with full error catching
"""
import sys
import os
import signal

os.chdir(r'c:\My Web Sites\Bzik.bot')
sys.path.insert(0, r'c:\My Web Sites\Bzik.bot')

print("[RUNNER] Starting Flask application runner")
sys.stdout.flush()

def signal_handler(sig, frame):
    print('\n[RUNNER] Received SIGINT, shutting down gracefully')
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

try:
    print("[RUNNER] Importing app module...")
    sys.stdout.flush()
    
    # Import app
    from app import app
    
    print("[RUNNER] App module imported successfully")
    print("[RUNNER] Starting Flask on 0.0.0.0:5000...")
    sys.stdout.flush()
    
    # Start Flask without catching exceptions 
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=False,
        use_reloader=False
    )
    
except KeyboardInterrupt:
    print('\n[RUNNER] Interrupted by user')
    sys.exit(0)
except Exception as e:
    print(f"\n[RUNNER] Exception occurred: {type(e).__name__}")
    print(f"[RUNNER] Message: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    print("[RUNNER] Exiting Flask runner")
    sys.stdout.flush()
