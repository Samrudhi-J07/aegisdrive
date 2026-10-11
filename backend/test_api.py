import main
from fastapi.testclient import TestClient

client = TestClient(main.app)

def test_api_endpoints():
    print("Testing / ...")
    r = client.get("/")
    assert r.status_code == 200, f"Error: {r.text}"
    print("Root OK:", r.json())

    print("Testing /api/analytics/summary ...")
    r = client.get("/api/analytics/summary")
    assert r.status_code == 200, f"Error: {r.text}"
    print("Summary OK:", r.json())

    print("Testing /api/analytics/charts ...")
    r = client.get("/api/analytics/charts")
    assert r.status_code == 200, f"Error: {r.text}"
    print("Charts OK! Hourly trend rows:", len(r.json()["hourly_trend"]))

    print("Testing /api/analytics/map ...")
    r = client.get("/api/analytics/map?limit=100")
    assert r.status_code == 200, f"Error: {r.text}"
    print("Map OK! Points count:", r.json()["count"])

    print("Testing /api/bigdata/benchmark ...")
    r = client.get("/api/bigdata/benchmark")
    assert r.status_code == 200, f"Error: {r.text}"
    print("Benchmark OK! Engine:", r.json()["engine"])

    print("Testing /api/ml/metrics ...")
    r = client.get("/api/ml/metrics")
    assert r.status_code == 200, f"Error: {r.text}"
    print("Metrics OK! Accuracy:", r.json()["severity_model"]["accuracy"])

    print("Testing /api/predict/severity ...")
    payload = {
        "hour": 20, "is_weekend": 1, "lanes": 3, "traffic_signal": 0,
        "visibility_num": 1, "temperature": 22.0, "vehicles_involved": 3,
        "casualties": 2, "is_peak_hour": 1, "weather": "fog",
        "road_type": "highway", "traffic_density": "high", "cause": "overspeeding"
    }
    r = client.post("/api/predict/severity", json=payload)
    assert r.status_code == 200, f"Error: {r.text}"
    print("Prediction OK! Result:", r.json())

    print("Testing /api/simulation/what-if ...")
    sim_payload = {
        "speed_factor": 1.5, "weather": "rain", "visibility_num": 1,
        "traffic_density": "high", "lanes": 2, "is_peak_hour": 1,
        "is_weekend": 1, "cause": "overspeeding"
    }
    r = client.post("/api/simulation/what-if", json=sim_payload)
    assert r.status_code == 200, f"Error: {r.text}"
    print("Simulation OK! Result:", r.json())

    print("\nALL BACKEND API TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_api_endpoints()
