import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Info,
  Minus,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  formatIndianIndexNumber,
  formatPercentChange,
  formatPointChange,
  IndianMarketIndexQuote,
  IndianMarketIndicesResponse,
} from '../../services/indianMarketService';

interface LiveIndianMarketsSectionProps {
  marketData: IndianMarketIndicesResponse | null;
  isLoading: boolean;
  errorMessage: string | null;
  isStaleCache: boolean;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
  onRefreshNow: () => void;
  onSimulateError: (simulate: boolean) => void;
  simulatedUnavailableIndexId: string | null;
  onSimulateSingleIndexUnavailable: (indexId: string | null) => void;
  selectedIndexId?: string;
  onSelectIndexId?: (indexId: string) => void;
  theme: 'dark' | 'light';
}

export const LiveIndianMarketsSection: React.FC<LiveIndianMarketsSectionProps> = ({
  marketData,
  isLoading,
  errorMessage,
  isStaleCache,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  onRefreshNow,
  onSimulateError,
  simulatedUnavailableIndexId,
  onSimulateSingleIndexUnavailable,
  selectedIndexId: controlledSelectedId,
  onSelectIndexId,
  theme,
}) => {
  const [internalSelectedId, setInternalSelectedId] = useState<string>('nifty-50');
  const activeIndexId = controlledSelectedId || internalSelectedId;

  const handleSelectCard = (id: string) => {
    setInternalSelectedId(id);
    onSelectIndexId?.(id);
  };

  const indices = marketData?.indices || [];
  const selectedIndex: IndianMarketIndexQuote | undefined = useMemo(
    () => indices.find((idx) => idx.id === activeIndexId) || indices[0],
    [indices, activeIndexId]
  );

  const sessionStatus = marketData?.marketStatus || 'CLOSED';
  const sessionLabel =
    marketData?.marketStatusLabel || 'Market Closed — Last Close Displayed';

  return (
    <section
      id="live-indian-markets-section"
      className="space-y-5 scroll-mt-20"
      aria-label="Live Indian Stock Market Indices"
    >
      {/* 1. Section Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular">
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>LIVE INDIAN EQUITY BENCHMARKS (NSE &amp; BSE)</span>
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span
              className={`font-semibold flex items-center gap-1.5 ${
                sessionStatus === 'OPEN'
                  ? 'text-emerald-400'
                  : sessionStatus === 'PRE_OPEN'
                  ? 'text-amber-400'
                  : 'text-slate-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  sessionStatus === 'OPEN'
                    ? 'bg-emerald-400 animate-pulse'
                    : sessionStatus === 'PRE_OPEN'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-slate-400'
                }`}
              />
              <span>{sessionLabel}</span>
            </span>
          </div>

          <h2
            className={`font-display text-xl sm:text-2xl font-semibold tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-slate-950'
            }`}
          >
            Live Indian Markets — 5 Benchmark Indices
          </h2>
          <p className="text-xs text-slate-400 max-w-3xl">
            Real-time / exchange-delayed intraday tracking for <strong>NIFTY 50</strong>,{' '}
            <strong>BSE SENSEX</strong>, <strong>BANK NIFTY</strong>, <strong>NIFTY IT</strong>, and{' '}
            <strong>NIFTY MIDCAP 100</strong> via server-side feed proxy (
            <code className="font-mono-tabular">/api/market-indices</code>). Zero simulated or
            synthetic prices.
          </p>
        </div>

        {/* Right Toolbar: IST Update Time, Auto-Refresh Toggle, Manual Refresh & Verification Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
          {marketData?.fetchedAtIst && (
            <div
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono-tabular flex items-center gap-1.5 ${
                theme === 'dark'
                  ? 'bg-[#091224] border-slate-800 text-slate-300'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Last Update: {marketData.fetchedAtIst}</span>
            </div>
          )}

          <button
            type="button"
            onClick={onToggleAutoRefresh}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              autoRefreshEnabled
                ? theme === 'dark'
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : theme === 'dark'
                ? 'bg-[#0B1325] border-slate-700 text-slate-400'
                : 'bg-white border-slate-300 text-slate-600'
            }`}
            title={
              autoRefreshEnabled
                ? 'Automatic polling active (30s when open, paused when tab hidden or market closed)'
                : 'Automatic polling paused'
            }
          >
            {autoRefreshEnabled ? (
              <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <PauseCircle className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>
              {autoRefreshEnabled
                ? sessionStatus === 'OPEN'
                  ? 'Auto-Poll: 30s'
                  : 'Auto-Poll: Standby (Closed)'
                : 'Auto-Poll: Paused'}
            </span>
          </button>

          <button
            type="button"
            onClick={onRefreshNow}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Refreshing...' : 'Refresh Now'}</span>
          </button>
        </div>
      </div>

      {/* 2. Market Closed / Trading Hours Provenance Strip */}
      {sessionStatus !== 'OPEN' && !errorMessage && marketData && (
        <div
          className={`rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
            theme === 'dark'
              ? 'bg-[#091326] border-slate-800 text-slate-300'
              : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-start sm:items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-semibold text-white">{sessionLabel}: </span>
              <span className="text-slate-400">
                Displaying the most recent verified exchange closing values and intraday session
                trajectories. ({marketData.tradingHoursNoteIst})
              </span>
            </div>
          </div>
          <span className="font-mono-tabular text-[11px] text-cyan-400 shrink-0">
            IST (UTC+05:30)
          </span>
        </div>
      )}

      {/* 3. Stale Cache Warning Banner */}
      {isStaleCache && !errorMessage && (
        <div
          role="status"
          className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            theme === 'dark'
              ? 'bg-amber-950/25 border-amber-500/40 text-amber-200'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Stale / Cached Market Observation Notice: </span>
              <span>
                Live refresh experienced a transient connection delay. Displaying the last verified
                market snapshot from <strong>{marketData?.fetchedAtIst}</strong> rather than
                inventing prices.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRefreshNow}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-semibold shrink-0 cursor-pointer"
          >
            Retry Live Sync
          </button>
        </div>
      )}

      {/* 4. Full Feed Error State */}
      {errorMessage && (
        <div
          role="alert"
          className={`rounded-xl border p-5 sm:p-6 ${
            theme === 'dark'
              ? 'bg-rose-950/25 border-rose-500/40 text-slate-100'
              : 'bg-rose-50 border-rose-200 text-slate-900'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-sm font-semibold text-rose-400">
                  Live Indian Market Data Feed Unavailable
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  {errorMessage}
                </p>
                <p className="text-[11px] text-slate-400">
                  In accordance with ArthNiti’s strict data integrity policy, no random, simulated,
                  or hardcoded live prices are substituted when the market feed is unreachable.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onSimulateError(false);
                onRefreshNow();
              }}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reconnect Market Feed</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Initial Skeleton Loading State */}
      {isLoading && indices.length === 0 && !errorMessage && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className={`rounded-xl border p-5 h-[360px] animate-pulse flex flex-col justify-between ${
                theme === 'dark'
                  ? 'bg-[#0B1325] border-slate-800/90'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="space-y-2">
                <div className="h-4 w-32 bg-slate-800 rounded" />
                <div className="h-8 w-48 bg-slate-800 rounded" />
              </div>
              <div className="h-28 w-full bg-slate-800/60 rounded-lg" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-10 bg-slate-800/50 rounded" />
                <div className="h-10 bg-slate-800/50 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. The 5 Indian Stock Market Index Cards */}
      {!errorMessage && indices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {indices.map((idx) => {
            const isAvailable = idx.status === 'ok' && idx.currentValue !== null;
            const ptChange = idx.pointChange ?? 0;
            const pctChange = idx.percentChange ?? 0;
            const isPositive = ptChange > 0;
            const isNegative = ptChange < 0;
            const isSelected = selectedIndex?.id === idx.id;

            const strokeColor = isPositive
              ? '#10b981'
              : isNegative
              ? '#f43f5e'
              : '#94a3b8';

            // Calculate intraday range position percentage (0 to 100%)
            const rangePercent =
              isAvailable &&
              idx.low !== null &&
              idx.high !== null &&
              idx.high > idx.low &&
              idx.currentValue !== null
                ? Math.min(
                    100,
                    Math.max(0, ((idx.currentValue - idx.low) / (idx.high - idx.low)) * 100)
                  )
                : 50;

            // Compute tight Y-axis bounds for intraday sparkline
            const prices = idx.intradayPoints.map((p) => p.price);
            if (idx.previousClose !== null) {
              prices.push(idx.previousClose);
            }
            const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
            const maxPrice = prices.length > 0 ? Math.max(...prices) : 100;
            const pad = Math.max((maxPrice - minPrice) * 0.08, 5);

            return (
              <div
                key={idx.id}
                onClick={() => handleSelectCard(idx.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectCard(idx.id);
                  }
                }}
                className={`rounded-xl border p-5 flex flex-col justify-between transition-all cursor-pointer text-left ${
                  isSelected
                    ? theme === 'dark'
                      ? 'bg-[#0D172E] border-emerald-500/60 shadow-lg shadow-emerald-950/20'
                      : 'bg-white border-emerald-500 shadow-sm'
                    : theme === 'dark'
                    ? 'bg-[#0B1325] border-slate-800/90 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Top Header: Index Name, Symbol/Exchange, Market Status */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          className={`font-display text-base font-semibold tracking-tight ${
                            theme === 'dark' ? 'text-white' : 'text-slate-950'
                          }`}
                        >
                          {idx.name}
                        </h3>
                        <span className="text-[11px] font-mono-tabular text-slate-400">
                          {idx.exchange} · {idx.symbol}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {idx.constituentsCount} Constituents · {idx.fullExchangeName}
                      </div>
                    </div>

                    {/* Market Status Label (Open / Pre-open / Closed) */}
                    <div className="flex items-center gap-1.5 text-[11px] font-mono-tabular shrink-0">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          idx.marketStatus === 'OPEN'
                            ? 'bg-emerald-400 animate-pulse'
                            : idx.marketStatus === 'PRE_OPEN'
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-slate-400'
                        }`}
                      />
                      <span
                        className={
                          idx.marketStatus === 'OPEN'
                            ? 'text-emerald-400 font-semibold'
                            : idx.marketStatus === 'PRE_OPEN'
                            ? 'text-amber-400 font-semibold'
                            : 'text-slate-400'
                        }
                      >
                        {idx.marketStatus === 'OPEN'
                          ? 'Open'
                          : idx.marketStatus === 'PRE_OPEN'
                          ? 'Pre-open'
                          : 'Closed'}
                      </span>
                    </div>
                  </div>

                  {/* Primary Price & Change Block OR Unavailable Card State */}
                  {isAvailable ? (
                    <div className="mt-3 flex items-baseline justify-between gap-2 flex-wrap">
                      <div
                        className={`font-mono-tabular text-2xl sm:text-[28px] font-bold tracking-tight ${
                          theme === 'dark' ? 'text-white' : 'text-slate-950'
                        }`}
                      >
                        {formatIndianIndexNumber(idx.currentValue)}
                      </div>

                      <div
                        className={`font-mono-tabular text-xs sm:text-sm font-semibold flex items-center gap-1 ${
                          isPositive
                            ? 'text-emerald-400'
                            : isNegative
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="w-4 h-4 shrink-0" />
                        ) : isNegative ? (
                          <ArrowDownRight className="w-4 h-4 shrink-0" />
                        ) : (
                          <Minus className="w-4 h-4 shrink-0" />
                        )}
                        <span>{formatPointChange(ptChange)}</span>
                        <span>({formatPercentChange(pctChange)})</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3.5 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Index Data Temporarily Unavailable</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {idx.errorMessage ||
                          `Unable to retrieve live quote for ${idx.name}. No synthetic values are shown.`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Intraday Price Chart */}
                {isAvailable && idx.intradayPoints.length > 1 && (
                  <div className="my-3.5 h-28 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={idx.intradayPoints}
                        margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id={`grad-${idx.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.28} />
                            <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="timeLabelIst" hide />
                        <YAxis domain={[minPrice - pad, maxPrice + pad]} hide />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload || !payload.length) return null;
                            const pt = payload[0].payload;
                            return (
                              <div className="rounded-lg border border-slate-700 bg-[#060B16]/95 px-2.5 py-1.5 text-[11px] font-mono-tabular shadow-md">
                                <div className="text-slate-400">{pt.timeLabelIst} IST</div>
                                <div className="font-semibold text-white">
                                  {formatIndianIndexNumber(pt.price)}
                                </div>
                              </div>
                            );
                          }}
                        />
                        {idx.previousClose !== null && (
                          <ReferenceLine
                            y={idx.previousClose}
                            stroke="#64748b"
                            strokeDasharray="3 3"
                            strokeWidth={1}
                          />
                        )}
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke={strokeColor}
                          strokeWidth={1.75}
                          fill={`url(#grad-${idx.id})`}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Session Open, High, Low & Previous Close + Intraday Range Bar */}
                {isAvailable && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-800/70 text-xs">
                    {/* Intraday Low-High Range Indicator */}
                    {idx.low !== null && idx.high !== null && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono-tabular text-slate-400">
                          <span>Day Low: {formatIndianIndexNumber(idx.low)}</span>
                          <span>Day High: {formatIndianIndexNumber(idx.high)}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden relative">
                          <div
                            className={`h-full rounded-full ${
                              isPositive ? 'bg-emerald-500' : isNegative ? 'bg-rose-500' : 'bg-cyan-500'
                            }`}
                            style={{ width: `${rangePercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* 2x2 Grid for Open, Prev Close, High, Low */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono-tabular text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans">Open:</span>
                        <span className="font-medium text-slate-200">
                          {formatIndianIndexNumber(idx.open)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans">Prev Close:</span>
                        <span className="font-medium text-slate-200">
                          {formatIndianIndexNumber(idx.previousClose)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans">High:</span>
                        <span className="font-medium text-emerald-400">
                          {formatIndianIndexNumber(idx.high)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans">Low:</span>
                        <span className="font-medium text-rose-400">
                          {formatIndianIndexNumber(idx.low)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card Footer: IST Timestamp, Source & Delay Disclosure */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/60 space-y-1 text-[10px] font-mono-tabular text-slate-400">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      Quote Time: {idx.exchangeTimeIst || idx.lastUpdatedIst}
                    </span>
                    <span className="text-cyan-400 shrink-0">
                      {idx.isRealtime ? 'Real-Time' : 'Delayed / 5m Feed'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-slate-500">
                    <span className="truncate">Source: {idx.dataSource}</span>
                    <span className="text-emerald-400/90 shrink-0">
                      {isSelected ? '● Inspecting' : 'Click to Expand'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 7. Expanded Interactive Intraday Session & Mathematical Verification Panel */}
      {!errorMessage && selectedIndex && selectedIndex.status === 'ok' && (
        <div
          className={`rounded-xl border p-5 sm:p-6 space-y-5 ${
            theme === 'dark'
              ? 'bg-[#0B1325] border-slate-800/90 text-slate-100'
              : 'bg-white border-slate-200 text-slate-900 shadow-xs'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-800/70">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>INTRADAY SESSION TERMINAL &amp; VERIFICATION INSPECTOR</span>
                <span aria-hidden="true">·</span>
                <span>
                  {selectedIndex.name} ({selectedIndex.exchange}: {selectedIndex.symbol})
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold mt-0.5">
                {selectedIndex.name} — 5-Minute Intraday Trajectory ({selectedIndex.intradayPoints.length}{' '}
                Session Observations)
              </h3>
            </div>

            {/* Quick Index Switcher Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {indices.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectCard(item.id)}
                  className={`px-3 py-1 rounded-md text-xs font-mono-tabular transition-colors cursor-pointer ${
                    selectedIndex.id === item.id
                      ? 'bg-emerald-600 text-white font-semibold'
                      : theme === 'dark'
                      ? 'bg-[#060B16] text-slate-400 hover:text-slate-200 border border-slate-800'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {item.shortName}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left 8 Cols: High-Resolution Intraday Chart */}
            <div className="lg:col-span-8 h-[280px] sm:h-[320px] w-full">
              {selectedIndex.intradayPoints.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={selectedIndex.intradayPoints}
                    margin={{ top: 10, right: 12, left: 8, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="expandedIntradayGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={
                            (selectedIndex.pointChange ?? 0) >= 0 ? '#10b981' : '#f43f5e'
                          }
                          stopOpacity={0.32}
                        />
                        <stop
                          offset="95%"
                          stopColor={
                            (selectedIndex.pointChange ?? 0) >= 0 ? '#10b981' : '#f43f5e'
                          }
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="timeLabelIst"
                      stroke="#64748b"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      minTickGap={28}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      stroke="#64748b"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      width={68}
                      tickFormatter={(v) => Number(v).toLocaleString('en-IN')}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const pt = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-slate-700 bg-[#060B16]/95 p-3 text-xs font-mono-tabular shadow-xl space-y-1">
                            <div className="text-emerald-400 font-semibold">
                              {selectedIndex.name} · {pt.timeLabelIst} IST
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400">Close Level:</span>
                              <span className="font-bold text-white">
                                {formatIndianIndexNumber(pt.price)}
                              </span>
                            </div>
                            {pt.open !== null && (
                              <div className="flex justify-between gap-4 text-[11px]">
                                <span className="text-slate-400">5m Open:</span>
                                <span>{formatIndianIndexNumber(pt.open)}</span>
                              </div>
                            )}
                            {pt.high !== null && pt.low !== null && (
                              <div className="flex justify-between gap-4 text-[11px]">
                                <span className="text-slate-400">5m Range:</span>
                                <span>
                                  {formatIndianIndexNumber(pt.low)} –{' '}
                                  {formatIndianIndexNumber(pt.high)}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }}
                    />
                    {selectedIndex.previousClose !== null && (
                      <ReferenceLine
                        y={selectedIndex.previousClose}
                        stroke="#f59e0b"
                        strokeDasharray="4 4"
                        label={{
                          value: `Prev Close: ${formatIndianIndexNumber(selectedIndex.previousClose)}`,
                          fill: '#f59e0b',
                          fontSize: 11,
                          position: 'insideTopRight',
                        }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={(selectedIndex.pointChange ?? 0) >= 0 ? '#10b981' : '#f43f5e'}
                      strokeWidth={2}
                      fill="url(#expandedIntradayGrad)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Intraday chart points are not available for this session.
                </div>
              )}
            </div>

            {/* Right 4 Cols: Mathematical Audit, 52W Range & Methodology */}
            <div
              className={`lg:col-span-4 rounded-xl border p-4 flex flex-col justify-between space-y-4 text-xs ${
                theme === 'dark'
                  ? 'bg-[#060B16]/80 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="space-y-3">
                <div className="text-[11px] font-mono-tabular text-cyan-400 font-semibold uppercase">
                  Mathematical Consistency Audit
                </div>
                <div className="space-y-1.5 font-mono-tabular text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Index Value:</span>
                    <span className="font-semibold text-white">
                      {formatIndianIndexNumber(selectedIndex.currentValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Previous Close:</span>
                    <span className="text-slate-200">
                      {formatIndianIndexNumber(selectedIndex.previousClose)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1.5">
                    <span className="text-slate-400">Point Change (Curr − Prev):</span>
                    <span
                      className={
                        (selectedIndex.pointChange ?? 0) >= 0
                          ? 'text-emerald-400 font-semibold'
                          : 'text-rose-400 font-semibold'
                      }
                    >
                      {formatPointChange(selectedIndex.pointChange)} pts
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Percentage Change:</span>
                    <span
                      className={
                        (selectedIndex.percentChange ?? 0) >= 0
                          ? 'text-emerald-400 font-semibold'
                          : 'text-rose-400 font-semibold'
                      }
                    >
                      {formatPercentChange(selectedIndex.percentChange)}
                    </span>
                  </div>
                  {selectedIndex.fiftyTwoWeekLow !== null &&
                    selectedIndex.fiftyTwoWeekHigh !== null && (
                      <div className="flex justify-between border-t border-slate-800 pt-1.5">
                        <span className="text-slate-400">52-Week Range:</span>
                        <span className="text-slate-300">
                          {formatIndianIndexNumber(selectedIndex.fiftyTwoWeekLow)} –{' '}
                          {formatIndianIndexNumber(selectedIndex.fiftyTwoWeekHigh)}
                        </span>
                      </div>
                    )}
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <div className="font-semibold text-slate-200">Index Methodology</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {selectedIndex.methodologyNote}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-1 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Verified Feed Provenance</span>
                </div>
                <p className="text-[10px] leading-relaxed">
                  {selectedIndex.dataDelayDisclosure}. Exchange quote timestamp:{' '}
                  <strong className="font-mono-tabular text-slate-300">
                    {selectedIndex.exchangeTimeIst || selectedIndex.lastUpdatedIst}
                  </strong>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
