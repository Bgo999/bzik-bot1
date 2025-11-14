from app import app

# Test various Lily questions
questions = [
    "who is lily",
    "who is lily?",
    "who is lily ",
    "who is lily! ",
    "lily who",
    "Lily"
]

def run_tests():
    with app.test_client() as client:
        for question in questions:
            resp = client.post('/chat', json={'message': question, 'user_id': 'test'})
            print(f"Question: '{question}'")
            print(f"Response: {resp.get_json()}")
            print("---")

if __name__ == '__main__':
    run_tests()
