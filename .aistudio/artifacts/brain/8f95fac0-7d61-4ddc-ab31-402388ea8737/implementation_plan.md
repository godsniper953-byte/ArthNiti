# ArthNiti — Indian Economic Intelligence Platform

ArthNiti transforms complex Indian macroeconomic indicators—GDP growth, CPI inflation, labour force dynamics, INR currency movements, crude oil transmission, RBI monetary policy, and financial markets—into an authoritative, high-clarity financial research terminal and editorial data storytelling experience.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and product choices have been confirmed from your answers and integrated into this blueprint:

- **Confirmed Decision 1 — 3D Hero Visualization**: An interactive **3D Orbital Globe with India Network Nodes** rendered via Three.js with hardware/software WebGL performance guards, featuring a glowing India outline, regional economic hub nodes (Mumbai, Delhi NCR, Bengaluru, Chennai, Kolkata, Hyderabad, GIFT City), orbital data arcs, and a seamless SVG/CSS fallback when WebGL is unavailable or reduced motion is preferred.
- **Confirmed Decision 2 — Dual Theme Architecture**: Defaults to the **Midnight Navy & Emerald Dark Terminal** posture (`#060B16` / `#0B1325` surfaces, `#10B981` emerald primary accent, `#F59E0B` warm gold secondary accent) with a full **Editorial Light Mode** toggle (`#F8FAFC` / `#FFFFFF` crisp broadsheet canvas, `#0F172A` ink, `#059669` deep emerald, `#D97706` warm amber) accessible from the top navigation bar.
- **Confirmed Decision 3 — 10-Year Historical Series (2016–2026)**: Complete 10-year macroeconomic datasets with **quarterly and monthly granularity**, transparent MoSPI / RBI / CMIE / PPAC / NSE source metadata, unit definitions, and an explicit illustrative development data disclosure banner with configurable `VITE_API_BASE_URL` readiness for a future FastAPI backend.

---

## 1. Overview & Core Concept

- **What It Does**: Provides an end-to-end macroeconomic research workspace for exploring India's economy across 9 specialized views—Overview, GDP & Growth, Inflation, Labour Market, Currency & Oil, Financial Markets, Economic Comparisons, Data Sources, and About ArthNiti—complete with interactive multi-range charts, correlation vs. causation relationship explorers, CSV exports, and methodological notes.
- **Target Audience / Persona**: Economists, institutional analysts, policy researchers, fintech professionals, and students seeking rigorous Indian macroeconomic context without cluttered spreadsheets or opaque black-box claims.
- **Key Value**: Combines the quantitative density and tabular precision of an institutional financial terminal with clear, transparent editorial explanations of economic mechanisms (such as real vs. nominal GDP, CPI weightings, and Brent crude-to-INR transmission channels).

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Landing & Hero Exploration**: Users arrive on the Overview workspace featuring the ARTHNITI wordmark, the headline *"See the Forces Shaping India's Economy"*, a data freshness indicator, and the interactive 3D India Orbital Network Globe. Clicking **"Explore the Economy"** smoothly scrolls to or focuses the live KPI deck and Economic Pulse; clicking **"View Methodology"** opens the Data Sources & Methodology view.
2. **KPI Deck & Semantic Interpretation**: Users inspect 6 core KPI cards (Real GDP Growth, CPI Headline Inflation, Unemployment Rate, USD/INR Exchange Rate, Indian Basket Crude Oil, RBI Repo Rate). Each card displays tabular numerals, period-over-period delta with context-aware semantic coloring (e.g., rising inflation or unemployment is flagged as cautionary/negative, whereas rising GDP growth is positive), a mini sparkline, reporting period, and official source attribution. Clicking any card navigates directly to its deep-dive analytical page.
3. **Interactive Chart Toolbar & Deep-Dive Pages**: Across every analytical module, users can switch historical timeframes (`1Y`, `3Y`, `5Y`, `10Y`, `Max`), toggle chart representations (`Line`, `Area`, `Bar`), inspect synchronized crosshairs with rich unit/source tooltips, expand any chart into a **Fullscreen Modal View**, or click **Download CSV** with instant confirmation feedback.
4. **Economic Pulse & Relationship Explorer**: Users select any two compatible macroeconomic indicators (e.g., *Brent Crude Oil* vs. *USD/INR*, or *RBI Repo Rate* vs. *CPI Inflation*) over a chosen date window to inspect normalized index trends (`Base 100`), percentage changes, dual-axis series, and a scatter/relationship chart—accompanied by an explicit guard explaining why observed correlation does not imply causation.
5. **Global Indicator Search & Command Navigation**: From the top bar, users can search across all tracked Indian indicators, sources, and economic concepts to jump immediately to the relevant chart or methodology note.

