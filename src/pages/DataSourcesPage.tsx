import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  FileText,
  GraduationCap,
  Layers,
  Scale,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { DataSourceMetadata, PageId } from '../types/economy';
import { getStructuredIndicatorRegistrySync } from '../services/economyService';
import { ProvenanceAuditSection } from '../components/ProvenanceAuditSection';

export const ARTHNITI_METHODOLOGY_REVISION_DATE = '29 October 2026';

interface DataSourcesPageProps {
  sources: DataSourceMetadata[];
  theme: 'dark' | 'light';
  onSelectPage?: (pageId: PageId, indicatorId?: string) => void;
}

export const DataSourcesPage: React.FC<DataSourcesPageProps> = ({
  sources,
  theme,
  onSelectPage,
}) => {
  const [filterText, setFilterText] = useState<string>('');
  const indicatorRegistry = useMemo(() => getStructuredIndicatorRegistrySync(), []);

  const filteredSources = sources.filter(
    (s) =>
      s.name.toLowerCase().includes(filterText.toLowerCase()) ||
      s.shortName.toLowerCase().includes(filterText.toLowerCase()) ||
      s.primaryIndicators.some((ind) => ind.toLowerCase().includes(filterText.toLowerCase()))
  );

  const filteredRegistry = indicatorRegistry.filter((entry) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    return (
      entry.indicatorId.toLowerCase().includes(q) ||
      entry.displayName.toLowerCase().includes(q) ||
      entry.provider.toLowerCase().includes(q) ||
      entry.unit.toLowerCase().includes(q) ||
      entry.referencePeriod.toLowerCase().includes(q) ||
      entry.methodologicalNotes.toLowerCase().includes(q)
    );
  });

  const cardSurfaceClass =
    theme === 'dark'
      ? 'bg-[#0B1325] border-slate-800/90 text-slate-100'
      : 'bg-white border-slate-200 text-slate-900 shadow-xs';

  const subCardClass =
    theme === 'dark'
      ? 'bg-[#060B16]/90 border-slate-800/80 text-slate-200'
      : 'bg-slate-50 border-slate-200/90 text-slate-800';

  return (
    <div className="space-y-8">
      {/* Page Header & Visible Methodology Revision Date */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular text-emerald-400">
            <Database className="w-3.5 h-3.5" />
            <span>RESEARCH METHODOLOGY &amp; DATA GOVERNANCE</span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span className="text-amber-400">
              Methodology Revision Date: {ARTHNITI_METHODOLOGY_REVISION_DATE}
            </span>
          </div>
          <h1
            className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-slate-950'
            }`}
          >
            Methodology &amp; Official Data Sources
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            How ArthNiti collects, processes, verifies, and presents Indian and global macroeconomic indicators, financial market indices, policy developments, Quick Summaries, and Economists&apos; Latest Bites.
          </p>
        </div>

        {/* Search Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter sources or indicators..."
              aria-label="Filter data sources and methodology registry"
              className={`w-full pl-8 pr-3 py-2 text-xs rounded-lg border focus:outline-2 focus:outline-emerald-500 ${
                theme === 'dark'
                  ? 'bg-[#0B1325] border-slate-800 text-slate-100 placeholder:text-slate-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
            />
          </div>
          {onSelectPage && (
            <button
              type="button"
              onClick={() => onSelectPage('about')}
              className="px-3.5 py-2 rounded-lg border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              About ArthNiti →
            </button>
          )}
        </div>
      </div>

      {/* Quick In-Page Section Navigation */}
      <nav
        aria-label="Methodology subsections"
        className={`rounded-xl border p-3.5 flex flex-wrap items-center gap-2 text-xs font-mono-tabular ${cardSurfaceClass}`}
      >
        <span className="text-slate-400 mr-1">Jump to section:</span>
        <a
          href="#methodology-sources-provenance"
          className="px-2.5 py-1 rounded bg-slate-900/70 hover:bg-slate-800 text-emerald-400 border border-slate-800 transition-colors"
        >
          A. Sources &amp; Provenance
        </a>
        <a
          href="#methodology-collection-updates"
          className="px-2.5 py-1 rounded bg-slate-900/70 hover:bg-slate-800 text-emerald-400 border border-slate-800 transition-colors"
        >
          B. Collection &amp; Updates
        </a>
        <a
          href="#methodology-verification-qc"
          className="px-2.5 py-1 rounded bg-slate-900/70 hover:bg-slate-800 text-emerald-400 border border-slate-800 transition-colors"
        >
          C. Verification &amp; QC
        </a>
        <a
          href="#methodology-economic-analysis"
          className="px-2.5 py-1 rounded bg-slate-900/70 hover:bg-slate-800 text-emerald-400 border border-slate-800 transition-colors"
        >
          D. Economic Analysis
        </a>
        <a
          href="#methodology-quick-summary-bites"
          className="px-2.5 py-1 rounded bg-slate-900/70 hover:bg-slate-800 text-amber-400 border border-slate-800 transition-colors"
        >
          E. Quick Summary &amp; Latest Bites
        </a>
        <a
          href="#methodology-limitations-transparency"
          className="px-2.5 py-1 rounded bg-slate-900/70 hover:bg-slate-800 text-cyan-400 border border-slate-800 transition-colors"
        >
          F. Limitations &amp; Transparency
        </a>
        <a
          href="#indicator-provenance-registry"
          className="px-2.5 py-1 rounded bg-slate-900/70 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
        >
          Indicator Registry ({indicatorRegistry.length})
        </a>
      </nav>

      {/* Core 6-Part Research Methodology Framework (A through F) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A. Data Sources and Provenance */}
        <section
          id="methodology-sources-provenance"
          className={`rounded-xl border p-5 sm:p-6 space-y-3.5 scroll-mt-20 ${cardSurfaceClass}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-400">
              <Database className="w-4 h-4" />
              <span>SUBSECTION A</span>
            </div>
            <span className="text-[11px] font-mono-tabular text-slate-400">
              Authoritative Primary &amp; Institutional Sources
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold">A. Data Sources and Provenance</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            ArthNiti identifies the exact statistical body or data provider for every indicator displayed on the platform. Primary coverage prioritizes official Indian and international institutions:
          </p>
          <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <li>
              <strong className="text-white">Indian Statistical &amp; Regulatory Authorities:</strong> Ministry of Statistics and Programme Implementation (<a href="https://mospi.gov.in/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">MoSPI</a> &amp; National Statistical Office — NSO), Reserve Bank of India (<a href="https://www.rbi.org.in/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">RBI</a> &amp; <a href="https://dbie.rbihub.in/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">RBI DBIE</a>), Ministry of Commerce and Industry (<a href="https://commerce.gov.in/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">MoCI</a> / DGCI&amp;S / <a href="https://tradestat.commerce.gov.in/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">TRADESTAT</a>), Ministry of Finance (<a href="https://www.indiabudget.gov.in/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Union Budget &amp; Economic Survey</a>), Petroleum Planning &amp; Analysis Cell (<a href="https://ppac.gov.in/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">PPAC</a>), and Financial Benchmarks India Pvt. Ltd. (<a href="https://www.fbil.org.in/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">FBIL</a>).
            </li>
            <li>
              <strong className="text-white">International Institutions &amp; Research Bodies:</strong> International Monetary Fund (<a href="https://www.imf.org/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">IMF</a>), World Bank (<a href="https://www.worldbank.org/en/research" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">World Bank</a>), Bank for International Settlements (<a href="https://www.bis.org/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">BIS</a>), OECD (<a href="https://www.oecd.org/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">OECD</a>), US Federal Reserve, and European Central Bank (ECB).
            </li>
            <li>
              <strong className="text-white">Financial Market Indices:</strong> Indian benchmark equity indices (NIFTY 50, BSE SENSEX, BANK NIFTY, NIFTY IT, NIFTY MIDCAP 100) are retrieved via a server-side market-data proxy (<code className="font-mono-tabular">/api/market-indices</code>) referencing NSE/BSE public exchange feeds with explicit real-time vs. delayed dissemination notices.
            </li>
            <li>
              <strong className="text-white">Strict Connection Honesty:</strong> Every indicator displays its source name, original source URL, reference period, and publication timestamp. ArthNiti never claims a source is connected unless the implementation verifies that connection; unverified trade corridors are explicitly marked <code className="font-mono-tabular text-amber-400">Official Dataset Not Connected</code>.
            </li>
          </ul>
        </section>

        {/* B. Data Collection and Updates */}
        <section
          id="methodology-collection-updates"
          className={`rounded-xl border p-5 sm:p-6 space-y-3.5 scroll-mt-20 ${cardSurfaceClass}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-400">
              <Clock className="w-4 h-4" />
              <span>SUBSECTION B</span>
            </div>
            <span className="text-[11px] font-mono-tabular text-slate-400">
              Cadence, Refresh Schedules &amp; Timestamps
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold">B. Data Collection and Updates</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            ArthNiti uses a hybrid retrieval architecture tailored to the publication cadence of each dataset and never describes monthly or quarterly macroeconomic releases as &ldquo;real-time&rdquo; data:
          </p>
          <div className={`p-3.5 rounded-lg border text-xs space-y-2 ${subCardClass}`}>
            <div>
              <strong className="text-emerald-400">1. Quarterly, Monthly &amp; Daily Official Macro Series:</strong>
              <p className="text-slate-400 mt-0.5">
                Real GDP &amp; GVA (<strong>Quarterly</strong>), CPI Inflation, Monthly PLFS Unemployment, Merchandise Trade Balance, and Completed Monthly Indian Basket Crude Oil (<strong>Monthly</strong>), RBI Policy Repo Rate (<strong>Bi-monthly MPC cycle</strong>), and FBIL USD/INR Reference Rate (<strong>Daily business-day benchmark</strong>) are loaded from verified repository CSV files (<code className="font-mono-tabular">/public/data/*.csv</code>) and support zero-code browser CSV uploads.
              </p>
            </div>
            <div>
              <strong className="text-amber-400">2. Intraday Delayed Equity Indices &amp; Rolling News/Research Feeds:</strong>
              <p className="text-slate-400 mt-0.5">
                Indian stock indices (<code className="font-mono-tabular">/api/market-indices</code>) poll every <strong>30 seconds</strong> when NSE/BSE sessions are <code className="font-mono-tabular">OPEN</code> or <code className="font-mono-tabular">PRE_OPEN</code> (15s server cache TTL) and every <strong>5 minutes</strong> when <code className="font-mono-tabular">CLOSED</code>. Economic News (<code className="font-mono-tabular">/api/economic-news</code>) and Economists&apos; Latest Bites (<code className="font-mono-tabular">/api/economist-bites</code>) refresh every <strong>5 minutes</strong> (300s server cache TTL).
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            <strong className="text-slate-200">Publication Time vs. Fetch Time:</strong> Every view separates the time a dataset was last fetched or checked by ArthNiti (<code className="font-mono-tabular">fetchedAtIst</code> / <code className="font-mono-tabular">last_checked_at</code>) from the date the underlying institution published the observation (<code className="font-mono-tabular">releaseDate</code> / <code className="font-mono-tabular">published_at</code>). When an upstream feed is unreachable, explicit error, stale-cache (<code className="font-mono-tabular">STALE_FALLBACK</code>), or unavailable states are shown rather than silently presenting old figures as current.
          </p>
        </section>

        {/* C. Data Verification and Quality Control */}
        <section
          id="methodology-verification-qc"
          className={`rounded-xl border p-5 sm:p-6 space-y-3.5 scroll-mt-20 ${cardSurfaceClass}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>SUBSECTION C</span>
            </div>
            <span className="text-[11px] font-mono-tabular text-slate-400">
              Schema, Identity &amp; Integrity Checks
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold">
            C. Data Verification and Quality Control
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every dataset and API payload passes through automated validation gates before rendering in charts, KPI cards, or analytical tables:
          </p>
          <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Format, Unit &amp; Base-Year Preservation:</strong> Parsers enforce required CSV headers, reject <code className="font-mono-tabular">NaN</code>/<code className="font-mono-tabular">Infinity</code> values, and preserve official base years (MoSPI GDP Base <code className="font-mono-tabular">2022–23</code>; MoSPI CPI Base <code className="font-mono-tabular">2024=100</code>) and reporting scopes (e.g., separating Completed Monthly Average crude prices from Partial Month-to-Date averages).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Macroeconomic Accounting Identities:</strong> Merchandise trade series are programmatically checked against <code className="font-mono-tabular">Trade Balance = Exports − Imports</code> (e.g., Sep 2026: <code className="font-mono-tabular">$44.40B − $74.61B = -$30.21B</code>; H1 FY27 cumulative: <code className="font-mono-tabular">$259.89B − $437.53B = -$177.64B</code>), keeping monthly figures strictly separate from cumulative fiscal-year totals.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Timestamp &amp; Feed Sanity Checks:</strong> Market index validators reject zero or negative index levels, verify currency (<code className="font-mono-tabular">INR</code>), and cross-check point and percentage changes. RSS/JSON parsers normalize timezone-less Indian institutional dates to IST (<code className="font-mono-tabular">+05:30</code>) and reject implausible future timestamps.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Explicit Labelling of Derived or Unverified Series:</strong> Where an analytical series is derived (such as Core CPI ex-Food &amp; Fuel) or where a bilateral corridor is illustrative, ArthNiti labels it explicitly and never fabricates citations, verification results, or API responses.
              </span>
            </li>
          </ul>
        </section>

        {/* D. Economic Analysis */}
        <section
          id="methodology-economic-analysis"
          className={`rounded-xl border p-5 sm:p-6 space-y-3.5 scroll-mt-20 ${cardSurfaceClass}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-400">
              <Layers className="w-4 h-4" />
              <span>SUBSECTION D</span>
            </div>
            <span className="text-[11px] font-mono-tabular text-slate-400">
              Domain Coverage &amp; Analytical Rigour
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold">D. Economic Analysis</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            ArthNiti structures indicators and policy developments so readers can examine each macroeconomic domain and its cross-market transmission:
          </p>
          <div className={`p-3.5 rounded-lg border text-xs grid grid-cols-1 sm:grid-cols-2 gap-2.5 ${subCardClass}`}>
            <div>
              <strong className="text-white">1. Inflation &amp; Consumer Prices:</strong>
              <p className="text-slate-400">All-India Combined CPI, Food &amp; Beverages (CFPI), Core CPI, and alignment with the RBI&apos;s 4.0% ± 2.0% target band.</p>
            </div>
            <div>
              <strong className="text-white">2. GDP Growth &amp; Output:</strong>
              <p className="text-slate-400">Quarterly Real vs. Nominal GDP growth, constant-price output levels, implicit GDP deflator wedge, and sectoral GVA shares.</p>
            </div>
            <div>
              <strong className="text-white">3. Monetary Policy &amp; RBI Repo:</strong>
              <p className="text-slate-400">MPC policy repo rate decisions, SDF/MSF standing facilities corridor, liquidity transmission, and sovereign bond yields.</p>
            </div>
            <div>
              <strong className="text-white">4. Employment &amp; Labour Force:</strong>
              <p className="text-slate-400">MoSPI PLFS Current Weekly Status (Age 15+) unemployment rate, LFPR, and WPR across rural and urban cohorts.</p>
            </div>
            <div>
              <strong className="text-white">5. Exchange Rates, Crude &amp; Trade:</strong>
              <p className="text-slate-400">FBIL USD/INR reference rates, PPAC Indian Basket crude oil import costs, and MoCI merchandise trade balances.</p>
            </div>
            <div>
              <strong className="text-white">6. Indian &amp; Global Markets:</strong>
              <p className="text-slate-400">Indian benchmark indices (NIFTY 50, SENSEX, BANK NIFTY, NIFTY IT, MIDCAP 100) alongside global market &amp; technology benchmarks (including Nasdaq and US Treasury yields where relevant to Indian IT exports and FPI flows).</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            <strong className="text-slate-200">Facts vs. Interpretation &amp; Correlation vs. Causation:</strong> ArthNiti strictly separates <em>observed statistical data</em>, <em>reported news facts</em>, <em>analytical interpretations</em>, and <em>institutional forecasts</em>. In the Dual-Indicator Comparison Engine, Pearson correlation coefficients (<code className="font-mono-tabular">r</code>) and Z-score normalizations are accompanied by explicit reminders that <strong>economic relationships are contextual and correlation alone does not establish causation</strong>.
          </p>
        </section>

        {/* E. Quick Summary and Latest Bites */}
        <section
          id="methodology-quick-summary-bites"
          className={`rounded-xl border p-5 sm:p-6 space-y-3.5 scroll-mt-20 ${cardSurfaceClass}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono-tabular text-amber-400">
              <GraduationCap className="w-4 h-4" />
              <span>SUBSECTION E</span>
            </div>
            <span className="text-[11px] font-mono-tabular text-slate-400">
              Attribution &amp; Non-Fabrication Standards
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold">
            E. Quick Summary and Latest Bites
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            <strong>Quick Summary</strong> blocks across ArthNiti provide concise overviews of macroeconomic releases and news developments, while <strong>Economists&apos; Latest Bites</strong> curates and discovers recent commentary, working papers, speeches, and publications from prominent Indian and global economists.
          </p>
          <div className={`p-3.5 rounded-lg border text-xs space-y-2 ${subCardClass}`}>
            <div className="font-semibold text-amber-400">
              Mandatory 6-Element Attribution Contract for Every Latest Bites Entry:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>
                <strong className="text-white">Economist or Author&apos;s Name:</strong> Verified current designation and institutional affiliation, with historical public-policy roles clearly distinguished.
              </li>
              <li>
                <strong className="text-white">Original Publication or Statement Title:</strong> Clear, non-sensational headline reflecting the central economic thesis.
              </li>
              <li>
                <strong className="text-white">Publication Date:</strong> Original publication date (<code className="font-mono-tabular">published_at</code>), kept distinct from discovery and verification timestamps.
              </li>
              <li>
                <strong className="text-white">Original Source &amp; Working Link:</strong> Direct canonical HTTPS link (<code className="font-mono-tabular">Read Original Source ↗</code>) to the specific paper, speech, or article—never a generic homepage.
              </li>
              <li>
                <strong className="text-white">Concise, Faithful Quick Summary:</strong> Structured into <em>The Big Point</em>, <em>Why It Matters</em>, and a 5–12 word <em>Key Takeaway</em>.
              </li>
              <li>
                <strong className="text-white">Topic &amp; Geographic Category:</strong> Classified by macroeconomic topic and tagged as <code className="font-mono-tabular">INDIA</code> or <code className="font-mono-tabular">GLOBAL</code>.
              </li>
            </ol>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            ArthNiti prioritizes original working papers, central bank speeches, multilateral outlooks, and reputable economic publications. Every card clearly distinguishes what the economist argued from what the source reports and ArthNiti&apos;s own macroeconomic context, and <strong>never invents verbatim quotations or attributes opinions without source evidence</strong>.
          </p>
          {onSelectPage && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => onSelectPage('economist-bites')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                <span>Open Economists&apos; Latest Bites Module</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </section>

        {/* F. Limitations and Transparency */}
        <section
          id="methodology-limitations-transparency"
          className={`rounded-xl border p-5 sm:p-6 space-y-3.5 scroll-mt-20 ${cardSurfaceClass}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono-tabular text-cyan-400">
              <Scale className="w-4 h-4" />
              <span>SUBSECTION F</span>
            </div>
            <span className="text-[11px] font-mono-tabular text-slate-400">
              Disclosures &amp; Educational Scope
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold">
            F. Limitations and Transparency
          </h2>
          <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Source Availability &amp; Cadence Differences:</strong> Data availability, base years, and publication lags vary across statistical agencies (e.g., CPI and PLFS are released monthly with a ~12–15 day lag, whereas National Accounts GDP estimates are released quarterly with a ~60 day lag).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Market Data Delays &amp; Provider Constraints:</strong> Equity index values retrieved via public exchange feeds may carry a 1–5 minute dissemination delay and are subject to upstream rate limits and exchange trading hours.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Preliminary Estimates &amp; Statistical Revisions:</strong> Macroeconomic releases initially published as Provisional or First Advance Estimates are routinely revised by MoSPI, RBI, and DGCI&amp;S in subsequent release calendars as fuller tax, corporate, and customs filings are incorporated.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Informational &amp; Educational Charter:</strong> ArthNiti is an informational and educational economic intelligence platform. It is not a substitute for original government statistical gazettes or professional financial, investment, tax, or legal advice.
              </span>
            </li>
          </ul>
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-tabular text-slate-400">
            <span>Last Methodology Update: {ARTHNITI_METHODOLOGY_REVISION_DATE}</span>
            <span>Verification Standard: Source-Backed · Zero Fabricated Claims</span>
          </div>
        </section>
      </div>

      {/* Provenance Disclosure Banner */}
      <div
        className={`rounded-xl border p-5 ${
          theme === 'dark'
            ? 'bg-emerald-950/15 border-emerald-500/30 text-slate-200'
            : 'bg-emerald-50 border-emerald-200 text-slate-800'
        }`}
      >
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-2 text-xs leading-relaxed">
            <div className="font-semibold text-sm text-emerald-400">
              Data Provenance Summary — 7 Official Macro Datasets + 3 Live Server Intelligence Endpoints
            </div>
            <p>
              <strong>Real GDP Growth (MoSPI Base 2022–23: 7.8% YoY / ₹81.36 Lakh Cr in Q1 FY27)</strong>, <strong>All-India Combined CPI Inflation (MoSPI Base 2024 = 100: 5.54% YoY in Sep 2026)</strong>, <strong>All-India Unemployment Rate (MoSPI Monthly PLFS, CWS Age 15+: 5.0% in Sep 2026)</strong>, <strong>India Merchandise Trade Balance (MoCI / DGCI&amp;S &amp; RBI DBIE: Exports $44.40B − Imports $74.61B = -$30.21B Signed Balance / $30.21B Deficit in Sep 2026; H1 FY27 Cumulative Exports $259.89B − Imports $437.53B = -$177.64B)</strong>, <strong>USD/INR Official Reference Rate (FBIL / RBI DBIE: ₹94.6986 per 1 USD on 22 Oct 2026)</strong>, <strong>Indian Basket Crude Oil Price (PPAC: $116.09/bbl Sep 2026 Completed Monthly Avg; $120.08/bbl Oct 2026 Partial MTD; $119.99/bbl Daily on 22 Oct 2026)</strong>, and the <strong>RBI Policy Repo Rate (Official MPC: 5.50% effective 07 Oct 2026)</strong> are loaded from verified repository CSV datasets (<code className="font-mono-tabular">/public/data/*.csv</code>) with zero-code browser CSV updaters.
            </p>
            <p className="text-slate-400">
              <strong>Live Server Endpoints:</strong> <strong>Live Indian Market Indices</strong> (<code className="font-mono-tabular">/api/market-indices</code>, 15s server cache TTL), <strong>Economic News &amp; Current Affairs</strong> (<code className="font-mono-tabular">/api/economic-news</code>, 300s server cache TTL), and <strong>Economists&apos; Latest Bites</strong> (<code className="font-mono-tabular">/api/economist-bites</code>, 300s server cache TTL) perform server-side HTTP aggregation with per-instance memory caching, force-refresh cooldowns, SSRF/XSS sanitization, and explicit stale-cache fallback labelling.
            </p>
          </div>
        </div>
      </div>

      {/* Structured Indicator Source Registry Table (Academic & Departmental Audit View) */}
      <div id="indicator-provenance-registry" className="scroll-mt-20">
        <ProvenanceAuditSection
          filteredRegistry={filteredRegistry}
          totalCount={indicatorRegistry.length}
          theme={theme}
        />
      </div>

      {/* Source Cards Directory */}
      {filteredSources.length === 0 ? (
        <div
          className={`rounded-xl border p-8 text-center space-y-3 ${
            theme === 'dark'
              ? 'bg-[#0B1325] border-slate-800 text-slate-300'
              : 'bg-white border-slate-200 text-slate-700'
          }`}
        >
          <div className="text-sm font-semibold">
            No Data Sources Matching &ldquo;{filterText}&rdquo;
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try searching for MoSPI, MoCI, TRADESTAT, RBI, PLFS, PPAC, NSE, GDP, or CPI.
          </p>
          <button
            type="button"
            onClick={() => setFilterText('')}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredSources.map((src) => (
            <article
              key={src.id}
              className={`rounded-xl border p-5 sm:p-6 transition-colors ${cardSurfaceClass}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-800/60">
                <div>
                  <div className="flex items-center gap-2 text-xs text-emerald-500 font-mono-tabular">
                    <span>{src.shortName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{src.ministryOrBody}</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold mt-0.5">{src.name}</h2>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <a
                    href={src.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-amber-500 hover:text-amber-400"
                  >
                    <span>{src.officialUrl}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  {src.secondaryUrl && (
                    <a
                      href={src.secondaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-emerald-500 hover:text-emerald-400"
                    >
                      <span>
                        {src.id === 'rbi-dbie'
                          ? 'RBI DBIE Portal'
                          : src.id === 'moci-tradestat'
                          ? 'TRADESTAT Portal'
                          : src.id === 'ppac-mopng'
                          ? 'PPAC Main Portal'
                          : 'eSankhyiki Catalogue'}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {src.id === 'moci-tradestat' && (
                    <a
                      href="https://dbie.rbihub.in/external?table=external_sector.r18_foreign_trade"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-cyan-400 hover:text-cyan-300"
                    >
                      <span>RBI DBIE Foreign Trade (Table r18)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {src.id === 'mospi-nso' && (
                    <a
                      href="https://mospi.gov.in/faq"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-cyan-400 hover:text-cyan-300"
                    >
                      <span>MoSPI Methodology FAQ</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {src.id === 'rbi-dbie' && (
                    <>
                      <a
                        href="https://www.fbil.org.in/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-emerald-400 hover:text-emerald-300"
                      >
                        <span>FBIL Official (fbil.org.in)</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href="https://www.rbi.org.in/Scripts/MPView.aspx"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-cyan-400 hover:text-cyan-300"
                      >
                        <span>RBI MPC Statements</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </>
                  )}
                  {src.id === 'plfs-mospi' && (
                    <a
                      href="https://mospi.gov.in/latest-releases"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-cyan-400 hover:text-cyan-300"
                    >
                      <span>MoSPI Latest Releases</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 text-xs">
                <div
                  className={`p-3 rounded-lg border ${
                    theme === 'dark' ? 'bg-[#060B16] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="text-slate-400 text-[11px]">Units &amp; Base Year</div>
                  <div className="font-mono-tabular font-medium mt-1">{src.unitsAndBaseYear}</div>
                </div>

                <div
                  className={`p-3 rounded-lg border ${
                    theme === 'dark' ? 'bg-[#060B16] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="text-slate-400 text-[11px]">Reporting Frequency &amp; Lag</div>
                  <div className="font-mono-tabular font-medium mt-1">
                    {src.frequency} ({src.dataFreshnessLag})
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg border ${
                    theme === 'dark' ? 'bg-[#060B16] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-cyan-500" />
                    <span>Coverage Window</span>
                  </div>
                  <div className="font-mono-tabular font-medium text-cyan-500 mt-1">
                    {src.coverageDates}
                  </div>
                </div>
              </div>

              {/* Methodology & Indicators */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs pt-2">
                <div className="lg:col-span-7 space-y-2">
                  <div className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                    Methodology &amp; Compilation
                  </div>
                  <p className="text-slate-400 leading-relaxed">{src.methodologySummary}</p>

                  <div className="pt-2">
                    <span className="text-slate-400">Primary Indicators Covered: </span>
                    <span className="font-mono-tabular text-emerald-500">
                      {src.primaryIndicators.join(' · ')}
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-2">
                  <div className="font-semibold text-amber-500 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Known Statistical Limitations</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-400 leading-relaxed">
                    {src.knownLimitations.map((lim, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span>{lim}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
