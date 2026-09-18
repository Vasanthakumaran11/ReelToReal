import sys
import json
from fastapi.testclient import TestClient

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from server import app

client = TestClient(app)

def test_api():
    print("=" * 60)
    print("ReelToReal FastAPI Endpoint Verification")
    print("=" * 60)

    # 1. Health check
    print("\n[1/3] Testing GET /api/health...")
    resp = client.get("/api/health")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    health = resp.json()
    print(f"      Status: {health.get('status')}")
    print(f"      Database Connected: {health.get('database_connected')}")
    print(f"      Gemini Key Configured: {health.get('gemini_api_key_configured')}")
    print("      ✅ GET /api/health PASSED")

    # 2. List reels (verifies fallback to outputs/*.json or DB)
    print("\n[2/3] Testing GET /api/reels...")
    resp = client.get("/api/reels")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    reels = resp.json()
    print(f"      Retrieved {len(reels)} reels.")
    if reels:
        first = reels[0]
        print(f"      Sample Reel: ID={first.get('video_id')}, Place={first.get('place')}, City={first.get('city')}")
        assert "video_id" in first, "Reel missing video_id"
    print("      ✅ GET /api/reels PASSED")

    # 3. List plans
    print("\n[3/3] Testing GET /api/plans...")
    resp = client.get("/api/plans")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    plans = resp.json()
    print(f"      Retrieved {len(plans)} plans.")
    print("      ✅ GET /api/plans PASSED")

    print("\n" + "=" * 60)
    print("🎉 All FastAPI endpoints verified and working perfectly!")
    print("=" * 60)

if __name__ == "__main__":
    test_api()
