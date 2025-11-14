#!/usr/bin/env python3
"""
Flask Server Launcher - Runs Flask with better error handling and logging
"""
import sys
import os
import time

# Change to app directory
app_dir = r'c:\My Web Sites\Bzik.bot'
os.chdir(app_dir)
sys.path.insert(0, app_dir)

print("=" * 80)
print("FLASK SERVER LAUNCHER")
print("=" * 80)
print(f"Working Directory: {os.getcwd()}")
print(f"Python Version: {sys.version}")
print("=" * 80)

try:
    print("\n[STARTUP] Importing Flask app...")
    from app import app, openrouter_keys, openai_available
    
    print(f"[STARTUP] ✓ App imported successfully")
    print(f"[STARTUP] ✓ OpenAI Available: {openai_available}")
    print(f"[STARTUP] ✓ API Keys Loaded: {len(openrouter_keys)}")
    
    print("\n[STARTUP] Starting Flask server...")
    print("=" * 80)
    print("[STARTUP] Flask is ready to accept connections on port 5000")
    print("[STARTUP] Endpoints: /api/health, /api/chat, /")
    print("=" * 80)
    
    # Flush output to ensure it prints before server starts
    sys.stdout.flush()
    
    # Run Flask app with explicit error handling
    try:
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=False,
            use_reloader=False,
            threaded=True
        )
    except OSError as os_err:
        print(f"\n[ERROR] OSError (Port binding issue): {os_err}")
        print("[INFO] Port 5000 might already be in use")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    except Exception as flask_err:
        print(f"\n[ERROR] Flask runtime error: {flask_err}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
except Exception as e:
    print(f"\n[ERROR] Failed to start Flask: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    print("\n[INFO] Flask launcher ended")
    sys.stdout.flush()
