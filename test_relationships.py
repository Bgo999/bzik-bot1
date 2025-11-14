from app import app

# Test all relationship questions
questions = [
    "who is kevin girlfriend",
    "who is kevin's girlfriend",
    "who is kevin's girl friend",
    "who is lily",
    "who is Lily"
]

def run_tests():
    print("Testing relationship responses:")
    print("=" * 50)
    with app.test_client() as client:
        for question in questions:
            resp = client.post('/chat', json={'message': question, 'user_id': 'test'})
            data = resp.get_json()
            print(f"Question: '{question}'")
            print(f"Answer: {data.get('reply')}")
            print("-" * 30)

if __name__ == '__main__':
    run_tests()
