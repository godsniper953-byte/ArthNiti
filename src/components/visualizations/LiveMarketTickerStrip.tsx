import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Minus,
  RefreshCw,
} from 'lucide-react';
import {
  formatIndianIndexNumber,
  formatPercentChange,
  formatPointChange,
  IndianMarketIndicesResponse,
} from '../../services/indianMarketService';

interface LiveMarketTickerStripProps {
  marketData: IndianMarketIndicesResponse | null;
  isLoading: boolean;
  errorMessage: string | null;
  isStaleCache: boolean;
  onRefresh: () => void;
  onSelectIndexCard?: (indexId: string) => void;
  theme: 'dark' | 'light';
}

export const LiveMarketTickerStrip: React.FC<LiveMarketTickerStripProps> = ({
  marketData,
  isLoading,
  errorMessage,
  isStaleCache,
  onRefresh,
  onSelectIndexCard,
  theme,
}) => {
  const sessionStatus = marketData?.marketStatus || 'CLOSED';
  const indices = marketData?.indices || [];

  return (
    <div
      className={`px-4 sm:px-6 py-2 border-b text-xs transition-colors ${
        theme === 'dark'
          ? 'bg-[#070E1E] border-slate-800/90 text-slate-300'
          : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}
      role="region"
      aria-label="Live Indian Stock Market Indices Ticker"
    >
      <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-2">
        {/* Left: Market Status & 5 Index Quotes */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5">
          {/* Session Status Indicator */}
          <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-slate-800">
            <span
              className={`w-2 h-2 rounded-full ${
                sessionStatus === 'OPEN'
                  ? 'bg-emerald-400 animate-pulse'
                  : sessionStatus === 'PRE_OPEN'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-slate-400'
              }`}
            />
            <span className="font-mono-tabular font-semibold tracking-tight text-[11px] uppercase text-slate-200">
              {sessionStatus === 'OPEN'
                ? 'NSE/BSE LIVE'
                : sessionStatus === 'PRE_OPEN'
                ? 'PRE-OPEN (IST)'
                : 'MKT CLOSED (IST)'}
            </span>
          </div>

          {/* Loading State */}
          {isLoading && indices.length === 0 && (
            <div className="flex items-center gap-2 text-slate-400 font-mono-tabular text-[11px]">
              <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
              <span>Fetching NIFTY 50, SENSEX, BANK NIFTY, NIFTY IT &amp; MIDCAP 100...</span>
            </div>
          )}

          {/* Error State */}
          {!isLoading && errorMessage && indices.length === 0 && (
            <div className="flex items-center gap-2 text-rose-400 font-mono-tabular text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Market ticker unavailable ({errorMessage})</span>
            </div>
          )}

          {/* 5 Index Items */}
          {indices.map((idx, i) => {
            const isAvailable = idx.status === 'ok' && idx.currentValue !== null;
            const ptChange = idx.pointChange ?? 0;
            const isPositive = ptChange > 0;
            const isNegative = ptChange < 0;

            return (
              <React.Fragment key={idx.id}>
                {i > 0 && (
                  <span className="text-slate-700 select-none" aria-hidden="true">
                    |
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onSelectIndexCard?.(idx.id)}
                  className="flex items-center gap-1.5 shrink-0 group cursor-pointer text-left hover:opacity-90 transition-opacity"
                  title={`${idx.name} (${idx.exchange}: ${idx.symbol}) — Click to inspect intraday chart`}
                >
                  <span className="font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                    {idx.shortName}
                  </span>
                  {isAvailable ? (
                    <>
                      <span className="font-mono-tabular font-semibold text-white">
                        {formatIndianIndexNumber(idx.currentValue)}
                      </span>
                      <span
                        className={`font-mono-tabular text-[11px] flex items-center gap-0.5 ${
                          isPositive
                            ? 'text-emerald-400'
                            : isNegative
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : isNegative ? (
                          <ArrowDownRight className="w-3 h-3" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                        <span>{formatPointChange(idx.pointChange)}</span>
                        <span>({formatPercentChange(idx.percentChange)})</span>
                      </span>
                    </>
                  ) : (
                    <span className="font-mono-tabular text-[11px] text-amber-400">
                      Unavailable
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Right: Timestamp in IST & Manual Refresh */}
        <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 text-[11px] font-mono-tabular text-slate-400 border-t lg:border-t-0 pt-1 lg:pt-0 border-slate-800/80">
          {isStaleCache && (
            <span className="text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Cached Quote</span>
            </span>
          )}
          {marketData?.fetchedAtIst && (
            <span className="flex items-center gap-1 truncate" title="Last successful update in Indian Standard Time">
              <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>Updated: {marketData.fetchedAtIst}</span>
            </span>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Refresh Indian market indices now"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Syncing' : 'Refresh'}</span>
          </button>
          {onSelectIndexCard && (
            <button
              type="button"
              onClick={() => onSelectIndexCard('nifty-50')}
              className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Activity className="w-3 h-3" />
              <span>Live Markets →</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
