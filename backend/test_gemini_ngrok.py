#!/usr/bin/env python3
"""
Test Gemini API through ngrok endpoint
"""
import requests
import json

NGROK_URL = "https://ilana-bisymmetrical-martina.ngrok-free.dev"

def test_health():
    """Test /health endpoint"""
    print("\n" + "="*60)
    print("TEST 1: Health Check")
    print("="*60)
    
    try:
        response = requests.get(f"{NGROK_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_ping():
    """Test /api/ping endpoint"""
    print("\n" + "="*60)
    print("TEST 2: Gemini Ping")
    print("="*60)
    
    try:
        response = requests.get(f"{NGROK_URL}/api/ping")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        print(f"Gemini Configured: {'✓' if data.get('gemini_configured') else '✗'}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_gemini_chat():
    """Test /api/test-gemini endpoint"""
    print("\n" + "="*60)
    print("TEST 3: Gemini Chat (requires auth token)")
    print("="*60)
    
    # You need to provide a valid JWT token
    token = input("Enter your JWT token (or press Enter to skip): ").strip()
    
    if not token:
        print("⏭️  Skipped (no token provided)")
        return None
    
    try:
        response = requests.post(
            f"{NGROK_URL}/api/test-gemini",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            },
            json={
                "prompt": "Say hello in one sentence",
                "history": []
            }
        )
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if data.get('success'):
            print(f"\n✅ Gemini Response: {data.get('response')}")
            return True
        else:
            print(f"\n❌ Error: {data.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Gemini API through ngrok")
    print(f"📡 Ngrok URL: {NGROK_URL}")
    
    results = {
        "health": test_health(),
        "ping": test_ping(),
        "gemini_chat": test_gemini_chat()
    }
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Health Check: {'✅ PASS' if results['health'] else '❌ FAIL'}")
    print(f"Ping Check: {'✅ PASS' if results['ping'] else '❌ FAIL'}")
    
    if results['gemini_chat'] is None:
        print(f"Gemini Chat: ⏭️  SKIPPED")
    else:
        print(f"Gemini Chat: {'✅ PASS' if results['gemini_chat'] else '❌ FAIL'}")
    
    print("="*60)
