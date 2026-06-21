# 🅿️ SmartPark AI — Parking-Induced Congestion Intelligence

> **Transform congestion into actionable intelligence.**
> An AI-powered parking-enforcement & congestion command center for Bengaluru — built for the Flipkart Gridlock Hackathon 2.0.

This repository contains **two applications**:

| Folder | Stack | What it is |
| ------ | ----- | ---------- |
| [`Flipkart_grid-main/backend`](Flipkart_grid-main/backend) | Python · Streamlit | The data + ML backend dashboard (CIS/EPI analytics, Folium maps, RandomForest forecasting, Groq LLM, OR-Tools VRP routing). |
| [`Flipkart_grid-main/frontend`](Flipkart_grid-main/frontend) | React · Vite · TailwindCSS · Framer Motion | A premium glassmorphic command-center UI (landing page + 7-tab dashboard) with Leaflet maps and Recharts. |

---

## ✨ Highlights

- **CIS (Congestion Impact Score)** — per-violation scoring from severity × vehicle size × time factor × junction factor.
- **EPI (Enforcement Priority Index)** — ranks stations by combined CIS volume, frequency, and severity.
- **Live CCTV vision pipeline** — simulated YOLOv8 edge detection of illegal parking.
- **OR-Tools fleet routing** — capacitated VRP for optimal multi-truck patrol/tow dispatch.
- **ML forecasting** — RandomForest next-hour congestion risk with feature attribution + z-score anomaly detection.
- **Tactical AI commander** — Groq LLM dispatch planning and executive briefings.

---

## 🚀 Quick start

### Backend (Streamlit)

```bash
cd Flipkart_grid-main/backend
pip install -r requirements.txt
streamlit run app.py
```

> Optional: set `GROQ_API_KEY` in a `.env` file to enable the live Tactical AI Commander (falls back to demo responses otherwise).

### Frontend (React + Vite)

```bash
cd Flipkart_grid-main/frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle → dist/
```

---

## 🧱 Dashboard tabs

1. **🏠 Command Center** — KPI cards, CIS-weighted heatmap, 24-hour congestion playback.
2. **📊 Congestion Analytics** — hourly/daily charts, risk radar, emergency-route vulnerability, economic-loss clock.
3. **🎯 Intelligent Dispatch** — patrol simulator, EPI leaderboard, effectiveness scoring.
4. **🤖 Tactical AI Commander** — LLM chat, dispatch plans, feature importance, anomaly log.
5. **📂 Data Inspector** — upload, cleaning pipeline, EDA, anomaly-highlighted table.
6. **📷 Live CCTV Vision** — bounding-box detection feed + auto-generated infraction log.
7. **🚛 OR-Tools Fleet** — multi-colour optimized routes + collapsible truck manifests.

---

## 📁 Repository layout

```
.
└── Flipkart_grid-main/
    ├── backend/      # Streamlit app (app.py, tabs/, data/, charts/, config/)
    └── frontend/     # React + Vite app (src/, see frontend/README.md)
```

See [`frontend/README.md`](Flipkart_grid-main/frontend/README.md) for full frontend documentation (design tokens, component structure, data layer).

---

<p align="center">
  🅿️ <b>SmartPark AI</b> · Flipkart Gridlock Hackathon 2.0 · Bengaluru
</p>
