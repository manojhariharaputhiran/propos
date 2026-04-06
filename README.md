# RFP Automation — Multi-Agent AI System

Turn any RFP into a winning response with 80% less manual work. Upload an RFP, AI agents handle parsing, drafting, reviewing, and exporting. Human-in-the-loop at every key decision point.

## Architecture

```
Frontend (Next.js 14)  ←→  Backend (FastAPI + LangGraph)  ←→  Claude claude-sonnet-4-6
       ↑                          ↑           ↑
  next-auth             PostgreSQL       Qdrant (vectors)
  (Google/MSFT)         (RFPs, Qs)       Redis (cache/queue)
```

### Agent Pipeline

```
uploaded → parsing → qualification_needed → qualified → drafting
        → sme_needed → critic_done → human_review → export_ready → completed
```

| Agent | Role |
|-------|------|
| **Parser** | Extracts structured questions from raw RFP text |
| **Retriever** | Fetches relevant context from Qdrant knowledge base |
| **Copywriter** | Drafts persuasive answers per question |
| **Critic** | Scores the full proposal (4 metrics) |
| **Compliance** | Checks regulatory/contractual coverage |
| **Pricing** | Validates pricing completeness |
| **Design** | Generates PPT presentations |
| **HumanActionManager** | Tracks human-in-the-loop checkpoints |

## Quick Start (Docker)

```bash
# 1. Clone and enter directory
cd "RFP Automation"

# 2. Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Start all services
docker-compose up --build

# Services:
#  Frontend:  http://localhost:3000
#  Backend:   http://localhost:8000
#  API Docs:  http://localhost:8000/docs
#  Postgres:  localhost:5432
#  Qdrant:    http://localhost:6333
#  Redis:     localhost:6379
```

### Dev Token (no OAuth setup needed)
```bash
# Get a token for testing without configuring Google/Microsoft OAuth:
curl http://localhost:8000/api/v1/auth/dev-token
```

## Local Development (without Docker)

### Backend
```bash
cd backend

# Create virtualenv
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set env vars
cp .env.example .env
# Edit .env — minimum: DATABASE_URL, REDIS_URL, QDRANT_URL

# Run migrations (requires running Postgres)
psql -U rfpuser -d rfpdb -f migrations/init.sql
psql -U rfpuser -d rfpdb -f migrations/seed.sql

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Set env vars
cp .env.example .env.local
# Edit .env.local — minimum: NEXTAUTH_SECRET, NEXT_PUBLIC_API_URL

# Start dev server
npm run dev
```

## Using Real Claude (optional)

By default the system uses **mock AI responses** — fully functional for demos.

To switch to real Claude responses, add to `backend/.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

The feature flag `settings.use_real_llm` automatically switches all agents to call Claude claude-sonnet-4-6.

## OAuth Setup (optional)

The system works with the dev credentials provider by default. To add real OAuth:

### Google
1. Create credentials at https://console.cloud.google.com
2. Add `http://localhost:3000/api/auth/callback/google` as authorized redirect URI
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in both `.env` files

### Microsoft
1. Register app at https://portal.azure.com
2. Add `http://localhost:3000/api/auth/callback/azure-ad` as redirect URI
3. Set `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID` in frontend `.env`
4. Set `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` in backend `.env`

## API Reference

Base URL: `http://localhost:8000/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/rfp/upload` | Upload RFP file (PDF/DOCX/TXT) |
| GET | `/rfp/` | List all RFPs |
| GET | `/rfp/{id}/status` | Get RFP with full question/answer state |
| POST | `/rfp/{id}/qualify` | Submit Go/No-Go decision |
| POST | `/rfp/{id}/sme-answer` | Provide expert answer for flagged question |
| GET | `/rfp/{id}/draft` | Get current draft state |
| POST | `/rfp/{id}/approve` | Approve/reject for export |
| GET | `/rfp/{id}/export?format=word\|pdf\|ppt\|sheets` | Download export |
| GET | `/agents/` | List custom agents |
| POST | `/agents/` | Create custom agent |
| PUT | `/agents/{id}` | Update agent |
| POST | `/agents/{id}/disable` | Disable agent |
| GET | `/organisation/` | Get org details |
| POST | `/organisation/templates/ppt` | Upload PPT template |
| GET | `/organisation/templates` | List PPT templates |

## Export Formats

| Format | Library | Output |
|--------|---------|--------|
| Word | python-docx | `.docx` with Q&A table and scorecard |
| PDF | reportlab (fallback: libreoffice) | `.pdf` |
| PowerPoint | python-pptx | `.pptx` with branded slides + score boxes |
| Excel | openpyxl | `.xlsx` with Q&A sheet and scorecard tab |

## Database Schema

See `backend/migrations/init.sql` for full schema.  
Seed data (Acme Agency + 2 mock RFPs + 3 agents) is in `backend/migrations/seed.sql`.

## Production Deployment

- **Frontend** → Vercel (connect GitHub repo, set env vars)
- **Backend** → Render (Docker deploy, set env vars)
- **Database** → Supabase (swap `DATABASE_URL` in backend env)
- **Vectors** → Qdrant Cloud (swap `QDRANT_URL` + `QDRANT_API_KEY`)
- **Cache** → Upstash Redis (swap `REDIS_URL`)

See `docker-compose.prod.yml` for production service overrides.

## Running Tests

```bash
cd backend
pip install pytest pytest-asyncio
pytest tests/ -v
```

## Project Structure

```
RFP Automation/
├── frontend/           Next.js 14 app (App Router + TypeScript)
│   ├── app/           Pages and layouts
│   ├── components/    Reusable UI components
│   └── lib/           API client + auth config
├── backend/           FastAPI + LangGraph
│   ├── app/
│   │   ├── agents/    8 AI agents
│   │   ├── graph/     LangGraph state machine
│   │   ├── routers/   API endpoints
│   │   ├── models/    SQLAlchemy + Pydantic
│   │   └── services/  Qdrant, export, auth
│   ├── migrations/    SQL schema + seed data
│   └── tests/         Unit tests
├── docker-compose.yml       Local dev (all services)
└── docker-compose.prod.yml  Production overrides
```
