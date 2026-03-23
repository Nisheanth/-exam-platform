# Exam Pattern Analyzer & Predictor — Backend

A production-ready **FastAPI** backend that ingests historical exam papers (PDF / images), extracts questions via OCR, clusters them by semantic similarity, analyses topic frequency patterns, and produces AI-powered predictions for upcoming exams using **Claude claude-sonnet-4-20250514**.

---

## Architecture

```
┌────────────┐  upload   ┌───────────┐  task   ┌──────────────┐
│  Frontend  │──────────▶│  FastAPI   │────────▶│ Celery Worker│
│ (Vite/Next)│◀──────────│  (REST)   │         │              │
└────────────┘  JSON     └─────┬─────┘         └──────┬───────┘
                               │                       │
                        ┌──────┴──────┐         ┌──────┴───────┐
                        │ PostgreSQL  │◀────────│  Services    │
                        │ + pgvector  │         │ OCR / NLP /  │
                        └─────────────┘         │ Embeddings / │
                                                │ FAISS / Claude│
                        ┌─────────────┐         └──────────────┘
                        │    Redis    │
                        │  (broker)   │
                        └─────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API | FastAPI + Uvicorn |
| Database | PostgreSQL 16 + pgvector |
| Task Queue | Celery + Redis |
| OCR | pdfplumber + Tesseract (pytesseract) |
| NLP | spaCy (en_core_web_sm) |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Clustering | FAISS (L2 index) |
| AI Predictions | Anthropic Claude claude-sonnet-4-20250514 |
| ORM | SQLAlchemy |
| Containers | Docker + docker-compose |

---

## Quick Start (Docker)

### 1. Clone and configure

```bash
cd exam-backend
cp .env.example .env
# Edit .env and set your ANTHROPIC_API_KEY
```

### 2. Start all services

```bash
docker-compose up --build
```

This starts:
- **PostgreSQL** (with pgvector) on port `5432`
- **Redis** on port `6379`
- **FastAPI** on port `8000`
- **Celery worker** for async paper processing

### 3. Verify

```bash
curl http://localhost:8000/health
# → {"status":"ok"}
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Quick Start (Local, without Docker)

### Prerequisites
- Python 3.11+
- PostgreSQL with pgvector extension
- Redis
- Tesseract OCR installed and on PATH
- poppler-utils (for pdf2image)

### Setup

```bash
cd exam-backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
python -m spacy download en_core_web_sm

cp .env.example .env
# Edit .env with your database credentials and API key
```

### Run

```bash
# Terminal 1 — API server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — Celery worker
celery -A app.tasks.process_paper.celery_app worker --loglevel=info
```

---

## API Reference

### Health Check

```bash
curl http://localhost:8000/health
```

```json
{"status": "ok"}
```

---

### Upload a Paper

```bash
curl -X POST http://localhost:8000/api/papers/upload \
  -F "file=@physics_2023.pdf" \
  -F "subject=Physics" \
  -F "year=2023" \
  -F "exam_name=NEET"
```

**Response (202 Accepted):**

```json
{
  "paper_id": "b2c3d4e5-f6a7-8901-bcde-f01234567890",
  "status": "processing",
  "task_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

---

### Check Paper Status

```bash
curl http://localhost:8000/api/papers/b2c3d4e5-f6a7-8901-bcde-f01234567890/status
```

**Response:**

```json
{
  "paper_id": "b2c3d4e5-f6a7-8901-bcde-f01234567890",
  "status": "complete",
  "questions_extracted": 42,
  "error": null
}
```

---

### List Papers (with filters)

```bash
# All papers
curl http://localhost:8000/api/papers

# Filtered
curl "http://localhost:8000/api/papers?exam_name=NEET&subject=Physics"
```

**Response:**

```json
{
  "papers": [
    {
      "paper_id": "b2c3d4e5-f6a7-8901-bcde-f01234567890",
      "year": 2023,
      "subject": "Physics",
      "exam_name": "NEET",
      "questions_extracted": 45,
      "uploaded_at": "2024-12-15T10:30:00Z"
    }
  ]
}
```

---

### Delete a Paper

```bash
curl -X DELETE http://localhost:8000/api/papers/b2c3d4e5-f6a7-8901-bcde-f01234567890
# → 204 No Content
```

---

### Run Analysis

```bash
curl -X POST http://localhost:8000/api/analysis/run \
  -H "Content-Type: application/json" \
  -d '{"exam_name": "NEET", "subject": "Physics"}'
