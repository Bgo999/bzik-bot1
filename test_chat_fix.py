import requests
import json
import sys
import os

# Add the current directory to the path so we can import from app.py if needed
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Test the chat functionality
def test_chat_endpoint():
    """Test the chat endpoint with various scenarios"""

    base_url = 'http://127.0.0.1:5000'
    chat_url = f'{base_url}/chat'
    headers = {'Content-Type': 'application/json'}

    test_cases = [
        {
            'name': 'Basic chat test',
            'data': {
                'message': 'Hello, who are you?',
                'user_id': 'test_user',
                'voice': 'friendly'
            }
        },
        {
            'name': 'Custom response test',
            'data': {
                'message': 'what is your name?',
                'user_id': 'test_user',
                'voice': 'friendly'
            }
        },
        {
            'name': 'Business features test',
            'data': {
                'message': 'tell me about your business features',
                'user_id': 'test_user',
                'voice': 'professional'
            }
        }
    ]

    print("Testing chat functionality...")
    print("=" * 50)

    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test_case['name']}")
        print("-" * 30)

        try:
            response = requests.post(chat_url, headers=headers, json=test_case['data'], timeout=10)

            print(f"Status Code: {response.status_code}")

            if response.status_code == 200:
                try:
                    result = response.json()
                    reply = result.get('reply', 'No reply found')
                    print(f"Reply: {reply}")
                    print("[PASS] Test passed")
                except json.JSONDecodeError:
                    print(f"Raw response: {response.text}")
                    print("[FAIL] Failed to parse JSON response")
            else:
                print(f"[FAIL] HTTP Error: {response.status_code}")
                print(f"Response: {response.text}")

        except requests.exceptions.RequestException as e:
            print(f"[FAIL] Request failed: {e}")
            print("Note: Make sure the Flask server is running with 'python app.py'")
        except Exception as e:
            print(f"[FAIL] Unexpected error: {e}")

    print("\n" + "=" * 50)
    print("Chat testing completed")

if __name__ == "__main__":
    test_chat_endpoint()
