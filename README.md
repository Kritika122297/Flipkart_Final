# ParkWatch AI — Parking-Induced Congestion Intelligence

> **Transform congestion into actionable intelligence.**
> An AI-powered parking-enforcement and congestion command center for Bengaluru — built for the Flipkart Grid Hackathon.

---

## Architecture

| Layer | Stack | Role |
|-------|-------|------|
| **Backend** | Python · FastAPI · Pandas · XGBoost · LightGBM · scikit-learn | REST API, ETL pipeline, 4 ML models, OR-Tools VRP, Groq LLM |
| **Frontend** | React 18 · Vite · TailwindCSS · Framer Motion · Leaflet | Glassmorphic 7-tab dashboard with live maps and charts |

---

## Key Features

### Scoring Engine
- **CIS (Congestion Impact Score)** — per-violation score = severity × vehicle size × time factor × junction factor, normalized 0–100
- **EPI (Enforcement Priority Index)** — ranks stations by weighted combination of CIS volume, frequency, and severity

### ML Pipeline (4 Models)
| Model | Algorithm | Purpose |
|-------|-----------|---------|
| ETA Predictor | XGBoost → RandomForest fallback | Tow-truck dispatch time (minutes) |
| Violation Propensity | LightGBM → DecisionTree fallback | Most likely violation type per station/hour |
| Emerging Hotspots | DBSCAN / KMeans | Zones with >20% week-over-week density growth |
| Economic Forecast | Seasonal decomposition | 30-day congestion-loss projection |

- Pre-trained on **234,759 real violations** (Jan–May, Bengaluru)
- **Live incremental retraining** — every 50 CCTV detections trigger a background retrain
- ML status bar in Command Center shows engine (XGBoost/LightGBM/fallback), training status, and live buffer progress

### Real Dataset
- 234,759 anonymized police violation records across 38 Bengaluru stations
- ETL pipeline: fuzzy column mapping, Bengaluru geo-fence filter, CIS normalization
- Async CSV upload — returns a `job_id` immediately, heavy processing runs in background, frontend polls for completion

### Command Center
- Live KPI cards with count-up animation (violations, avg CIS, AI uptime, fleet)
- CIS-weighted heatmap with smooth 24-hour timelapse playback
  - Heat layer updates in-place (`setLatLngs` + `redraw`) — no flicker between frames
  - Full cyan → violet → amber → rose gradient, calibrated to real intensity range
  - Peak-hour indicator bar on slider (rush bands at 8–10am and 5–8pm)
  - Time-of-day badge: NIGHT / DAWN / RUSH AM / MIDDAY / RUSH PM / EVENING
  - Marker density toggle: Low (10%) / Mid (30%) / All (100%)
- **Hotspot cards → map sync**: clicking a station card flies the map to that location, drops a colored pin + pulsing radar ring, and highlights its markers

### Fleet & Dispatch
- OR-Tools CVRP routing for multi-truck patrol (falls back to nearest-neighbour)
- ETA badges per dispatch stop (green <10 min, amber <20 min, rose ≥20 min)
- Emerging hotspot zones overlaid as amber dashed rings on the map

### Other Tabs
- **Congestion Analytics** — hourly/daily charts, risk radar, emergency-route vulnerability, economic-loss clock
- **Tactical AI Commander** — Groq LLM chat, dispatch plans, feature importance, z-score anomaly log
- **Data Inspector** — async CSV upload with polling progress bar, ETL quality report, anomaly-highlighted table
- **Live CCTV Vision** — simulated YOLOv8 edge detections, auto infraction log, feeds live ML retraining
- **OR-Tools Fleet** — multi-colour optimized routes with collapsible truck manifests

---

## Quick Start

### Backend (FastAPI)

```bash
cd Flipkart_grid-main/backend
pip install -r requirements.txt

# Optional: copy and fill in your API key
cp .env.example .env

uvicorn api.main:app --reload --port 8000
```

The server binds immediately; ML models pre-train in a background thread (~60s). Predictions fall back to physics-based formulas until models are ready.

**Default credentials**

| Username | Password | Role |
|----------|----------|------|
| `admin` | `btp123` | Admin |
| `user` | `user123` | Patrol Officer |

### Frontend (React + Vite)

```bash
cd Flipkart_grid-main/frontend
npm install
npm run dev        # http://localhost:5173
```

Ensure the backend is running on port 8000 before opening the dashboard.

---

## Environment Variables

Copy `Flipkart_grid-main/backend/.env.example` to `.env`:

```
GROQ_API_KEY=your_key_here        # Tactical AI Commander (optional — falls back to demo)
PARKWATCH_SECRET=change-me        # JWT signing secret
CORS_ORIGINS=https://your-domain  # Production frontend origin (optional)
```

---

## Repository Layout

```
Flipkart_grid-main/
├── backend/
│   ├── api/
│   │   ├── main.py        # FastAPI app — all endpoints
│   │   ├── ml.py          # 4 ML models + live retraining
│   │   ├── etl.py         # ETL pipeline (fuzzy mapping, geo-fence, CIS)
│   │   ├── loader.py      # Real dataset + demo/synthetic fallback
│   │   ├── forecasting.py # Day-risk + hourly CIS forecast
│   │   ├── alerts.py      # Rolling z-score + IsolationForest anomalies
│   │   ├── agent.py       # Groq LLM tactical agent
│   │   ├── rag.py         # Retrieval-augmented context (ChromaDB / keyword)
│   │   └── helpers.py     # CIS scoring primitives
│   ├── Dataset/           # Real violation CSV (gitignored if large)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── tabs/          # 7 dashboard tabs
│   │   ├── components/    # Map, KPI cards, charts, auth
│   │   ├── context/       # Auth, Config, Location contexts
│   │   └── lib/           # API client, hooks, design tokens
│   └── package.json
├── render.yaml             # Render.com deployment config
└── DEPLOYMENT.md
```

---

## Tech Stack

**Backend:** FastAPI, Pandas, NumPy, XGBoost, LightGBM, scikit-learn, OR-Tools, Groq SDK, python-dotenv

**Frontend:** React 18, Vite, TailwindCSS, Framer Motion, Leaflet + leaflet.heat, Recharts, Axios, Lucide React

---

<p align="center">
  <b>ParkWatch AI</b> · Flipkart Grid Hackathon · Bengaluru
</p>
