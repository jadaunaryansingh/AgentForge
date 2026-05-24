import asyncio
from app.database.connection import engine, AsyncSessionLocal, init_db, seed_database_patterns
from sqlalchemy import text
from app.database.models import User, Project, Architecture, AgentPattern

async def test():
    print("Testing DB connection...")
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version();"))
            row = result.fetchone()
            print("DB Connection Success! PostgreSQL version:", row[0])
            
        print("Initializing database tables...")
        await init_db()
        print("Tables initialized!")
        
        print("Seeding database patterns...")
        await seed_database_patterns()
        print("Seeding done!")
        
        async with AsyncSessionLocal() as session:
            # Query patterns
            result = await session.execute(text("SELECT COUNT(*) FROM agent_patterns;"))
            count = result.scalar()
            print("Total patterns in database:", count)
            
            # Query users
            result = await session.execute(text("SELECT COUNT(*) FROM users;"))
            count = result.scalar()
            print("Total users in database:", count)
            
    except Exception as e:
        print("Error during DB test:", e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
