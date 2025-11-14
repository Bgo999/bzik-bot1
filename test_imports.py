try:
    import flask
    print("Flask: OK")
except ImportError as e:
    print(f"Flask: FAILED - {e}")

try:
    import flask_cors
    print("Flask-CORS: OK")
except ImportError as e:
    print(f"Flask-CORS: FAILED - {e}")

try:
    import openai
    print("OpenAI: OK")
except ImportError as e:
    print(f"OpenAI: FAILED - {e}")

print("Import test completed")
