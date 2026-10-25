# ArthNiti — Indian Economic Intelligence

> **"Understand the Economy. Discover the Data."**

**ArthNiti** (`arthniti-economic-intelligence`) is a financial research terminal and editorial data storytelling platform designed to make Indian macroeconomic data clear, rigorous, and interactive for economists, analysts, policy researchers, students, and fintech professionals.

---

## 1. Key Features

- **3D India Orbital Economic Network Visualization**: Interactive Three.js hero model highlighting India's geographic contour, 7 regional economic hubs (Mumbai, New Delhi NCR, Bengaluru, Chennai, GIFT City/Ahmedabad, Hyderabad, Kolkata), inter-city economic corridors, software-WebGL performance guards, and an instant 2D SVG/CSS vector fallback.
- **9 Complete Analytical Modules**:
  1. **Overview**: Hero section, 6 core KPI cards, Economic Pulse narrative, Relationship Explorer, Latest Macroeconomic Releases, and Source Provenance.
  2. **GDP & Growth**: Quarterly and Annual views, Real (Constant 2011–12) vs. Nominal GDP trajectories, Implicit GDP Deflator wedge, and Sectoral GVA breakdown.
  3. **Inflation**: Headline CPI, Core CPI, and Consumer Food Price Index (CFPI) plotted against the Reserve Bank of India's statutory `4.0% (±2%)` tolerance band, plus an interactive *Disinflation vs. Cumulative Price Level* explainer.
  4. **Labour Market**: PLFS Unemployment Rate (UR), Labour Force Participation Rate (LFPR), Worker Population Ratio (WPR), and Usual Status (`ps+ss`) vs. Current Weekly Status (`CWS`) methodology.
  5. **Currency & Oil**: USD/INR exchange rate, 40-Currency REER, Indian Basket Crude Oil prices, and a 4-stage macroeconomic balance-of-payments transmission mechanism explainer.
  6. **Financial Markets**: Historical end-of-month settlement series for NIFTY 50, BSE SENSEX, 10-Year India Benchmark G-Sec Yield, and the RBI Monetary Policy Corridor (Repo, SDF, MSF) with explicit non-live archival notices.
  7. **Economic Comparisons**: Multi-series comparison workbench supporting Base-100 Indexing, Cumulative `%` Change, and Dual-Scale Axes with unit-compatibility safeguards and Pearson correlation ($r$) calculation.
  8. **Data Sources**: Institutional directory documenting MoSPI (NSO), RBI DBIE, PLFS, PPAC (MoPNG), and NSE/BSE coverage dates, base years, release lags, and known statistical limitations.
  9. **About ArthNiti**: Editorial charter, FastAPI backend contract, and developer setup documentation.
- **Interactive Chart Toolbar**: Every analytical chart supports `1Y`, `3Y`, `5Y`, `10Y`, and `MAX` date-range slicing, `Area` / `Line` / `Bar` chart switching, CSV data export with metadata headers, fullscreen modal expansion, and built-in state verification (`Data`, `Loading`, `Empty`, `Error`).
- **Dual Theme Support**: Switches seamlessly between **Midnight Navy & Emerald** (default dark research terminal) and **Editorial Light Mode**.

---

## 2. Technology Stack

- **Frontend Framework**: React 19 + TypeScript + Vite
- **Styling & Typography**: Tailwind CSS v4 (`Fraunces` editorial display serif, `Plus Jakarta Sans` UI prose, `JetBrains Mono` tabular numerals)
- **Analytical Charts**: Recharts
- **Motion & Microinteractions**: Motion for React (`motion/react`)
- **3D Visualization**: Three.js (with `RoomEnvironment` PBR lighting, software-WebGL detection, and SVG fallback)
- **Icons**: Lucide React

---

## 3. Illustrative Data Disclosure & Future FastAPI Backend Integration

This repository currently runs the **Frontend Phase** of ArthNiti:
- All charts and KPI cards display a clearly labelled **10-Year Illustrative Indian Macroeconomic Dataset (2016–2026)** modeled on official MoSPI, RBI, PLFS, and PPAC statistical definitions.
- **No sample series is claimed to be a live real-time feed.**
- All data access is encapsulated inside `src/services/economyService.ts`. To connect a Python **FastAPI** backend later:
  1. Set `VITE_API_BASE_URL=http://localhost:8000` in `.env.local`.
  2. Expose `GET /api/v1/indicators` returning the `EconomicIndicator[]` schema defined in `src/types/economy.ts`.
  3. If the FastAPI backend is unreachable, `economyService.ts` gracefully falls back to the verified local dataset.

---

## 4. Installation & Setup Instructions (Windows / macOS / Linux)

### Windows Setup (PowerShell or Command Prompt)

```powershell
# 1. Clone the repository
git clone https://github.com/your-username/arthniti-economic-intelligence.git
cd arthniti-economic-intelligence

# 2. Create your local environment file
Copy-Item .env.example .env.local

# 3. Install Node.js dependencies
npm install

# 4. Start the Vite development server on port 3000
npm run dev

# 5. Type-check and build for production
npm run lint
npm run build
```

---

## 5. Architecture Overview

```text
src/
├── components/
│   ├── cards/
│   │   └── KpiCard.tsx                 # Context-aware KPI card with sparkline & tabular numerals
│   ├── charts/
│   │   └── AnalyticalChartPanel.tsx    # Recharts panel with toolbar, CSV export & fullscreen modal
│   ├── dashboard/
│   │   └── RelationshipExplorer.tsx    # Dual-series normalization & correlation vs. causation engine
│   ├── navigation/
│   │   ├── Sidebar.tsx                 # Collapsible sidebar with animated indicator & mobile drawer
│   │   └── TopBar.tsx                  # Breadcrumb, global indicator search & theme switcher
│   └── visualizations/
│       └── IndiaEconomicGlobe.tsx      # Lazy-loaded Three.js 3D India network globe + SVG fallback
├── data/
│   └── mockEconomicData.ts             # 10-year illustrative Indian macroeconomic series & sources
├── pages/                              # 9 complete dedicated analytical modules
├── services/
│   └── economyService.ts               # Configurable FastAPI client, Base-100 normalizer & CSV exporter
└── types/
    └── economy.ts                      # Strict TypeScript interfaces for indicators, observations & sources
```

---

## 6. Deployment Guide (Vercel / GitHub Pages)

- **Vercel**: Import `arthniti-economic-intelligence` into Vercel, set Framework Preset to **Vite**, Build Command to `npm run build`, and Output Directory to `dist`.
- **GitHub Pages**: Run `npm run build` and deploy the generated static `dist/` folder via `gh-pages` or GitHub Actions static workflow.
