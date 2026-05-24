"""
Check if there's any data in the Neon database tables.
"""
import asyncio
import sys
import os
from sqlalchemy import text, select

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def check_table_data():
    """Check data in all tables."""
    from app.database.connection import AsyncSessionLocal
    from app.database.models import User, Project, Architecture, AgentPattern, ExportLog
    
    print("=" * 60)
    print("Checking Database Table Contents")
    print("=" * 60)
    
    async with AsyncSessionLocal() as session:
        # Check Users
        print("\n[1] Users Table:")
        result = await session.execute(select(User))
        users = result.scalars().all()
        if users:
            print(f"  ✓ Found {len(users)} user(s):")
            for user in users:
                print(f"    - {user.email} ({user.display_name})")
        else:
            print("  ⚠ No users found (empty table)")
        
        # Check Projects
        print("\n[2] Projects Table:")
        result = await session.execute(select(Project))
        projects = result.scalars().all()
        if projects:
            print(f"  ✓ Found {len(projects)} project(s):")
            for project in projects:
                print(f"    - {project.name}")
        else:
            print("  ⚠ No projects found (empty table)")
        
        # Check Architectures
        print("\n[3] Architectures Table:")
        result = await session.execute(select(Architecture))
        architectures = result.scalars().all()
        if architectures:
            print(f"  ✓ Found {len(architectures)} architecture(s)")
        else:
            print("  ⚠ No architectures found (empty table)")
        
        # Check Agent Patterns
        print("\n[4] Agent Patterns Table:")
        result = await session.execute(select(AgentPattern))
        patterns = result.scalars().all()
        if patterns:
            print(f"  ✓ Found {len(patterns)} pattern(s):")
            for pattern in patterns:
                print(f"    - {pattern.pattern_name}")
        else:
            print("  ⚠ No agent patterns found (empty table)")
        
        # Check Export Logs
        print("\n[5] Export Logs Table:")
        result = await session.execute(select(ExportLog))
        logs = result.scalars().all()
        if logs:
            print(f"  ✓ Found {len(logs)} export log(s)")
        else:
            print("  ⚠ No export logs found (empty table)")
    
    print("\n" + "=" * 60)
    print("Data Check Complete")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(check_table_data())
