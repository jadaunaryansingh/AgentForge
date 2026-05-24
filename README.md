# AgentForge - AI Solutions Architect Platform

AgentForge is a premium, futuristic solutions architect platform that analyzes user project ideas in natural language, recommends multi-agent architectures, builds compiled LangGraph Python code configurations, outputs interactive visual flowcharts (via Gemini), computes complexity/cost metrics, and exports full production-ready codebases.

---

## 📂 Project Structure

```
AgentForge New/
├── apps/
│   ├── api/                   # Python FastAPI Backend
│   │   ├── app/
│   │   │   ├── api/           # Router controllers (auth, projects, architect)
│   │   │   ├── core/          # App config, security, Redis/Qdrant clients
│   │   │   ├── database/      # SQLAlchemy model schemas & connection helpers
│   │   │   ├── pipelines/     # Requirement extractor, Graph planner, Mermaid renderers
│   │   │   └── schemas/       # Pydantic validation schemas
│   │   ├── main.py            # API entry point
│   │   └── requirements.txt   # Python pip requirements
│   └── web/                   # React Vite Frontend
│       ├── public/            # Static assets
│       ├── src/
│       │   ├── components/    # Sidebar, Topbar, Canvas, Inspector, and Hub components
│       │   ├── context/       # Auth state, Project CRUD state, and SSE stream reader
│       │   ├── pages/         # Login, Registry Dashboard, Prompt Studio, Canvas Workbench, Hub
│       │   ├── styles/        # CSS custom properties design sheet (glassmorphism)
│       │   ├── App.tsx        # App router structure
│       │   └── main.tsx       # Vite root entry
│       └── package.json       # Frontend package configuration
└── README.md                  # This developer guide
```

---

## ⚡ Setup Instructions

### 1. Backend (FastAPI) Setup

1. Navigate to the API folder:
   ```bash
   cd apps/api
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your keys:
   ```bash
   cp .env.example .env
   ```
   *Required variables*:
   - `DATABASE_URL`: Neon serverless PostgreSQL connection URL (or local postgres/sqlite)
   - `NEON_JWT_SECRET`: Secret token verification certificate from Neon Auth console
   - `GROQ_API_KEY`: Groq reasoning API key (used for requirements and graph planners)
   - `GEMINI_API_KEY`: Google Gemini API key (used for flowchart visualizations)
   - `QDRANT_URL` & `QDRANT_API_KEY`: Semantic database vector credentials (optional, auto-falls back to local templates)
   - `REDIS_URL`: Redis database cache URL (optional, auto-falls back to local memory cache)
5. Start the FastAPI development server:
   ```bash
   python main.py
   ```
   The backend server will run on `http://localhost:8000` (docs available at `/docs`).

### 2. Frontend (React) Setup

1. Navigate to the Web folder:
   ```bash
   cd apps/web
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   Copy `.env.example` to `.env` (or let it fallback to default):
   ```bash
   cp .env.example .env
   ```
4. Start the frontend developer bundler:
   ```bash
   npm run dev
   ```
   The React application will launch on `http://localhost:3000`.

---

## 🧠 Architectural Workflow In Depth

```
[ Natural Language Prompt ] 
           │
           ▼
[ Requirements Extraction (Groq - Llama-3.3) ] -> parsing name, domain, tools
           │
           ▼
[ Semantic Pattern Lookup (Qdrant Cloud) ] -> semantic matching to supervisor/RAG structures
           │
           ▼
[ Multi-Agent Graph Planning (Groq - Llama-3.3) ] -> node roles, state properties, edge conditions
           │
           ▼
[ LangGraph Python Compilation (Engine) ] -> assembling TypedDict, routers, LLMs, checkpointers
           │
           ▼
[ Flowchart Generation (Gemini API) ] -> building Mermaid structure and styles
           │
           ▼
[ Neon Database Persistence ] -> saving configuration revisions as historical drafts
           │
           ▼
[ Interactive Visual canvas & ZIP Code Export ] -> drag & inspect in React Flow, download full workspace
```

---

## 🛡️ License

AgentForge is licensed under the MIT License. Developed for advanced multi-agent architecture modeling.
