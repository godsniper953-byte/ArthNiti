import React, { Suspense, useRef } from 'react';
import { motion } from 'motion/react';
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  Calendar,
  Compass,
  Database,
  FileSpreadsheet,
  Info,
  Layers,
} from 'lucide-react';
import {
  DataSourceMetadata,
  EconomicIndicator,
  LatestDataRelease,
  PageId,
} from '../types/economy';
import { KpiCard } from '../components/cards/KpiCard';
import { AnalyticalChartPanel } from '../components/charts/AnalyticalChartPanel';
import { RelationshipExplorer } from '../components/dashboard/RelationshipExplorer';

const LazyIndiaEconomicGlobe = React.lazy(() =>
  import('../components/visualizations/IndiaEconomicGlobe').then((m) => ({
    default: m.IndiaEconomicGlobe,
  }))
);

interface OverviewPageProps {
  indicators: EconomicIndicator[];
  latestReleases: LatestDataRelease[];
  sources: DataSourceMetadata[];
  onSelectPage: (pageId: PageId, indicatorId?: string) => void;
  theme: 'dark' | 'light';
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  indicators,
  latestReleases,
  sources,
  onSelectPage,
  theme,
}) => {
  const kpiSectionRef = useRef<HTMLDivElement | null>(null);

  // Core 6 KPI indicators requested in master prompt
  const kpiIndicators = indicators.filter((ind) =>
    [
      'gdp-growth',
      'cpi-inflation',
      'unemployment-rate',
      'usd-inr',
      'crude-oil',
      'rbi-repo-rate',
    ].includes(ind.id)
  );

  const gdpIndicator = indicators.find((i) => i.id === 'gdp-growth') || indicators[0];
  const cpiIndicator = indicators.find((i) => i.id === 'cpi-inflation') || indicators[1];

  const handleScrollToKpis = () => {
    kpiSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-8">
      {/* 1. Immersive Hero Section */}
      <section
        className={`rounded-2xl border p-6 sm:p-8 lg:p-10 relative overflow-hidden ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-[#0B1325] via-[#080F1E] to-[#060B16] border-slate-800/90'
            : 'bg-gradient-to-br from-white via-slate-50 to-emerald-50/30 border-slate-200 shadow-xs'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Editorial Narrative & Primary Actions */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Compact Data Freshness & Illustrative Disclosure */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono-tabular">
                <span className="text-emerald-400 font-semibold tracking-wide">
                  ARTHNITI — INDIAN ECONOMIC INTELLIGENCE
                </span>
                <span aria-hidden="true">·</span>
                <span>10Y Series (2016–2026)</span>
                <span aria-hidden="true">·</span>
                <span>Illustrative Dev Dataset</span>
              </div>

              {/* Large ARTHNITI Wordmark & Tagline */}
              <div>
                <div className="text-xs font-mono-tabular text-amber-400 mb-1">
                  Understand the Economy. Discover the Data.
                </div>
                <h1
                  className={`font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight leading-[1.12] text-balance ${
                    theme === 'dark' ? 'text-white' : 'text-slate-950'
                  }`}
                >
                  See the Forces Shaping India&apos;s Economy.
                </h1>
              </div>

              <p
                className={`text-sm sm:text-base leading-relaxed max-w-xl ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                Explore 10 years of Indian macroeconomic architecture—spanning National Accounts GDP, CPI inflation dynamics, PLFS labour participation, Rupee exchange corridors, and RBI monetary policy transmission—with transparent source attribution.
              </p>
            </div>

            {/* Hero Action Buttons + Key Telemetry Strip */}
            <div className="space-y-6 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleScrollToKpis}
                  className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Explore the Economy</span>
                  <ArrowDown className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onSelectPage('data-sources')}
                  className={`px-5 py-2.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                    theme === 'dark'
                      ? 'bg-[#060B16]/80 border-slate-700 text-slate-200 hover:border-emerald-500/50 hover:text-white'
                      : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>View Methodology</span>
                </button>
              </div>

              {/* Data Freshness & Coverage Summary */}
              <div
                className={`pt-4 border-t grid grid-cols-3 gap-4 text-xs ${
                  theme === 'dark' ? 'border-slate-800/80' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="text-slate-400 text-[11px]">Primary Sources</div>
                  <div className="font-mono-tabular font-semibold mt-0.5">
                    MoSPI · RBI · PPAC
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Historical Horizon</div>
                  <div className="font-mono-tabular font-semibold mt-0.5">
                    2016 – Q3 2026 (10Y)
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Data Freshness</div>
                  <div className="font-mono-tabular font-semibold text-emerald-400 mt-0.5">
                    Oct 2026 Release Cycle
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive 3D India Orbital Network Visualization */}
          <div className="lg:col-span-6">
            <Suspense
              fallback={
                <div className="w-full h-[430px] sm:h-[460px] rounded-xl border border-slate-800 bg-[#070E1E] flex flex-col items-center justify-center p-6 text-center">
                  <Compass className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
                  <p className="text-xs text-slate-300 font-mono-tabular">
                    Initializing 3D India Economic Network Model...
                  </p>
                </div>
              }
            >
              <LazyIndiaEconomicGlobe theme={theme} />
            </Suspense>
          </div>
        </div>
      </section>

      {/* 2. Headline KPI Cards Section */}
      <section ref={kpiSectionRef} className="space-y-4 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-xs font-mono-tabular text-emerald-400">
              01. Key Macroeconomic Indicators
            </div>
            <h2
              className={`font-display text-xl sm:text-2xl font-semibold tracking-tight mt-0.5 ${
                theme === 'dark' ? 'text-white' : 'text-slate-950'
              }`}
            >
              Headline Indian Economic Pulse
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Select any card to inspect full 10-year series, methodology, and CSV downloads.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {kpiIndicators.map((ind, idx) => (
            <motion.div
              key={ind.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: idx * 0.04 }}
            >
              <KpiCard indicator={ind} onSelectPage={onSelectPage} theme={theme} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. Economic Pulse — Data Storytelling Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-xs font-mono-tabular text-amber-400">
              02. Economic Pulse & Structural Storytelling
            </div>
            <h2
              className={`font-display text-xl sm:text-2xl font-semibold tracking-tight mt-0.5 ${
                theme === 'dark' ? 'text-white' : 'text-slate-950'
              }`}
            >
              Growth Resilience Amid Disinflation
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onSelectPage('gdp-growth')}
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Open National Accounts Deep Dive</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Historical Trend Chart (8 cols) */}
          <div className="lg:col-span-8">
            <AnalyticalChartPanel
              title="India Real vs. Nominal GDP Growth Trajectory (2017–2026)"
              subtitle="Quarterly year-over-year percentage change at constant (2011–12) and current market prices"
              unit="% YoY"
              sourceLabel="MoSPI (NSO)"
              frequencyLabel="Quarterly"
              observations={gdpIndicator.observations}
              seriesConfig={[
                { key: 'value', name: 'Real GDP Growth (Constant 2011–12)', color: '#10b981' },
                { key: 'secondaryValue', name: 'Nominal GDP Growth (Current Prices)', color: '#f59e0b' },
              ]}
              defaultChartType="area"
              defaultRange="10Y"
              zeroReferenceLine
              theme={theme}
            />
          </div>

          {/* Editorial Interpretation & Coverage Panel (4 cols) */}
          <div
            className={`lg:col-span-4 rounded-xl border p-5 sm:p-6 flex flex-col justify-between ${
              theme === 'dark'
                ? 'bg-[#0B1325] border-slate-800/90 text-slate-200'
                : 'bg-white border-slate-200 text-slate-800 shadow-xs'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-mono-tabular">
                <Layers className="w-4 h-4" />
                <span>Macroeconomic Synthesis</span>
              </div>

              <h3 className="text-base font-semibold tracking-tight">
                Observed Structural Shifts (2017–2026)
              </h3>

              <div className="space-y-3 text-xs leading-relaxed text-slate-400">
                <p>
                  <strong className={theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}>
                    1. Post-Pandemic Normalization:
                  </strong>{' '}
                  Following the sharp Q2 2020 lockdown contraction (-23.4% YoY) and subsequent base-effect rebound (+21.6% in Q2 2021), India&apos;s real output stabilized along a 6.5%–7.2% expansion corridor.
                </p>
                <p>
                  <strong className={theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}>
                    2. Narrowing Deflator Wedge:
                  </strong>{' '}
                  The spread between Nominal GDP (10.6%) and Real GDP (7.1%) reflects an implicit GDP deflator of ~3.5%, signaling moderating wholesale and input cost pressures compared to 2022.
                </p>
                <p>
                  <strong className={theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}>
                    3. Monetary-Inflation Alignment:
                  </strong>{' '}
                  With Headline CPI at {cpiIndicator.currentValue}% YoY—inside the RBI&apos;s 2%–6% mandate—the policy repo rate at 5.75% maintains positive real interest rates of ~1.34%.
                </p>
              </div>
            </div>

            {/* Source & Coverage Attribution Box */}
            <div
              className={`mt-6 pt-4 border-t space-y-2.5 text-xs ${
                theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Statistical Authority:</span>
                <span className="font-mono-tabular font-medium">NSO · MoSPI & RBI DBIE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Base Year Benchmark:</span>
                <span className="font-mono-tabular">GDP: 2011–12 | CPI: 2012=100</span>
              </div>
              <button
                type="button"
                onClick={() => onSelectPage('data-sources')}
                className="w-full mt-2 py-2 px-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Inspect Full Methodology & Coverage</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Visual Indicator Relationship Explorer */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-xs font-mono-tabular text-cyan-400">
              03. Interactive Indicator Relationship Explorer
            </div>
            <h2
              className={`font-display text-xl sm:text-2xl font-semibold tracking-tight mt-0.5 ${
                theme === 'dark' ? 'text-white' : 'text-slate-950'
              }`}
            >
              Cross-Indicator Co-Movement & Normalization
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onSelectPage('comparisons')}
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Open Full Comparison Workbench</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <RelationshipExplorer
          indicators={indicators}
          defaultIndicatorAId="cpi-inflation"
          defaultIndicatorBId="rbi-repo-rate"
          theme={theme}
          onSelectPage={onSelectPage}
        />
      </section>

      {/* 5. Latest Data Updates & Source Transparency Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Latest Data Releases Table (7 cols) */}
        <div
          className={`lg:col-span-7 rounded-xl border p-5 sm:p-6 ${
            theme === 'dark'
              ? 'bg-[#0B1325] border-slate-800/90 text-slate-100'
              : 'bg-white border-slate-200 text-slate-900 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Release Calendar Log</span>
              </div>
              <h3 className="text-base font-semibold mt-0.5">Latest Macroeconomic Releases</h3>
            </div>
            <span className="text-xs font-mono-tabular text-slate-400">Illustrative Cycle</span>
          </div>

          <div className="divide-y divide-slate-800/60 mt-2">
            {latestReleases.map((rel) => (
              <div
                key={rel.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => onSelectPage(rel.pageId, rel.indicatorId)}
                      className="font-semibold hover:text-emerald-400 transition-colors cursor-pointer text-left"
                    >
                      {rel.indicatorName}
                    </button>
                    <span className="text-slate-500" aria-hidden="true">·</span>
                    <span className="text-slate-400 font-mono-tabular">{rel.period}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{rel.summaryNote}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0 font-mono-tabular text-xs">
                  <div className="text-right">
                    <div className="text-emerald-400 font-semibold">{rel.actualValue}</div>
                    <div className="text-[10px] text-slate-400">Prev: {rel.previousValue}</div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-slate-300">{rel.releaseDate}</div>
                    <div className="text-[10px] text-slate-400">{rel.source}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Source Transparency & Architecture Readiness Card (5 cols) */}
        <div
          className={`lg:col-span-5 rounded-xl border p-5 sm:p-6 flex flex-col justify-between ${
            theme === 'dark'
              ? 'bg-[#0B1325] border-slate-800/90 text-slate-100'
              : 'bg-white border-slate-200 text-slate-900 shadow-xs'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Source Attribution & Data Governance</span>
            </div>
            <h3 className="text-base font-semibold">Institutional Data Provenance</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every series in ArthNiti is structured around official Indian statistical definitions, units, and base years. No synthetic analyst forecasts or unverified news feeds are mixed into indicator series.
            </p>

            <div className="space-y-2.5 pt-1">
              {sources.slice(0, 4).map((src) => (
                <div
                  key={src.id}
                  className={`p-3 rounded-lg border text-xs ${
                    theme === 'dark'
                      ? 'bg-[#060B16]/70 border-slate-800/80'
                      : 'bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-emerald-400">{src.shortName}</span>
                    <span className="font-mono-tabular text-[11px] text-slate-400">
                      {src.coverageDates}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {src.unitsAndBaseYear}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>5 Institutional Repositories Documented</span>
            </span>
            <button
              type="button"
              onClick={() => onSelectPage('data-sources')}
              className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
            >
              Source Directory →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
