import main
from fastapi.testclient import TestClient

client = TestClient(main.app)

def test_chat_intents():
    test_queries = [
        ("How many accidents in Mumbai?", "STATS"),
        ("Compare Delhi vs Mumbai", "COMPARISON"),
        ("Top 5 cities by fatal accidents", "TOP_N"),
        ("What time has the most accidents?", "TIME"),
        ("How does fog affect severity?", "WEATHER"),
        ("What causes the most fatal accidents?", "CAUSE"),
        ("Predict severity for fog + highway + drunk", "PREDICTION"),
        ("What is risk score?", "DEFINITION"),
        ("Take me to hotspot map", "NAVIGATION"),
        ("What can you do?", "HELP")
    ]

    print("Running Chatbot Intent Test Suite...\n")
    for msg, expected_intent in test_queries:
        r = client.post("/chat/message", json={"message": msg})
        assert r.status_code == 200, f"Error {r.status_code}: {r.text}"
        data = r.json()
        assert "reply" in data and len(data["reply"]) > 0
        assert data["intent"] == expected_intent, f"Expected {expected_intent}, got {data['intent']}"
        print(f"PASS: [{data['intent']}] '{msg}' -> Reply length: {len(data['reply'])}, Suggestions: {len(data['suggestions'])}, Actions: {len(data['actions'])}")

    print("\nTesting /api/chat/message alias endpoint...")
    r_alias = client.post("/api/chat/message", json={"message": "Top 3 cities"})
    assert r_alias.status_code == 200
    print("PASS: /api/chat/message alias working properly!")

    print("\nALL 10 CHATBOT INTENT TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_chat_intents()
