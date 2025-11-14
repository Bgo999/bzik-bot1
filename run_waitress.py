#!/usr/bin/env python3
import sys
from app import app

if __name__ == '__main__':
    # Import waitress
    try:
        from waitress import serve
        print("Starting Flask backend with Waitress on http://0.0.0.0:5000")
        serve(app, host='0.0.0.0', port=5000, threads=4)
    except ImportError:
        print("Waitress not installed. Falling back to Flask development server.")
        app.run(host='0.0.0.0', port=5000, debug=False)
