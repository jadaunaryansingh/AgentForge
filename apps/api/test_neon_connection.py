"""
Test script to verify Neon database connection and authentication setup.
"""
import asyncio
import sys
import os
from sqlalchemy import text

# Add the api directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def test_database_connection():
    """Test the database connection and basic operations."""
    print("=" * 60)
    print("Testing Neon Database Connection")
    print("=" * 60)
    
    try:
        from app.core.config import settings
        from app.database.connection import engine, AsyncSessionLocal, init_db
        
        print(f"\n✓ Configuration loaded successfully")
        print(f"  - Environment: {settings.APP_ENV}")
        print(f"  - Database URL: {settings.DATABASE_URL[:50]}...")
        
        # Test raw connection
        print("\n[1] Testing raw database connection...")
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version()"))
            version = result.scalar()
            print(f"✓ Connected to PostgreSQL")
            print(f"  - Version: {version[:80]}...")
        
        # Test table creation
        print("\n[2] Testing table creation...")
        await init_db()
        print("✓ Tables created/verified successfully")
        
        # Test session and query
        print("\n[3] Testing database session...")
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT current_database(), current_user"))
            db_name, db_user = result.fetchone()
            print(f"✓ Session working")
            print(f"  - Database: {db_name}")
            print(f"  - User: {db_user}")
        
        # Check tables
        print("\n[4] Checking created tables...")
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            tables = result.fetchall()
            if tables:
                print(f"✓ Found {len(tables)} tables:")
                for table in tables:
                    print(f"  - {table[0]}")
            else:
                print("⚠ No tables found")
        
        print("\n" + "=" * 60)
        print("✓ DATABASE CONNECTION TEST PASSED")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"\n✗ Database connection test failed:")
        print(f"  Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def test_auth_config():
    """Test authentication configuration."""
    print("\n" + "=" * 60)
    print("Testing Authentication Configuration")
    print("=" * 60)
    
    try:
        from app.core.config import settings
        
        print(f"\n[1] Checking JWT configuration...")
        print(f"  - SECRET_KEY: {'✓ Set' if settings.SECRET_KEY else '✗ Missing'}")
        print(f"  - NEON_JWT_SECRET: {'✓ Set' if settings.NEON_JWT_SECRET else '✗ Missing'}")
        
        if settings.NEON_JWT_SECRET:
            if settings.NEON_JWT_SECRET.startswith('http'):
                print(f"  - Type: JWKS URL endpoint")
                print(f"  - URL: {settings.NEON_JWT_SECRET}")
                
                # Test JWKS endpoint
                print(f"\n[2] Testing JWKS endpoint...")
                import httpx
                jwks_url = settings.NEON_JWT_SECRET
                if not jwks_url.endswith('jwks.json'):
                    jwks_url = jwks_url.rstrip('/') + '/.well-known/jwks.json'
                
                try:
                    async with httpx.AsyncClient(timeout=10) as client:
                        response = await client.get(jwks_url)
                        if response.status_code == 200:
                            jwks = response.json()
                            print(f"✓ JWKS endpoint accessible")
                            print(f"  - Keys found: {len(jwks.get('keys', []))}")
                        else:
                            print(f"✗ JWKS endpoint returned status {response.status_code}")
                            print(f"  - URL tried: {jwks_url}")
                except Exception as e:
                    print(f"✗ Cannot reach JWKS endpoint: {e}")
            else:
                print(f"  - Type: Secret key string")
                print(f"  - Length: {len(settings.NEON_JWT_SECRET)} characters")
        
        print("\n" + "=" * 60)
        print("✓ AUTHENTICATION CONFIG CHECK COMPLETE")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"\n✗ Auth configuration test failed:")
        print(f"  Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Run all tests."""
    print("\n🔍 AgentForge - Neon Database & Auth Diagnostic Tool\n")
    
    db_ok = await test_database_connection()
    auth_ok = await test_auth_config()
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Database Connection: {'✓ PASS' if db_ok else '✗ FAIL'}")
    print(f"Auth Configuration: {'✓ PASS' if auth_ok else '✗ FAIL'}")
    print("=" * 60 + "\n")
    
    return db_ok and auth_ok

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
