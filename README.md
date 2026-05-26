# Resilience Map — Seneca Hackathon 2026

An interactive map-based platform that helps emergency coordinators and the public locate shelters, cooling/warming centers, and resilience hubs in Toronto during climate and energy crises.

---

## What It Does

The platform overlays real-time shelter status on a dark Mapbox map with toggleable climate and social-risk layers. A coordinator can see at a glance which shelters are full, which have power issues, which need support, and what the live forecast temperature is across the GTA — without leaving a single screen.

---

## Features

### Shelter Markers
- Color-coded dots on the map represent each shelter location
- **Green** — available, grid online, capacity under 85%
- **Amber** — grid unstable, or occupancy above 85%
- **Blue** — shelter has active support requests
- **Red** — power outage, or at/over full capacity
- Click any marker to open the detail panel

### Shelter Detail Panel
Sliding sidebar shows the full status of the selected shelter:

| Section | Details |
|---|---|
| **Resilience Score** | 0–100 computed score (green ≥ 70, yellow ≥ 40, red < 40) |
| **Capacity** | Current occupancy vs. total capacity with progress bar |
| **Energy** | Grid status (online / unstable / outage), generator type and fuel, battery kWh + state of charge, solar kW, estimated backup runtime |
| **Services** | Cooling, heating, device charging, medical support, water, food, accessibility, pet-friendly |
| **Needs Support** | Active requests flagged in yellow |
| **Reports** | Community-reported issues flagged in red |
| **Data source** | City of Toronto Open Data link and update date |

### Shelter Types
- `Shelter` — general overnight shelter
- `Cooling Center` — heat emergency refuge
- `Warming Center` — cold weather refuge
- `Resilience Hub` — multi-service community facility

### Risk Layer Toggles
Seven overlays controlled from the top-left panel:

| Layer | Color | Source |
|---|---|---|
| Heat Risk | Orange | Demo GeoJSON |
| Flood Risk | Blue | TRCA Flood Plain |
| Power Outage | Yellow | Demo GeoJSON |
| Grid Stress | Purple | Demo GeoJSON |
| Community Need | Green → Red | City of Toronto Neighbourhood Profiles 2021 |
| Older Adults 65+ | Pink → Red | City of Toronto Neighbourhood Profiles 2021 |
| Forecast Temperature | Green → Red badges | ECCC MSC GeoMet (live API) |

**Community Need** is a composite score of children share, older-adult share, low-income rate, unemployment rate, and tenant shelter cost burden rate (each normalized 0–1 then averaged).

**Older Adults 65+** uses population thresholds: low < 12%, medium 12–18%, high 18–24%, extreme ≥ 24%.

**Forecast Temperature** shows live Environment and Climate Change Canada (ECCC) temperature data for 8 GTA cities as clickable badge markers. Badges are color-coded by heat risk level (green < 26°C → red ≥ 34°C) and support three time offsets: **Now**, **Today High**, and **Tomorrow High**. Falls back to mock data if the ECCC API is unavailable.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 6 |
| Language | TypeScript |
| Map | Mapbox GL JS v3 |
| State | Zustand v5 |
| Styling | Tailwind CSS v3 |

---

## Project Structure

```
cronito11/
├── src/
│   ├── App.tsx                  # Root layout (map + controls + panel)
│   ├── store.ts                 # Zustand global state (layers, shelters, forecast)
│   ├── types.ts                 # TypeScript types (Shelter, LayerId, ForecastTemperaturePoint)
│   ├── index.css                # Tailwind base + shelter marker + temp badge styles
│   ├── components/
│   │   ├── MapView.tsx          # Mapbox map, GeoJSON layers, shelter & weather markers
│   │   ├── LayerControls.tsx    # Top-left layer toggle panel with tooltips + offset selector
│   │   └── ShelterPanel.tsx     # Right-side shelter detail sidebar
│   ├── services/
│   │   └── weather.ts           # ECCC MSC GeoMet API client + mock fallback
│   └── data/
│       └── shelters.ts          # Shelter records (real names/addresses/capacity + demo energy fields)
├── public/
│   └── layers/
│       ├── flood.geojson        # TRCA flood plain polygons
│       └── community-need.geojson  # Toronto neighbourhood risk data
├── data/
│   └── daily-shelter-overnight-service-occupancy-capacity-2025.json  # Source data
├── docs/
│   └── implementation-plan.md   # Phased implementation plan
└── package.json
```

---

## Data Sources

- **Shelters** — [City of Toronto Daily Shelter & Overnight Service Occupancy/Capacity](https://open.toronto.ca/dataset/daily-shelter-overnight-service-occupancy-capacity/)  
  Names, addresses, capacity, and occupancy are real. Energy fields (generator, battery, solar) are demo estimates.
- **Flood** — Toronto Region Conservation Authority (TRCA) flood plain data
- **Community Need / Older Adults** — City of Toronto Neighbourhood Profiles 2021
- **Forecast Temperature** — [ECCC MSC GeoMet](https://api.weather.gc.ca/) `citypageweather-realtime` collection (OGC API Features, public, no auth required)

> Demo data is clearly labeled in the UI and not intended for actual emergency response decisions.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Mapbox access token](https://account.mapbox.com/)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
echo "VITE_MAPBOX_TOKEN=pk.your_token_here" > .env

# 3. Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Other Commands

```bash
npm run build             # Production build
npm run preview           # Preview production build locally
npm run process:shelters  # Re-generate shelters.ts from raw City of Toronto data
```

---

## Roadmap

Completed phases:

- [x] Phase 1 — Project scaffold (React + Vite + TypeScript + Mapbox)
- [x] Phase 2 — Map + layer control framework
- [x] Phase 3 — Shelter markers with status colors
- [x] Phase 4 — Shelter detail panel + flood, community-need, older-adults polygon layers
- [x] Phase 4.5 — Live forecast temperature layer (ECCC MSC GeoMet, badge markers, 3 time offsets)

Planned:

- [ ] Phase 5 — Real-time coordination feed (mock live support requests and alerts)
- [ ] Phase 6 — Simulated real-time updates (occupancy, grid changes, resilience score recalc)
- [ ] Phase 7 — Demo polish (responsive layout, filters, loading states)

---

## Security Notes

- Never commit `.env` or the Mapbox token to version control
- Demo data must be clearly labeled and not used for actual emergency decisions
