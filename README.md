# ConvoSum — Enterprise Dialogue Summarization Platform

> Production-grade AI-powered dialogue summarization system built with FastAPI, Next.js 15, Transformers, and MLflow.

---

## 🏗 Architecture

```
convosum/
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── api/       # REST endpoints (auth, users, summarize, analytics, models, train)
│   │   ├── core/      # Config, security, Celery
│   │   ├── db/        # SQLAlchemy session & base
│   │   ├── ml/        # Data, preprocessing, training, inference
│   │   ├── models/    # ORM models (User, Document, Summary, ModelMetadata)
│   │   └── schemas/   # Pydantic schemas
│   ├── alembic/       # DB migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/          # Next.js 15 App Router
│   └── src/
│       ├── app/       # Pages (landing, auth, dashboard)
│       ├── components/ # UI & dashboard components
│       ├── lib/       # API client, utilities
│       └── store/     # Zustand state management
├── tests/             # Pytest integration tests
├── docker-compose.yml # All services
└── .env.example       # Environment template
```

---

## 🚀 Quick Start (Docker)

### Prerequisites
- Docker Desktop
- Docker Compose v2

### 1. Clone and configure
```bash
git clone <repo-url>
cd convosum
cp .env.example .env
# Edit .env and set a strong SECRET_KEY
```

### 2. Start all services
```bash
docker-compose up --build
```

| Service   | URL                        |
|-----------|----------------------------|
| Frontend  | http://localhost:3000      |
| Backend   | http://localhost:8000      |
| API Docs  | http://localhost:8000/docs |
| MLflow    | http://localhost:5000      |

---

## 🛠 Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt

# Start PostgreSQL and Redis (via Docker):
docker-compose up db redis -d

# Apply migrations:
alembic upgrade head

# Run dev server:
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp ../.env.example .env.local
npm run dev
# Open http://localhost:3000
```

### Celery Worker (for background training)

```bash
cd backend
celery -A app.worker worker --loglevel=info
```

---

## 🤖 AI Models

| Model | Type | Size |
|-------|------|------|
| google/flan-t5-base | Text-to-Text | ~250MB |
| google/flan-t5-large | Text-to-Text | ~780MB |
| facebook/bart-large-cnn | Seq2Seq | ~1.6GB |
| google/pegasus-xsum | Seq2Seq | ~2.3GB |

Models are loaded on-demand and cached in memory. First inference will download from HuggingFace Hub.

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/login` | No | Get JWT token |
| POST | `/api/v1/users/` | No | Register user |
| GET | `/api/v1/users/me` | JWT | Get current user |
| PUT | `/api/v1/users/me` | JWT | Update profile |
| POST | `/api/v1/summarize/` | JWT | Summarize raw text |
| POST | `/api/v1/summarize/upload` | JWT | Summarize uploaded file |
| GET | `/api/v1/summarize/history` | JWT | Paginated history |
| GET | `/api/v1/analytics/` | JWT | Usage analytics |
| GET | `/api/v1/models/` | JWT | List available models |
| POST | `/api/v1/train/` | JWT+Admin | Trigger training job |

Full interactive API docs at `http://localhost:8000/docs` (Swagger UI).

---

## 🧪 Running Tests

```bash
cd backend
pip install pytest httpx
pytest tests/ -v
```

---

## 🗄 Database Migrations

```bash
cd backend
# Create new migration
alembic revision --autogenerate -m "description"
# Apply
alembic upgrade head
# Rollback
alembic downgrade -1
```

---

## 🔐 Security Notes

- All API endpoints (except `/auth/login` and `POST /users/`) require JWT Bearer token
- Passwords are hashed using bcrypt via Passlib
- Admin-only endpoints (e.g., `/train/`) require `is_superuser=True`
- Set a strong `SECRET_KEY` in production — never use the default
- CORS is configured to `allow_origins=["*"]` for development; restrict in production

---

## 🎯 Performance Targets

| Metric | Target |
|--------|--------|
| API Response | < 500ms |
| Model Inference | < 2s (GPU) / < 30s (CPU) |
| BERTScore | > 0.90 (after fine-tuning) |

---

## 📦 Tech Stack

**Backend:** Python 3.12, FastAPI, SQLAlchemy, Alembic, Celery, Redis, PostgreSQL, JWT  
**ML:** PyTorch, Transformers, HuggingFace Datasets, MLflow, ROUGE, BERTScore  
**Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Zustand, TanStack Query, Recharts  
**DevOps:** Docker, Docker Compose, Nginx-ready
