# AgentForge API - Quick Start Guide

## 🎯 TL;DR - Your Database is Working!

Your Neon database and authentication are **fully functional**. You just need to start the API server.

```bash
cd apps/api
python start_server.py
```

Then visit: **http://localhost:8000/docs**

---

## 📊 Current Status

✅ **Database**: Connected and operational  
✅ **Authentication**: Configured and working  
✅ **Tables**: Created (5 tables)  
✅ **Data**: Present (1 user, 2 projects, 4 agent patterns)  
⚠️ **API Server**: Not running (needs to be started)

---

## 🚀 Starting the Server

### Method 1: Using the startup script (Recommended)
```bash
python start_server.py
```
This script runs pre-flight checks before starting the server.

### Method 2: Direct start
```bash
python main.py
```

### Method 3: Using uvicorn directly
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🧪 Testing & Diagnostics

### Test Database Connection
```bash
python test_neon_connection.py
```
**Output**: Verifies database connectivity, tables, and auth config.

### Check Database Contents
```bash
python check_data.py
```
**Output**: Shows all data in your tables.

### Test API Endpoints
```bash
python test_api_endpoints.py
```
**Output**: Tests API endpoints (requires server to be running).

---

## 📚 API Documentation

Once the server is running:
- **Swagger UI**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## 🔐 Authentication Endpoints

### Register a new user
```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securepassword",
  "display_name": "User Name"
}
```

### Login
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Get current user (requires token)
```bash
GET /api/auth/me
Authorization: Bearer <your_token>
```

### Sync Neon Auth user
```bash
POST /api/auth/sync
Authorization: Bearer <neon_auth_token>
```

---

## 📁 Project Structure

```
apps/api/
├── main.py                      # FastAPI application entry point
├── start_server.py              # Server startup script with checks
├── test_neon_connection.py      # Database diagnostic tool
├── check_data.py                # Data inspection tool
├── test_api_endpoints.py        # API endpoint tester
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables (configured)
└── app/
    ├── api/                     # API route handlers
    │   ├── auth.py             # Authentication endpoints
    │   ├── projects.py         # Project management endpoints
    │   └── architect.py        # Architecture generation endpoints
    ├── core/                    # Core functionality
    │   ├── config.py           # Configuration management
    │   ├── security.py         # JWT and auth logic
    │   └── redis_client.py     # Redis client
    ├── database/                # Database layer
    │   ├── connection.py       # Database connection and session
    │   └── models.py           # SQLAlchemy models
    ├── pipelines/               # AI pipelines
    │   ├── requirements_extractor.py
    │   ├── graph_planner.py
    │   ├── diagram_generator.py
    │   └── langgraph_codegen.py
    └── schemas/                 # Pydantic schemas
        ├── auth.py
        ├── projects.py
        └── architect.py
```

---

## 🔧 Configuration

Your `.env` file is properly configured with:
- ✅ Neon PostgreSQL connection
- ✅ Neon Auth JWKS endpoint
- ✅ Groq API key
- ✅ Gemini API key
- ✅ Redis URL
- ✅ CORS origins

---

## 🐛 Common Issues

### Port 8000 already in use
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <process_id> /F

# Or use a different port
uvicorn main:app --port 8001
```

### Missing dependencies
```bash
pip install -r requirements.txt
```

### Database connection issues
1. Check if your Neon database is active (not paused)
2. Verify DATABASE_URL in .env
3. Run: `python test_neon_connection.py`

---

## 📊 Database Schema

### Tables:
1. **users** - User accounts (1 user currently)
2. **projects** - User projects (2 projects currently)
3. **architectures** - LangGraph architectures (1 architecture)
4. **agent_patterns** - Design patterns (4 patterns seeded)
5. **export_logs** - Export history (1 log)

---

## 🎓 Next Steps

1. ✅ Start the server: `python start_server.py`
2. ✅ Visit the docs: http://localhost:8000/docs
3. ✅ Test authentication endpoints
4. ✅ Create a new project via API
5. ✅ Generate an architecture
6. ✅ Connect your frontend application

---

## 📞 Support

For detailed diagnostics, see: `NEON_STATUS_REPORT.md`

**Everything is working - just start the server!** 🚀
