# ParkWatch AI — Bengaluru Traffic Enforcement Command Center

An AI-powered parking enforcement platform that transforms raw traffic violation data into real-time actionable intelligence for the Bengaluru Traffic Police (BTP). Built for Flipkart Grid 6.0.

**Live Demo:** [https://frontend-two-drab-37.vercel.app](https://frontend-two-drab-37.vercel.app)

---

## What It Does

ParkWatch AI ingests BTP violation CSV data and turns it into a full command center with:

- **Live CCTV Vision** — simulated YOLOv8 edge inference detecting parking violations in real time, computing a Congestion Impact Score (CIS) per detection
- **Congestion Analytics** — hourly trend charts, CIS area curves, risk radar, and economic loss counters
- **Intelligent Dispatch** — patrol simulator with EPI (Enforcement Performance Index) scoring and an OR-Tools VRP solver that routes tow trucks optimally
- **Tactical AI Commander** — chat-based agent (Groq LLM or deterministic fallback) for patrol strategy recommendations
- **Predictive ML** — ETA prediction, violation propensity scoring, emerging hotspot detection, 30-day economic loss forecast
- **Data Inspector** — CSV upload with fuzzy header mapping and automated cleaning toggles
- **Interactive Maps** — Leaflet heatmaps with 24-hour playback slider across Bengaluru zones

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| API framework | FastAPI 0.110+, Uvicorn |
| Data | Pandas 2.0+, NumPy 1.24+ |
| ML models | Scikit-learn, XGBoost 2.0+, LightGBM 4.0+ |
| Routing solver | OR-Tools 9.7+ (CVRP/VRP) |
| LLM | Groq API (optional; falls back to deterministic analysis) |
| Forecasting | Prophet 1.1.5+ (optional; falls back to seasonal-naive) |
| RAG | ChromaDB + sentence-transformers (optional) |
| Database | PostgreSQL via Supabase/Neon (optional; in-memory fallback) |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18.3+, Vite 5.3+ |
| Styling | TailwindCSS 3.4+ |
| Animation | Framer Motion 11.3+ |
| Charts | Recharts 2.12+ |
| Maps | Leaflet 1.9+, react-leaflet, leaflet.heat |
| HTTP | Axios 1.18+ |
| Icons | Lucide React |

---

## Dashboard Tabs

| Tab | Access | Description |
|---|---|---|
| Command Center | All | Live KPI strip, Bengaluru violation heatmap, 24-hour playback |
| Congestion Analytics | All | Hourly trends, CIS curves, risk radar, economic loss counter |
| Intelligent Dispatch | Admin | Patrol simulator, EPI leaderboard, fleet VRP optimization |
| Tactical AI Commander | Admin | Chat agent for patrol strategy, anomaly logs, dispatch plans |
| Data Inspector | Admin | CSV upload, fuzzy ETL, cleaning toggles, anomaly table |
| Live CCTV Vision | All | YOLOv8 bounding boxes, live infraction log, CIS per detection |
| OR-Tools Fleet | Admin | Multi-vehicle route map, fleet-size slider, tow manifests |

**Demo credentials**
- `admin` / `btp123` — full access to all tabs
- `user` / `user123` — limited access (Command Center, Analytics, CCTV)

---

## Project Structure

```
Flipkart_grid-main/
├── backend/
│   ├── api/
│   │   ├── main.py          # FastAPI app, all endpoints, auth, CIS logic
│   │   ├── ml.py            # ML models, live detection buffer, retraining
│   │   ├── agent.py         # Tactical AI commander (LangGraph / Groq)
│   │   ├── rag.py           # ChromaDB vector RAG module
│   │   ├── forecasting.py   # Prophet / seasonal-naive forecasting
│   │   ├── alerts.py        # Anomaly detection & alert generation
│   │   ├── etl.py           # Data cleaning pipeline
│   │   ├── loader.py        # CSV ingestion with fuzzy header mapping
│   │   └── helpers.py       # Shared utilities
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── tabs/            # 7 dashboard tab components
│   │   ├── components/      # Reusable UI components (GlassCard, Map, Charts)
│   │   ├── context/         # Auth, Location, Config contexts
│   │   ├── lib/             # Axios API client, chart themes
│   │   └── data/            # Mock/seed data
│   ├── vercel.json
│   └── package.json
├── Dataset/                 # Bengaluru BTP violation CSV (~104 MB)
├── render.yaml              # Render deployment blueprint
└── DEPLOYMENT.md            # Detailed deployment guide
```

---

## Running Locally

### Prerequisites
- Python 3.12+
- Node.js 18+

### Backend

```bash
cd Flipkart_grid-main/backend
pip install -r requirements.txt
cp .env.example .env          # add GROQ_API_KEY if you have one
uvicorn api.main:app --reload --port 8000
```

The API runs at `http://localhost:8000`. All endpoints are prefixed with `/api`.

### Frontend

```bash
cd Flipkart_grid-main/frontend
npm install
npm run dev                   # http://localhost:5173
```

The frontend auto-connects to `http://localhost:8000/api`. No env file needed for local dev.

---

## Environment Variables

### Backend (`.env`)

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Optional | Groq LLM key — enables AI Commander chat. Falls back to deterministic analysis if absent. |
| `PARKWATCH_SECRET` | Recommended | JWT signing secret. Defaults to a dev placeholder. |
| `CORS_ORIGINS` | Production | Comma-separated list of allowed frontend origins (e.g. your Vercel URL). |
| `DATABASE_URL` | Optional | PostgreSQL connection string (Supabase/Neon). Falls back to in-memory if absent. |

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_BASE` | Backend API base URL. Defaults to `http://localhost:8000/api`. Set to your Render URL in production. |

---

## API Reference (key endpoints)

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | JWT login |
| GET | `/api/telemetry/summary` | Live KPI strip |
| GET | `/api/map/violations` | Violation markers |
| GET | `/api/map/playback` | Hourly playback timeline |
| GET | `/api/analytics/charts` | All chart data |
| GET | `/api/forecast/predict` | 7-day seasonal/Prophet forecast |
| GET | `/api/forecast/economic` | 30-day economic loss forecast |
| POST | `/api/predict/eta` | ETA prediction |
| GET | `/api/predict/propensity` | Violation propensity score |
| GET | `/api/predict/emerging` | Emerging hotspots |
| POST | `/api/simulator/evaluate` | Patrol simulator |
| POST | `/api/dispatcher/vrp` | Fleet VRP optimization |
| GET | `/api/ortools/solve` | OR-Tools CVRP solver |
| POST | `/api/commander/chat` | AI agent chat |
| GET | `/api/cctv/cameras` | Camera grid + seed detections |
| POST | `/api/cctv/infraction` | Log CCTV detection, compute CIS |
| POST | `/api/data/upload` | Upload violation CSV |
| POST | `/api/data/clean` | Apply cleaning rules |
| GET | `/api/alerts` | Active anomaly alerts |
| GET | `/api/health` | Health check |

---

## Deployment

| Service | Platform | Config file |
|---|---|---|
| Frontend | Vercel | `frontend/vercel.json` |
| Backend | Render | `render.yaml` |

See [DEPLOYMENT.md](DEPLOYMENT.md) for full step-by-step instructions.

### Quick deploy

**Backend (Render):**
1. New → Blueprint → connect `Kritika122297/Flipkart_Final`
2. Blueprint path: `Flipkart_grid-main/render.yaml`
3. Set `GROQ_API_KEY` and `CORS_ORIGINS` in env vars
4. Deploy

**Frontend (Vercel):**
```bash
cd Flipkart_grid-main/frontend
npx vercel --prod
# Set VITE_API_BASE = https://<your-render-service>.onrender.com/api
```

---

## Graceful Degradation

ParkWatch AI works fully offline with demo data and progressively unlocks features as services are configured:

| Feature | Without config | With config |
|---|---|---|
| Data persistence | In-memory (resets on restart) | PostgreSQL (Supabase/Neon) |
| AI Commander | Deterministic rule-based analysis | Groq LLM (llama-3.3-70b) |
| Forecasting | Seasonal-naive | Facebook Prophet |
| RAG context | Keyword search | ChromaDB vector search |
| Header mapping | stdlib difflib | rapidfuzz |

---

## Dataset

The system ships with a real anonymized BTP violation dataset covering January–May across Bengaluru zones (`Dataset/jan to may police violation_anonymized791b166.csv`). Additional datasets can be uploaded live via the Data Inspector tab — the ETL pipeline handles fuzzy column mapping automatically.
