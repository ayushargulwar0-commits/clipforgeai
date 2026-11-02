"""
Integration tests for FastAPI endpoints.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from app.main import app


def test_health_check():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "timestamp" in data
    print("Health check endpoint test PASSED:", data)


def test_unauthenticated_protected_routes():
    client = TestClient(app)
    # Projects route without auth should return 401/403
    response = client.get("/api/projects")
    assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    print("Security authentication guard test PASSED (status code:", response.status_code, ")")


if __name__ == "__main__":
    test_health_check()
    test_unauthenticated_protected_routes()
    print("ALL API TESTS PASSED!")