### Visual Identity & Theme
- **Aesthetic Direction**: Institutional Financial Terminal meets Editorial Broadsheet—disciplined, high-contrast, zero visual bloat, with fine `1px` structural hairlines and subtle glassmorphic floating overlays.
- **Color Palette & Mood (60-30-10 Allocation)**:
  - *Dark Terminal Default*:
    - `--background`: `#060B16` (Near-black navy canvas, 60%)
    - `--surface`: `#0B1325` and `#111C35` (Deep midnight blue structural layers with `rgba(148, 163, 184, 0.12)` 1px borders, 30%)
    - `--primary`: `#10B981` (Emerald green for primary actions, active states, and constructive economic momentum, 10%)
    - `--accent`: `#F59E0B` (Warm gold for secondary series, structural benchmarks, and RBI policy highlights)
    - `--supporting`: `#06B6D4` (Muted cyan for comparative series), `#F8FAFC` (Cool white primary text), `#94A3B8` (Slate gray muted metadata)
    - `--semantic`: `#10B981` (Favorable movement), `#EF4444` (Restrained crimson for adverse macroeconomic movement), `#64748B` (Neutral/unchanged policy stance)
  - *Editorial Light Mode*:
    - `--background`: `#F8FAFC` (Crisp alabaster slate)
    - `--surface`: `#FFFFFF` with `#E2E8F0` hairline borders
    - `--primary`: `#059669` (Deep emerald) and `--accent`: `#D97706` (Warm institutional gold)
- **Typography & Hierarchy (2+1 Font Rule)**:
  - *Editorial Display Headings*: **Fraunces** (variable optical serif, 600 weight, tight tracking) for major page titles and editorial section headers.
  - *Interface & Analytical Prose*: **Plus Jakarta Sans** (400, 500, 600, 700) for crisp navigation, explanatory copy, and controls.
  - *Financial Figures & Telemetry*: **JetBrains Mono** with strict `font-variant-numeric: tabular-nums` on every KPI value, percentage delta, axis tick, table cell, and date stamp.
- **Component Styling & Spatial Math**:
  - Collapsible left sidebar (`260px` expanded, `72px` collapsed with instant accessible tooltips, slide-out drawer on mobile) paired with a responsive `1440px` max-width workspace container.
  - Single-elevation card discipline (`p-5` to `p-6` outer padding, `gap-5` grid rhythm, `1px` luminous border transition on hover) with zero nested card-in-card clutter and unboxed typographic metadata (`MoSPI · Quarterly · Base 2011-12`).
- **Interactive Feedback & Motion**:
  - Subtle page transitions (`opacity` and `translateY(8px)` over `180ms` cubic-bezier settling curves).
  - Staggered KPI card entrance, smooth numeric value interpolation when switching timeframes or frequencies, and instant toast confirmation when exporting CSV files.
  - Full respect for `prefers-reduced-motion` across both UI transitions and the 3D hero canvas.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Indicator-Specific Semantic Directionality**
  - *Chosen Approach*: Each indicator defines its own `semanticPolarity` (`higher_is_favorable`, `lower_is_favorable`, or `neutral_policy`). For example, an increase in Real GDP Growth (`+7.2%`) renders as favorable emerald, whereas an increase in CPI Inflation above the RBI `4.0%` target band (`5.4%`) or higher Unemployment renders as cautionary amber/red.
  - *Why*: Naive dashboards color every `+` green and every `-` red, which is economically inaccurate for inflation, unemployment, crude import costs, and currency depreciation.
  - *Alternatives Considered*: Uniform green-up/red-down coloring, rejected because it misleads economic interpretation.

