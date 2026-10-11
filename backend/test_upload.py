import os
import main
from fastapi.testclient import TestClient

client = TestClient(main.app)

def test_upload_flow():
    csv_path = os.path.join(os.path.dirname(__file__), "data", "indian_roads_dataset.csv")
    print(f"Testing Upload API with {csv_path} ...")
    
    with open(csv_path, "rb") as f:
        response = client.post("/api/upload/analyze", files={"file": ("indian_roads_dataset.csv", f, "text/csv")})
        
    assert response.status_code == 200, f"Upload error: {response.text}"
    data = response.json()
    print("Upload & EDA Analysis Successful!")
    print(f"Rows: {data['total_rows']}, Cols: {data['total_cols']}, Health Score: {data['data_health_score']}/100")
    print(f"Auto-generated Charts Specs count: {len(data['charts'])}")
    print(f"Preview Table rows count: {len(data['preview_rows'])}")
    
    print("\nTesting PDF Report Export ...")
    pdf_resp = client.post("/api/upload/export-pdf")
    assert pdf_resp.status_code == 200, f"PDF export error: {pdf_resp.text}"
    print(f"PDF Generated Successfully! Size: {len(pdf_resp.content)} bytes")
    
    print("\nALL BACKEND UPLOAD & PDF EXPORT TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_upload_flow()
