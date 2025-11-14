import requests
import json
import time

def test_model_response_quality():
    """Test response quality with current model"""

    base_url = 'http://127.0.0.1:5000'
    chat_url = f'{base_url}/chat'
    headers = {'Content-Type': 'application/json'}

    test_cases = [
        {
            'name': 'Creative writing test',
            'data': {
                'message': 'Write a short poem about artificial intelligence',
                'user_id': 'quality_test_1',
                'voice': 'friendly'
            }
        },
        {
            'name': 'Technical explanation test',
            'data': {
                'message': 'Explain quantum computing in 3 sentences',
                'user_id': 'quality_test_2',
                'voice': 'professional'
            }
        },
        {
            'name': 'Problem solving test',
            'data': {
                'message': 'How would you optimize a slow database query?',
                'user_id': 'quality_test_3',
                'voice': 'professional'
            }
        }
    ]

    print("Testing response quality with current model (GPT-3.5-turbo)...")
    print("=" * 70)

    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test_case['name']}")
        print("-" * 50)

        try:
            start_time = time.time()
            response = requests.post(chat_url, headers=headers, json=test_case['data'], timeout=20)
            end_time = time.time()

            response_time = end_time - start_time
            print(f"Response time: {response_time:.2f} seconds")
            print(f"Status Code: {response.status_code}")

            if response.status_code == 200:
                try:
                    result = response.json()
                    reply = result.get('reply', 'No reply found')
                    print(f"Reply length: {len(reply)} characters")
                    print(f"Reply: {reply}")
                    print("[PASS] Response received successfully")
                except json.JSONDecodeError:
                    print(f"Raw response: {response.text}")
                    print("[FAIL] Failed to parse JSON response")
            else:
                print(f"[FAIL] HTTP Error: {response.status_code}")
                print(f"Response: {response.text}")

        except requests.exceptions.RequestException as e:
            print(f"[FAIL] Request failed: {e}")
        except Exception as e:
            print(f"[FAIL] Unexpected error: {e}")

        # Delay between tests
        time.sleep(2)

    print("\n" + "=" * 70)
    print("Quality testing completed")

if __name__ == "__main__":
    test_model_response_quality()
