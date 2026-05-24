"""
AgentForge API Server Startup Script
Starts the FastAPI server with proper configuration and health checks.
"""
import asyncio
import sys
import os
import subprocess
import time

# Add the api directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def check_database():
    """Verify database connection before starting server."""
    print("🔍 Checking database connection...")
    try:
        from app.database.connection import engine
        from sqlalchemy import text
        
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        print("✓ Database connection verified\n")
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        print("⚠ Please check your DATABASE_URL in .env file\n")
        return False

async def check_config():
    """Verify configuration is loaded."""
    print("🔍 Checking configuration...")
    try:
        from app.core.config import settings
        print(f"✓ Configuration loaded")
        print(f"  - Environment: {settings.APP_ENV}")
        print(f"  - CORS Origins: {settings.get_cors_origins()}")
        print(f"  - Database: Connected")
        print()
        return True
    except Exception as e:
        print(f"✗ Configuration error: {e}\n")
        return False

def start_server():
    """Start the FastAPI server using uvicorn."""
    print("=" * 60)
    print("🚀 Starting AgentForge API Server")
    print("=" * 60)
    print()
    
    # Run pre-flight checks
    if not asyncio.run(check_config()):
        sys.exit(1)
    
    if not asyncio.run(check_database()):
        sys.exit(1)
    
    print("=" * 60)
    print("✓ All pre-flight checks passed")
    print("=" * 60)
    print()
    print("🌐 Server starting on http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    print()
    print("Press CTRL+C to stop the server")
    print("=" * 60)
    print()
    
    # Start uvicorn
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn",
            "main:app",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--reload",
            "--log-level", "info"
        ])
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n✗ Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    start_server()
