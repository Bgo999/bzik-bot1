import requests
import json
import time

def test_comprehensive_chat():
    """Comprehensive test of chat functionality"""

    base_url = 'http://127.0.0.1:5000'
    chat_url = f'{base_url}/chat'
    headers = {'Content-Type': 'application/json'}

    test_cases = [
        {
            'name': 'Memory test - conversation continuity',
            'data': {
                'message': 'My name is John',
                'user_id': 'memory_test_user',
                'voice': 'friendly'
            }
        },
        {
            'name': 'Memory test - follow up',
            'data': {
                'message': 'What is my name?',
                'user_id': 'memory_test_user',
                'voice': 'friendly'
            }
        },
        {
            'name': 'Different voice test',
            'data': {
                'message': 'Tell me about business features',
                'user_id': 'voice_test_user',
                'voice': 'professional'
            }
        },
        {
            'name': 'Complex query test',
            'data': {
                'message': 'Can you explain how AI works in simple terms?',
                'user_id': 'complex_test_user',
                'voice': 'friendly'
            }
        }
    ]

    print("Running comprehensive chat tests...")
    print("=" * 60)

    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test_case['name']}")
        print("-" * 40)

        try:
            response = requests.post(chat_url, headers=headers, json=test_case['data'], timeout=15)

            print(f"Status Code: {response.status_code}")

            if response.status_code == 200:
                try:
                    result = response.json()
                    reply = result.get('reply', 'No reply found')
                    print(f"Reply: {reply[:200]}..." if len(reply) > 200 else f"Reply: {reply}")
                    print("[PASS] Test passed")
                except json.JSONDecodeError:
                    print(f"Raw response: {response.text}")
                    print("[FAIL] Failed to parse JSON response")
            else:
                print(f"[FAIL] HTTP Error: {response.status_code}")
                print(f"Response: {response.text}")

        except requests.exceptions.RequestException as e:
            print(f"[FAIL] Request failed: {e}")
            print("Note: Make sure the Flask server is running")
        except Exception as e:
            print(f"[FAIL] Unexpected error: {e}")

        # Small delay between tests
        time.sleep(1)

    print("\n" + "=" * 60)
    print("Comprehensive testing completed")

if __name__ == "__main__":
    test_comprehensive_chat()
