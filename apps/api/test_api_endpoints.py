"""
Test API endpoints to verify they're working correctly.
"""
import asyncio
import httpx
import sys

BASE_URL = "http://localhost:8000"

async def test_endpoints():
    """Test various API endpoints."""
    print("=" * 60)
    print("Testing AgentForge API Endpoints")
    print("=" * 60)
    
    async with httpx.AsyncClient(timeout=10) as client:
        # Test health endpoint
        print("\n[1] Testing /health endpoint...")
        try:
            response = await client.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                data = response.json()
                print(f"✓ Health check passed")
                print(f"  - Status: {data.get('status')}")
                print(f"  - Version: {data.get('version')}")
                print(f"  - Environment: {data.get('env')}")
            else:
                print(f"✗ Health check failed with status {response.status_code}")
        except Exception as e:
            print(f"✗ Cannot connect to API server: {e}")
            print(f"\n⚠ Make sure the API server is running:")
            print(f"  cd apps/api")
            print(f"  python main.py")
            return False
        
        # Test docs endpoint
        print("\n[2] Testing /docs endpoint...")
        try:
            response = await client.get(f"{BASE_URL}/docs")
            if response.status_code == 200:
                print(f"✓ API documentation accessible at {BASE_URL}/docs")
            else:
                print(f"⚠ Docs endpoint returned status {response.status_code}")
        except Exception as e:
            print(f"✗ Docs endpoint error: {e}")
        
        # Test auth endpoints (without authentication)
        print("\n[3] Testing /api/auth endpoints...")
        try:
            # Test /me without token (should fail with 401)
            response = await client.get(f"{BASE_URL}/api/auth/me")
            if response.status_code == 401:
                print(f"✓ Auth protection working (401 Unauthorized as expected)")
            else:
                print(f"⚠ Unexpected status {response.status_code} for protected endpoint")
        except Exception as e:
            print(f"✗ Auth endpoint error: {e}")
        
        # Test projects endpoint
        print("\n[4] Testing /api/projects endpoints...")
        try:
            response = await client.get(f"{BASE_URL}/api/projects")
            if response.status_code == 401:
                print(f"✓ Projects endpoint protected (401 Unauthorized as expected)")
            else:
                print(f"⚠ Unexpected status {response.status_code}")
        except Exception as e:
            print(f"✗ Projects endpoint error: {e}")
    
    print("\n" + "=" * 60)
    print("✓ API ENDPOINTS TEST COMPLETE")
    print("=" * 60)
    print(f"\n📝 API Documentation: {BASE_URL}/docs")
    print(f"🔗 Base URL: {BASE_URL}")
    return True

if __name__ == "__main__":
    success = asyncio.run(test_endpoints())
    sys.exit(0 if success else 1)