- **Decision 2: Unit-Compatibility Guards in the Economic Comparison Engine**
  - *Chosen Approach*: When comparing two indicators with different native units (e.g., *USD/INR in ₹* vs. *Brent Crude in USD/bbl*), the comparison engine automatically offers **Indexed Normalization (`Base 100 = Start of Period`)** or **Year-over-Year % Change**, and explains why plotting raw incompatible units on a single shared axis is statistically misleading.
  - *Why*: Directly fulfills the requirement to prevent misleading comparisons while educating users on proper macroeconomic normalization.
  - *Alternatives Considered*: Allowing unrestricted single-axis plotting of arbitrary units, rejected due to scale distortion.

- **Decision 3: Isolated, Software-WebGL-Safe Three.js Hero Globe with Static Fallback**
  - *Chosen Approach*: Build the 3D India Orbital Network Globe inside an isolated React `useRef` container with software-WebGL detection (`isSoftwareGl`), `RoomEnvironment` PBR reflections, pause-on-offscreen `IntersectionObserver`, and a toggleable/automatic SVG & CSS geometric fallback.
  - *Why*: Delivers a striking visual centerpiece on the Overview landing section without impacting chart scroll performance or failing on low-power devices.
  - *Alternatives Considered*: Putting 3D effects on every card or chart, rejected to preserve data legibility and 60fps responsiveness.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                         ARTHNITI APPLICATION SHELL                                │
