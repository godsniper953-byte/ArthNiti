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
import { LiveIndianMarketsSection } from '../components/visualizations/LiveIndianMarketsSection';
import { IndianMarketIndicesResponse } from '../services/indianMarketService';
import { EconomicNewsSection } from '../components/news/EconomicNewsSection';
import { EconomicNewsResponse } from '../services/economicNewsService';
import { EconomistBitesSection } from '../components/bites/EconomistBitesSection';
import { EconomistBitesResponse } from '../services/economistBitesService';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

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
  cpiLoading?: boolean;
  cpiError?: string | null;
  onRetryCpi?: () => void;
  gdpLoading?: boolean;
  gdpError?: string | null;
  onRetryGdp?: () => void;
  repoLoading?: boolean;
  repoError?: string | null;
  onRetryRepo?: () => void;
  plfsLoading?: boolean;
  plfsError?: string | null;
  onRetryPlfs?: () => void;
  usdInrLoading?: boolean;
  usdInrError?: string | null;
  onRetryUsdInr?: () => void;
  crudeLoading?: boolean;
  crudeError?: string | null;
  onRetryCrude?: () => void;
  tradeLoading?: boolean;
  tradeError?: string | null;
  onRetryTrade?: () => void;
  marketData?: IndianMarketIndicesResponse | null;
  marketLoading?: boolean;
  marketError?: string | null;
  marketStaleCache?: boolean;
  marketAutoRefresh?: boolean;
  onToggleMarketAutoRefresh?: () => void;
  onRefreshMarketNow?: () => void;
  onSimulateMarketError?: (simulate: boolean) => void;
  simulatedUnavailableIndexId?: string | null;
  onSimulateSingleIndexUnavailable?: (indexId: string | null) => void;
  selectedMarketIndexId?: string;
  onSelectMarketIndexId?: (indexId: string) => void;
  newsData?: EconomicNewsResponse | null;
  newsLoading?: boolean;
  newsError?: string | null;
  newsStaleCache?: boolean;
  newsAutoRefresh?: boolean;
  onToggleNewsAutoRefresh?: () => void;
  onRefreshNewsNow?: () => void;
  onSimulateNewsError?: (simulate: boolean) => void;
  bitesData?: EconomistBitesResponse | null;
  bitesLoading?: boolean;
  bitesError?: string | null;
  bitesStaleCache?: boolean;
  bitesAutoRefresh?: boolean;
  onToggleBitesAutoRefresh?: () => void;
  onRefreshBitesNow?: (force?: boolean) => void;
  onSimulateBitesError?: (simulate: boolean) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  indicators,
  latestReleases,
  sources,
  onSelectPage,
  theme,
  cpiLoading = false,
  cpiError = null,
  onRetryCpi,
  gdpLoading = false,
  gdpError = null,
  onRetryGdp,
  repoLoading = false,
  repoError = null,
  onRetryRepo,
  plfsLoading = false,
  plfsError = null,
  onRetryPlfs,
  usdInrLoading = false,
  usdInrError = null,
  onRetryUsdInr,
  crudeLoading = false,
  crudeError = null,
  onRetryCrude,
  tradeLoading = false,
  tradeError = null,
  onRetryTrade,
  marketData = null,
  marketLoading = false,
  marketError = null,
  marketStaleCache = false,
  marketAutoRefresh = true,
  onToggleMarketAutoRefresh = () => {},
  onRefreshMarketNow = () => {},
  onSimulateMarketError = () => {},
  simulatedUnavailableIndexId = null,
  onSimulateSingleIndexUnavailable = () => {},
  selectedMarketIndexId = 'nifty-50',
  onSelectMarketIndexId = () => {},
  newsData = null,
  newsLoading = false,
  newsError = null,
  newsStaleCache = false,
  newsAutoRefresh = true,
  onToggleNewsAutoRefresh = () => {},
  onRefreshNewsNow = () => {},
  onSimulateNewsError = () => {},
  bitesData = null,
  bitesLoading = false,
  bitesError = null,
  bitesStaleCache = false,
  bitesAutoRefresh = true,
  onToggleBitesAutoRefresh = () => {},
  onRefreshBitesNow = () => {},
  onSimulateBitesError = () => {},
}) => {
  const kpiSectionRef = useRef<HTMLDivElement | null>(null);

  // Core 7 Official Macroeconomic KPI indicators
  const kpiIndicators = indicators.filter((ind) =>
    [
      'gdp-growth',
      'cpi-inflation',
      'unemployment-rate',
      'usd-inr',
      'crude-oil',
      'merchandise-trade',
      'rbi-repo-rate',
    ].includes(ind.id)
  );

  const gdpIndicator = indicators.find((i) => i.id === 'gdp-growth') || indicators[0];
  const cpiIndicator = indicators.find((i) => i.id === 'cpi-inflation') || indicators[1];
  const tradeIndicator = indicators.find((i) => i.id === 'merchandise-trade');

  const globeSectionRef = useRef<HTMLDivElement | null>(null);

  const handleScrollToKpis = () => {
    kpiSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleScrollToGlobe = () => {
    globeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-8">
      {/* 1. Immersive Hero Header & Full-Width Interactive 3D Global Trade Network */}
      <section
        className={`rounded-2xl border p-6 sm:p-8 lg:p-10 relative overflow-hidden space-y-8 ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-[#0B1325] via-[#080F1E] to-[#060B16] border-slate-800/90'
            : 'bg-gradient-to-br from-white via-slate-50 to-emerald-50/30 border-slate-200 shadow-xs'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          {/* Left 8 Columns: Editorial Narrative */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono-tabular">
              <span className="text-emerald-400 font-semibold tracking-wide">
                ARTHNITI — INDIAN ECONOMIC INTELLIGENCE
              </span>
              <span aria-hidden="true">·</span>
              <span>7 Official Indicators: MoSPI · RBI · FBIL · PPAC · MoCI</span>
            </div>

            <div>
              <div className="text-xs font-mono-tabular text-amber-400 mb-1">
                Understand the Economy. Discover the Data.
              </div>
              <h1
                className={`font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight leading-[1.12] text-balance ${
                  theme === 'dark' ? 'text-white' : 'text-slate-950'
                }`}
              >
                See the Forces Shaping India&apos;s Economy &amp; Global Trade.
              </h1>
            </div>

            <p
              className={`text-sm sm:text-base leading-relaxed max-w-3xl ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Explore 10 years of Indian macroeconomic architecture—featuring an interactive 3D Global Trade Network (Department of Commerce · TRADESTAT), official MoSPI GDP &amp; CPI inflation, PLFS labour participation, MoCI Merchandise Trade Balance, PPAC Crude Oil Basket, FBIL USD/INR exchange corridors, and RBI monetary policy transmission.
            </p>
          </div>

          {/* Right 4 Columns: Primary Actions */}
          <div className="lg:col-span-4 flex flex-wrap lg:justify-end items-center gap-3">
            <button
              type="button"
              onClick={handleScrollToKpis}
              className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Explore 7 Official KPIs</span>
              <ArrowDown className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onSelectPage('data-sources')}
              className={`px-4 py-2.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                theme === 'dark'
                  ? 'bg-[#060B16]/80 border-slate-700 text-slate-200 hover:border-emerald-500/50 hover:text-white'
                  : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>View Methodology</span>
            </button>
          </div>
        </div>

        {/* Full-Width 3D Global Trade Network Visualization */}
        <div ref={globeSectionRef} className="scroll-mt-20">
          <ErrorBoundary sectionName="3D Global Trade Network" theme={theme}>
            <Suspense
              fallback={
                <div className="w-full h-[560px] rounded-xl border border-slate-800 bg-[#070E1E] flex flex-col items-center justify-center p-6 text-center">
                  <Compass className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
                  <p className="text-xs text-slate-300 font-mono-tabular">
                    Initializing Interactive 3D Global Trade Network...
                  </p>
                </div>
              }
            >
              <LazyIndiaEconomicGlobe
                theme={theme}
                onOpenMerchandiseTradePage={() =>
                  onSelectPage('currency-oil', 'merchandise-trade')
                }
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      </section>

      {/* 1B. Live Indian Stock Market Indices Section (NIFTY 50, SENSEX, BANK NIFTY, NIFTY IT, MIDCAP 100) */}
      <ErrorBoundary sectionName="Live Indian Stock Market Indices" theme={theme}>
        <LiveIndianMarketsSection
          marketData={marketData}
          isLoading={marketLoading}
          errorMessage={marketError}
          isStaleCache={marketStaleCache}
          autoRefreshEnabled={marketAutoRefresh}
          onToggleAutoRefresh={onToggleMarketAutoRefresh}
          onRefreshNow={onRefreshMarketNow}
          onSimulateError={onSimulateMarketError}
          simulatedUnavailableIndexId={simulatedUnavailableIndexId}
          onSimulateSingleIndexUnavailable={onSimulateSingleIndexUnavailable}
          selectedIndexId={selectedMarketIndexId}
          onSelectIndexId={onSelectMarketIndexId}
          theme={theme}
        />
      </ErrorBoundary>

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
            All 7 core macroeconomic KPI cards—Real GDP, CPI Inflation, PLFS Unemployment, USD/INR Reference Rate, Indian Basket Crude Oil, Merchandise Trade Balance, and RBI Repo Rate—display verified official data.
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
              <KpiCard
                indicator={ind}
                onSelectPage={onSelectPage}
                theme={theme}
                isLoading={
                  ind.id === 'cpi-inflation'
                    ? cpiLoading
                    : ind.id === 'gdp-growth'
                    ? gdpLoading
                    : ind.id === 'rbi-repo-rate'
                    ? repoLoading
                    : ind.id === 'unemployment-rate'
                    ? plfsLoading
                    : ind.id === 'usd-inr'
                    ? usdInrLoading
                    : ind.id === 'crude-oil'
                    ? crudeLoading
                    : ind.id === 'merchandise-trade'
                    ? tradeLoading
                    : false
                }
                errorMessage={
                  ind.id === 'cpi-inflation'
                    ? cpiError
                    : ind.id === 'gdp-growth'
                    ? gdpError
                    : ind.id === 'rbi-repo-rate'
                    ? repoError
                    : ind.id === 'unemployment-rate'
                    ? plfsError
                    : ind.id === 'usd-inr'
                    ? usdInrError
                    : ind.id === 'crude-oil'
                    ? crudeError
                    : ind.id === 'merchandise-trade'
                    ? tradeError
                    : null
                }
                onRetryFetch={
                  ind.id === 'cpi-inflation'
                    ? onRetryCpi
                    : ind.id === 'gdp-growth'
                    ? onRetryGdp
                    : ind.id === 'rbi-repo-rate'
                    ? onRetryRepo
                    : ind.id === 'unemployment-rate'
                    ? onRetryPlfs
                    : ind.id === 'usd-inr'
                    ? onRetryUsdInr
                    : ind.id === 'crude-oil'
                    ? onRetryCrude
                    : ind.id === 'merchandise-trade'
                    ? onRetryTrade
                    : undefined
                }
              />
            </motion.div>
          ))}
        </div>

        {/* Dedicated Merchandise Trade Balance Executive Summary Strip */}
        {tradeIndicator && !tradeError && (
          <div
            className={`rounded-xl border p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
              theme === 'dark'
                ? 'bg-[#091326] border-cyan-500/35 text-slate-100'
                : 'bg-cyan-50/40 border-cyan-200 text-slate-900'
            }`}
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular">
                <span className="text-cyan-400 font-semibold">
                  OFFICIAL MERCHANDISE TRADE BALANCE ({tradeIndicator.officialTradeMeta?.referenceMonthLabel || 'Sep 2026'} · {tradeIndicator.officialTradeMeta?.estimateStatus || 'Provisional'})
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400">
                  Released {tradeIndicator.officialTradeMeta?.releaseDate || '15 Oct 2026'} (MoCI · TRADESTAT &amp; RBI DBIE)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Formula: <strong className="text-slate-200">Trade Balance = Merchandise Exports ($44.40B) − Merchandise Imports ($74.61B) = -$30.21B</strong> (Trade Deficit Magnitude: <strong className="text-amber-400">$30.21B</strong>). Goods only; excludes services.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0 font-mono-tabular text-xs">
              <div className="px-3 py-1.5 rounded-lg bg-[#060B16]/80 border border-slate-800">
                <span className="text-slate-400">Exports: </span>
                <span className="font-semibold text-emerald-400">
                  ${(tradeIndicator.officialTradeMeta?.merchandiseExportsUsdBn ?? 44.4).toFixed(2)}B
                </span>
                <span className="text-[11px] text-emerald-300 ml-1">
                  (+{(tradeIndicator.officialTradeMeta?.exportsYoYPct ?? 23.04).toFixed(2)}% YoY)
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[#060B16]/80 border border-slate-800">
                <span className="text-slate-400">Imports: </span>
                <span className="font-semibold text-amber-400">
                  ${(tradeIndicator.officialTradeMeta?.merchandiseImportsUsdBn ?? 74.61).toFixed(2)}B
                </span>
                <span className="text-[11px] text-slate-300 ml-1">
                  (+{(tradeIndicator.officialTradeMeta?.importsYoYPct ?? 8.0).toFixed(2)}% YoY)
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[#060B16]/80 border border-slate-800">
                <span className="text-slate-400">Deficit Mag: </span>
                <span className="font-semibold text-amber-300">
                  ${(tradeIndicator.officialTradeMeta?.tradeDeficitMagnitudeUsdBn ?? 30.21).toFixed(2)}B
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectPage('currency-oil', 'merchandise-trade')}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Open Trade Intelligence</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
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
              title="India Real vs. Nominal GDP Growth Trajectory (Official MoSPI · Base 2022–23)"
              subtitle="Quarterly year-over-year percentage change at constant (2022–23) and current market prices (Q1 FY24 – Q1 FY27)"
              unit="% YoY"
              sourceLabel="MoSPI · NSO (Official Base 2022–23)"
              frequencyLabel="Quarterly"
              observations={gdpIndicator.observations}
              seriesConfig={[
                { key: 'value', name: 'Real GDP Growth (Constant 2022–23 Prices)', color: '#10b981' },
                { key: 'secondaryValue', name: 'Nominal GDP Growth (Current Prices)', color: '#f59e0b' },
              ]}
              defaultChartType="area"
              defaultRange="MAX"
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
                Observed Structural Shifts (Base 2022–23 Series)
              </h3>

              <div className="space-y-3 text-xs leading-relaxed text-slate-400">
                <p>
                  <strong className={theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}>
                    1. Sustained 7.8% Real Expansion:
                  </strong>{' '}
                  Under MoSPI&apos;s revised Base Year 2022–23 series, India&apos;s Real GDP expanded by {gdpIndicator.currentValue}% YoY in Q1 FY 2026–27 (Apr–Jun 2026), following 7.7% full-year growth in FY 2025–26.
                </p>
                <p>
                  <strong className={theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}>
                    2. Implicit Deflator Wedge:
                  </strong>{' '}
                  The spread between Nominal GDP (10.3% YoY) and Real GDP ({gdpIndicator.currentValue}% YoY) in Q1 FY27 implies an economy-wide GDP deflator of ~2.5%, reflecting benign industrial input prices.
                </p>
                <p>
                  <strong className={theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}>
                    3. Monetary-Inflation Alignment:
                  </strong>{' '}
                  With official All-India Combined CPI at {cpiIndicator.currentValue}% YoY (Base 2024=100), the RBI MPC increased the policy repo rate by 25 bps to 5.50% on October 7, 2026 under a &ldquo;Calibrated Tightening&rdquo; stance.
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
                <span className="text-slate-400">Official Base Years:</span>
                <span className="font-mono-tabular">GDP: 2022–23 | CPI: 2024=100</span>
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

      {/* 4B. Economic News & Current Affairs Intelligence Preview Section */}
      <ErrorBoundary sectionName="Economic News & Current Affairs Preview" theme={theme}>
        <EconomicNewsSection
          newsData={newsData}
          isLoading={newsLoading}
          errorMessage={newsError}
          isStaleCache={newsStaleCache}
          autoRefreshEnabled={newsAutoRefresh}
          onToggleAutoRefresh={onToggleNewsAutoRefresh}
          onRefreshNow={onRefreshNewsNow}
          onSimulateError={onSimulateNewsError}
          onSelectPage={onSelectPage}
          theme={theme}
          mode="overview-preview"
        />
      </ErrorBoundary>

      {/* 4C. Economists' Latest Bites Preview Section */}
      <ErrorBoundary sectionName="Economists' Latest Bites Preview" theme={theme}>
        <EconomistBitesSection
          data={bitesData}
          loading={bitesLoading}
          error={bitesError}
          isStaleCache={bitesStaleCache}
          autoRefreshEnabled={bitesAutoRefresh}
          onToggleAutoRefresh={onToggleBitesAutoRefresh}
          onRefresh={onRefreshBitesNow}
          onSimulateError={onSimulateBitesError}
          mode="overview-preview"
          onNavigate={onSelectPage}
        />
      </ErrorBoundary>

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
            <span className="text-xs font-mono-tabular text-emerald-400">
              Verified Official Releases
            </span>
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
              <span>{sources.length} Institutional Repositories Documented</span>
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
