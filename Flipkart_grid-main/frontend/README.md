# SmartPark AI — Frontend

> **Transform congestion into actionable intelligence.**
> A premium, glassmorphic command center for AI-powered parking enforcement in Bengaluru — the React front end for the ParkWatch / SmartPark backend.

## Stack

| Concern        | Tech                                   |
| -------------- | -------------------------------------- |
| Framework      | React 18 + Vite                        |
| Styling        | TailwindCSS 3 (custom design tokens)   |
| Animation      | Framer Motion                          |
| Charts         | Recharts                               |
| Maps           | Leaflet + react-leaflet + leaflet.heat |
| Icons          | lucide-react                           |
| Routing        | react-router-dom                       |

## Getting started

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle → dist/
npm run preview    # preview the built bundle
```

## What's inside

### Landing page (`/`)
- **Hero** — interactive Leaflet map of Bengaluru (MG Road, Koramangala, Whitefield, Electronic City, Indiranagar, Jayanagar, Majestic…) with a CIS-weighted heatmap, pulsing critical hotspots, expanding radar rings, and a floating `LIVE — 847 Active Violations` badge.
- **Features bento grid** — YOLO CCTV (cyan), OR-Tools VRP (emerald), Gemini tactical planning (violet), ML forecasting (amber).
- **Live dashboard preview** — rose violations counter, violet CIS, amber real-time economic-loss clock.
- **Smart analytics preview**, **count-up impact metrics**, and a **violet-gradient CTA** that transitions into the dashboard.

### Operations dashboard (`/dashboard`)
Seven tabs, accessed from the glowing sidebar:

1. **🏠 Command Center** — accent KPI cards, DarkMatter heatmap, 24-hour congestion playback slider.
2. **📊 Congestion Analytics** — hourly bars, CIS area chart, risk radar, rose emergency-route bars, ticking economic-loss counter.
3. **🎯 Intelligent Dispatch** — patrol simulator sliders, emerald CIS-reduction curve, EPI leaderboard.
4. **🤖 Tactical AI Commander** — chat console (violet user / cyan AI bubbles), dispatch plan, feature-importance bars, anomaly log.
5. **📂 Data Inspector** — drag-active upload zone, cleaning toggles, anomaly-highlighted data table.
6. **📷 Live CCTV Vision** — YOLO feed with bounding boxes, cyan scanning reticle, `LIVE REC` badge, infraction log.
7. **🚛 OR-Tools Fleet** — multi-colour route map, fleet-size slider, collapsible route manifests.

## Design system

All tokens live in [`tailwind.config.js`](tailwind.config.js), [`src/index.css`](src/index.css) and [`src/lib/tokens.js`](src/lib/tokens.js):

- **Surfaces** `#080C14` / `#0E1525` / `#131D30`
- **Accents** violet `#7C6AF7`, cyan `#22D3EE`, emerald `#10B981`, amber `#F59E0B`, rose `#FB4D6D` (each with `main` / `glow` / `muted`)
- Glassmorphism via the `.glass` utility · accent glow shadows `shadow-glow-*` · staggered Framer Motion entrances.

## Data

The UI runs on a deterministic synthetic data layer in [`src/data/mockData.js`](src/data/mockData.js) that mirrors the Streamlit backend's domain model (CIS, EPI, economic-loss, fleet routing, CCTV detections). Swap these exports for live API calls to wire it to the Python backend.