│  ┌─────────────────────┐  ┌────────────────────────────────────────────────────┐  │
│  │ Collapsible Sidebar │  │ Top Navigation Bar                                 │  │
│  │ • Brand Mark        │  │ • Breadcrumb & Page Title   • Indicator Search     │  │
│  │ • 9 Route Links     │  │ • Illustrative Data Notice  • Theme Toggle (D/L)   │  │
│  │ • Animated Active   │  └────────────────────────────────────────────────────┘  │
│  │   Indicator         │  ┌────────────────────────────────────────────────────┐  │
│  │ • Mobile Drawer     │  │ Active Workspace Viewport (Motion Page Transition) │  │
│  └─────────────────────┘  │                                                    │  │
│                           │  ┌──────────────────────────────────────────────┐  │  │
│                           │  │ 1. Overview (Hero + 3D India Orbital Globe,  │  │  │
│                           │  │    6 KPI Cards, Economic Pulse, Relationship │  │  │
│                           │  │    Explorer, Latest Releases, Sources)       │  │  │
│                           │  ├──────────────────────────────────────────────┤  │  │
│                           │  │ 2. GDP & Growth (Quarterly/Annual, Real vs   │  │  │
│                           │  │    Nominal, Sectoral GVA Breakdown, Notes)   │  │  │
│                           │  ├──────────────────────────────────────────────┤  │  │
│                           │  │ 3. Inflation (Headline vs Core vs Food CPI,  │  │  │
│                           │  │    RBI 2–6% Tolerance Band, Price Level)     │  │  │
│                           │  ├──────────────────────────────────────────────┤  │  │
│                           │  │ 4. Labour Market (LFPR, WPR, Unemployment,   │  │  │
│                           │  │    Urban vs Rural PLFS Definitions)          │  │  │
│                           │  ├──────────────────────────────────────────────┤  │  │
│                           │  │ 5. Currency & Oil (USD/INR, Indian Basket    │  │  │
│                           │  │    Crude, Transmission Channels Diagram)     │  │  │
│                           │  ├──────────────────────────────────────────────┤  │  │
│                           │  │ 6. Financial Markets (NIFTY 50, SENSEX,      │  │  │
│                           │  │    10Y G-Sec Yield, Delayed Data Notice)     │  │  │
│                           │  ├──────────────────────────────────────────────┤  │  │
│                           │  │ 7. Economic Comparisons (Dual-Indicator      │  │  │
│                           │  │    Selector, Base-100 / % Change Normalizer) │  │  │
│                           │  ├──────────────────────────────────────────────┤  │  │
│                           │  │ 8. Data Sources & 9. About ArthNiti          │  │  │
│                           │  │    (Source Directory, Coverage, README Info) │  │  │
│                           │  └──────────────────────────────────────────────┘  │  │
│                           └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                CONFIGURABLE ECONOMIC DATA SERVICE LAYER                           │
│  • Environment Config: VITE_API_BASE_URL (FastAPI-ready HTTP client + fallback)   │
│  • 10-Year Illustrative Indian Macroeconomic Dataset (2016–2026, Qtr & Monthly)   │
│  • Normalization Utilities (Base-100 Indexing, YoY %, Pearson Correlation Calc)   │
│  • Client-Side CSV Generator & Downloader with Metadata Header                    │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State
- **Indicator Metadata (`EconomicIndicator`)**: `id`, `name`, `shortName`, `category` (`gdp`, `inflation`, `labour`, `currency_oil`, `markets`, `policy`), `unit` (`% YoY`, `₹ / USD`, `USD / bbl`, `Index`, `%`), `frequency` (`Quarterly`, `Monthly`), `semanticPolarity`, `targetBand` (e.g., RBI `4% ± 2%`), `sourceId`, `methodologySummary`, and `knownLimitations`.
- **Time-Series Observations (`ObservationPoint`)**: 10-year series (`2016`–`2026`) containing `date` (`YYYY-MM` or `YYYY-QN`), `value`, `previousValue`, `yoyChange`, and `status` (`Provisional`, `Revised`, `Final`).
- **Source Registry (`DataSourceMetadata`)**: Complete institutional directory covering **MoSPI (NSO)**, **Reserve Bank of India (RBI DBIE)**, **PPAC (Ministry of Petroleum & Natural Gas)**, **NSE / BSE India**, and **PLFS (Periodic Labour Force Survey)** with release cadence, base years, coverage dates, and links.

### Interactive Component & State Mapping
- **Reusable Chart Panel (`AnalyticalChartPanel`)**:
  - *State*: `dateRange` (`1Y` | `3Y` | `5Y` | `10Y` | `MAX`), `chartType` (`line` | `area` | `bar`), `isExpanded` (fullscreen modal toggle), `simulatedState` (`populated` | `loading` | `empty` | `error` for testing resilience), and `exportStatus` (`idle` | `exported`).
  - *Handlers*: Changing date range slices the 10-year series and recalculates period summary metrics (`High`, `Low`, `Mean`, `Net Change`); clicking `Export CSV` serializes the currently filtered series with source attribution and triggers a browser download; clicking `Expand` mounts a keyboard-accessible (`Escape` to close) fullscreen chart modal.
- **Economic Comparison & Relationship Explorer**:
  - *State*: `primaryIndicatorId`, `secondaryIndicatorId`, `comparisonMode` (`indexed_100` | `dual_axis` | `yoy_change` | `scatter`), and `periodRange`.
  - *Handlers*: Dynamically aligns timestamps across quarterly/monthly series, computes Base-100 normalized curves so incompatible units can be compared fairly, calculates the sample correlation coefficient ($r$) over the selected window, and displays an educational interpretation note.
- **Global Search & Filter Bar**:
  - *State*: `searchQuery`, `isSearchOpen`, `selectedResultIndex`.
  - *Handlers*: Filters indicators, pages, and data sources in real time with keyboard arrow navigation (`↑`/`↓`/`Enter`) to navigate directly to the selected indicator's view and highlight its chart.