```

**Response:**

```json
{
  "analysis_id": "c3d4e5f6-a7b8-9012-cdef-012345678901",
  "repeated_questions": [
    {
      "question_text": "Derive the expression for escape velocity...",
      "years": [2020, 2021, 2023],
      "frequency": 3,
      "topic": "Gravitation"
    }
  ],
  "topic_heatmap": [
    {
      "topic": "Laws of Motion",
      "year_counts": {"2020": 3, "2021": 2, "2022": 0, "2023": 4},
      "total": 9,
      "gap_years": 0
    }
  ],
  "important_questions": [
    {
      "question_text": "A block of mass m slides on...",
      "score": 0.87,
      "topic": "Friction",
      "years_seen": [2021, 2022, 2023]
    }
  ]
}
```

---

### Fetch Stored Analysis

```bash
curl http://localhost:8000/api/analysis/c3d4e5f6-a7b8-9012-cdef-012345678901
```

---

### Generate AI Predictions

```bash
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "exam_name": "NEET",
    "subject": "Physics",
    "analysis_id": "c3d4e5f6-a7b8-9012-cdef-012345678901"
  }'
```

**Response:**

```json
{
  "predictions": [
    {
      "question": "Derive the relationship between angular momentum and torque.",
      "topic": "Rotational Motion",
      "confidence": "High",
      "reason": "This topic area appeared 3 times in recent years with increasing frequency."
    }
  ],
  "overdue_topics": ["Thermodynamics", "Wave Optics"],
  "strategy_tip": "Focus on Rotational Motion and Modern Physics — both show strong repeating patterns. Also review Thermodynamics which hasn't appeared in 2 years."
}
```

---

## Database Schema

### papers
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| exam_name | VARCHAR(128) | Indexed |
| subject | VARCHAR(128) | Indexed |
| year | INTEGER | Indexed |
| filename | VARCHAR(512) | Stored filename |
| status | ENUM | processing / complete / failed |
| questions_extracted | INTEGER | Count |
| error_message | TEXT | Nullable |
| created_at | TIMESTAMPTZ | Auto-set |

### questions
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| paper_id | UUID | FK → papers.id (CASCADE) |
| text | TEXT | Full question text |
| topic | VARCHAR(256) | NLP-assigned |
| question_type | ENUM | mcq / short / long / numerical |
| marks | FLOAT | Nullable |
| embedding | vector(384) | pgvector, MiniLM-L6-v2 |

### analysis_results
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| exam_name | VARCHAR(128) | Indexed |
| subject | VARCHAR(128) | Indexed |
| result_json | JSONB | Full analysis output |
| created_at | TIMESTAMPTZ | Auto-set |

---

## Processing Pipeline

```
Upload (PDF/Image)
    │
    ▼
┌─────────────────┐
│  OCR Service     │  pdfplumber → Tesseract fallback
│  (ocr.py)        │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Parser Service  │  Regex question detection, MCQ splitting
│  (parser.py)     │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Topic Classifier│  spaCy noun-chunk extraction
│  (process_paper) │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Embedder        │  sentence-transformers (all-MiniLM-L6-v2)
│  (embedder.py)   │  → stored in pgvector
└────────┬────────┘
         ▼
    Paper marked ✅ complete
```

---

## Error Handling

All endpoints return errors in this format:

```json
{
  "error": "Human-readable message",
  "detail": "Technical details or null"
}
```

HTTP status codes used:
- `400` — Bad request (invalid input)
- `404` — Resource not found
- `500` — Server error
- `503` — Service unavailable (e.g., missing API key)

---

## Project Structure

```
exam-backend/
├── main.py                  # FastAPI app entry point
├── requirements.txt
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── README.md
├── app/
│   ├── api/
│   │   └── routes/
│   │       ├── papers.py    # Upload, list, delete papers
│   │       ├── analysis.py  # Trigger & fetch analysis
│   │       └── predict.py   # AI predictions endpoint
│   ├── core/
│   │   ├── config.py        # Settings from env
│   │   └── database.py      # SQLAlchemy engine + session
│   ├── models/
│   │   ├── paper.py         # Paper, Question DB models
│   │   └── analysis.py      # AnalysisResult model
│   ├── schemas/
│   │   ├── paper.py         # Pydantic request/response schemas
│   │   └── prediction.py    # Prediction schemas
│   ├── services/
│   │   ├── ocr.py           # PDF + image text extraction
│   │   ├── parser.py        # Question extraction from raw text
│   │   ├── embedder.py      # sentence-transformer embeddings
│   │   ├── clusterer.py     # FAISS similarity grouping
│   │   ├── analyzer.py      # Frequency + gap analysis logic
│   │   └── predictor.py     # Claude API prediction service
│   └── tasks/
│       └── process_paper.py # Celery async task
```

---

## License

MIT
