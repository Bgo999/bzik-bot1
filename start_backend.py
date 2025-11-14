#!/usr/bin/env python3
import subprocess
import sys
import time

print("Starting Flask Backend...")
print("=" * 60)

try:
    # Start Flask app in background
    process = subprocess.Popen(
        [sys.executable, "app.py"],
        cwd=r"c:\My Web Sites\Bzik.bot",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    
    print(f"✅ Flask process started with PID: {process.pid}")
    print("=" * 60)
    
    # Read output for first 10 seconds
    start_time = time.time()
    while time.time() - start_time < 10:
        line = process.stdout.readline()
        if line:
            print(line.rstrip())
        time.sleep(0.1)
    
    print("=" * 60)
    print("✅ Flask backend started successfully!")
    print("Available endpoints:")
    print("  - GET  http://127.0.0.1:5000/api/health")
    print("  - POST http://127.0.0.1:5000/api/chat")
    print("\nPress Ctrl+C to stop the server")
    
    # Keep process alive
    process.wait()
    
except Exception as e:
    print(f"❌ Error starting Flask: {e}")
    sys.exit(1)
