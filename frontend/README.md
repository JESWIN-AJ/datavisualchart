# Insights dashboard — frontend

Next.js + React + D3.js dashboard that reads from the FastAPI backend
(which reads from MongoDB).

## File structure

```
frontend/
├── package.json
├── next.config.js
├── .env.local.example
├── pages/
│   ├── _app.js          global CSS import
│   └── index.js          the dashboard page — owns filter state, fetches data, renders charts
├── components/
│   ├── FilterBar.jsx      sidebar filter controls
│   └── charts/
│       ├── YearTrendChart.jsx   line chart: avg intensity/likelihood/relevance by year
│       ├── BarChart.jsx         generic bar chart (used for country/topic/region)
│       └── ScatterChart.jsx     intensity vs likelihood, sized by relevance, colored by region
├── lib/
│   └── api.js             fetch wrapper for the FastAPI backend
└── styles/
    └── globals.css
```

## Setup

1. Make sure the FastAPI backend is running first (`uvicorn main:app --reload` in `backend/app`).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the env example and adjust if your backend runs somewhere other than localhost:8000:
   ```bash
   cp .env.local.example .env.local
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
5. Open http://localhost:3000

## How it fits together

- `pages/index.js` fetches `/api/filters` once on load to populate every dropdown with real distinct values from your database — nothing is hardcoded.
- Whenever any filter changes, it re-fetches all five chart endpoints in parallel (`by-year`, `by-country`, `by-topic`, `by-region`, and raw `insights` for the scatter plot).
- Each chart component owns its own D3 rendering via a `useRef` + `useEffect` pattern: React manages when the chart re-draws, D3 manages the actual SVG drawing.
- `BarChart.jsx` is written generically (takes `{ label, value }` pairs) so the same component renders the country, topic, and region charts — just fed different data and a different color.

## Known data limitations (carried over from the backend)
- No `city` or `swot` filters — those fields don't exist anywhere in the source `jsondata.json`.
- `end_year` only lists years that actually appear in the data (not a continuous range) — one of them is `2200`, which looks like a data-entry typo in the original file but is left as-is since the assignment says to use the given data only.