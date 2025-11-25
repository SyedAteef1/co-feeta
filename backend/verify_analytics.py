import sys
import os
from app import create_app

# Ensure we are in the backend directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = create_app()

print("\n--- Testing Analytics Endpoints ---")

with app.test_client() as client:
    # 1. Test Ping
    print("\n1. Testing /api/analytics/ping...")
    try:
        resp = client.get('/api/analytics/ping')
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.get_data(as_text=True)}")
    except Exception as e:
        print(f"PING CRASHED: {e}")

    # 2. Test Founder Analytics
    print("\n2. Testing /api/analytics/founder...")
    try:
        resp = client.get('/api/analytics/founder')
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.get_data(as_text=True)}")
    except Exception as e:
        print(f"FOUNDER CRASHED: {e}")
        import traceback
        traceback.print_exc()
