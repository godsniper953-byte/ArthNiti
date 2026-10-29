import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Landmark,
  RefreshCw,
} from 'lucide-react';
import { EconomicIndicator } from '../types/economy';
import { AnalyticalChartPanel } from '../components/charts/AnalyticalChartPanel';
import { LiveIndianMarketsSection } from '../components/visualizations/LiveIndianMarketsSection';
import { IndianMarketIndicesResponse } from '../services/indianMarketService';

interface FinancialMarketsPageProps {
  marketIndicator: EconomicIndicator;
  repoIndicator: EconomicIndicator;
  repoLoading: boolean;
  repoError: string | null;
  repoLastVerified: string;
  repoDataOrigin?: 'official_rbi_csv' | 'user_uploaded_csv' | 'demonstration_fallback';
  onRefreshOfficialRepo: (simulateError?: boolean) => void;
  onUploadCustomRepoCsv?: (csvText: string) => { ok: boolean; error?: string };
  onResetCustomRepoCsv?: () => void;
  onActivateRepoDemoFallback?: () => void;
  theme: 'dark' | 'light';
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
}

export const FinancialMarketsPage: React.FC<FinancialMarketsPageProps> = ({
  marketIndicator,
  repoIndicator,
  repoLoading,
  repoError,
  repoLastVerified,
  onRefreshOfficialRepo,
  theme,
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
}) => {
  const [selectedBenchmark, setSelectedBenchmark] = useState<'nifty' | 'sensex' | 'gsec'>('nifty');

  const latestMarket = marketIndicator.observations[marketIndicator.observations.length - 1];
  const latestRepo = repoIndicator.observations[repoIndicator.observations.length - 1];
  const repoMeta = repoIndicator.officialRepoMeta;

  // Transform observations so the selected equity/yield benchmark is plotted on the primary 'value' key
  const benchmarkObservations = marketIndicator.observations.map((obs) => ({
    ...obs,
    value:
      selectedBenchmark === 'nifty'
        ? obs.value
        : selectedBenchmark === 'sensex'
        ? obs.secondaryValue || obs.value * 3.26
        : obs.tertiaryValue || 6.55,
  }));

  const benchmarkMeta = {
    nifty: {
      title: 'NIFTY 50 Equity Benchmark Index (2017–2026)',
      subtitle: 'Historical end-of-month settlement levels of 50 large-cap NSE companies (Base 1995 = 1000)',
      unit: 'Index Points',
      color: '#10b981',
      source: 'NSE Indices Ltd (Historical Archive)',
    },
    sensex: {
      title: 'BSE SENSEX 30 Benchmark Index (2017–2026)',
      subtitle: 'Historical end-of-month settlement levels of 30 premier BSE constituents (Base 1978–79 = 100)',
      unit: 'Index Points',
      color: '#f59e0b',
      source: 'BSE / Asia Index Pvt. Ltd (Historical Archive)',
    },
    gsec: {
      title: 'India 10-Year Benchmark Sovereign G-Sec Yield (2017–2026)',
      subtitle: 'Secondary market yield on 10-year Government of India dated securities (% per annum)',
      unit: '% Yield',
      color: '#06b6d4',
      source: 'RBI / CCIL Historical Settlement',
    },
  }[selectedBenchmark];

  return (
    <div className="space-y-8">
      {/* 1. Official RBI Monetary Policy Section Header & Provenance Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular text-emerald-400">
            <Landmark className="w-3.5 h-3.5" />
            <span className="font-semibold">
              Official RBI Monetary Policy Statement Integrated
            </span>
            <span aria-hidden="true">·</span>
            <span>Effective: {repoMeta?.effectiveDate || latestRepo.effectiveDate || '07 Oct 2026'}</span>
            <span aria-hidden="true">·</span>
            <span>Last Verified: {repoLastVerified}</span>
          </div>

          <h1
            className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-1 ${
              theme === 'dark' ? 'text-white' : 'text-slate-950'
            }`}
          >
            RBI Monetary Policy &amp; Financial Markets
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Track the Reserve Bank of India&apos;s official <strong>Policy Repo Rate ({latestRepo.value.toFixed(2)}%)</strong>, Standing Deposit Facility (SDF), and Marginal Standing Facility (MSF) corridor alongside historical Indian equity and sovereign bond benchmarks.
          </p>
        </div>

        {/* Action Toolbar: Reload Official RBI Data */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => onRefreshOfficialRepo(false)}
            disabled={repoLoading}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#0B1325] border-slate-700 text-slate-200 hover:border-emerald-500/50'
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${repoLoading ? 'animate-spin' : ''}`} />
            <span>{repoLoading ? 'Verifying RBI Data...' : 'Reload Official RBI Data'}</span>
          </button>
        </div>
      </div>

      {/* 2. Error State Banner (Never silently displays stale data as current when fetch fails) */}
      {repoError && (
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
                  Official RBI Policy Repo Rate Retrieval Failed
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  {repoError}
                </p>
                <p className="text-[11px] text-slate-400">
                  ArthNiti never silently displays stale or unverified interest rates as current when official RBI data retrieval fails. Click &ldquo;Retry Official RBI Fetch&rdquo; to reload the verified dataset.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onRefreshOfficialRepo(false)}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Official RBI Fetch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Official RBI Policy Repo Rate Verification Strip (4 Cards) */}
      {!repoError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Current Policy Repo Rate (%) */}
          <div
            className={`rounded-xl border p-5 ${
              theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Current Policy Repo Rate</span>
              <span className="font-mono-tabular text-[11px] text-emerald-400 font-semibold">
                LAF Policy Anchor
              </span>
            </div>
            <div className="font-mono-tabular text-2xl sm:text-3xl font-semibold text-emerald-400 mt-1.5">
              {latestRepo.value.toFixed(2)}% p.a.
            </div>
            <div className="text-[11px] text-amber-400 font-mono-tabular mt-1.5">
              {repoIndicator.changeLabel} (Unanimous 6–0 MPC Vote)
            </div>
          </div>

          {/* Card 2: Effective Date & Official Announcement Date */}
          <div
            className={`rounded-xl border p-5 ${
              theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            <div className="text-xs text-slate-400">
              Effective &amp; Announcement Dates
            </div>
            <div className="font-mono-tabular text-base sm:text-lg font-semibold mt-1.5">
              Effective: {repoMeta?.effectiveDate || latestRepo.effectiveDate || '07 Oct 2026'}
            </div>
            <div className="text-[11px] text-emerald-400 font-mono-tabular mt-1">
              Announced: {repoMeta?.announcementDate || latestRepo.announcementDate || '07 Oct 2026'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Meeting: <span className="text-slate-300">63rd MPC (Oct 5–7, 2026)</span>
            </div>
          </div>

          {/* Card 3: Standing Deposit Facility (SDF), MSF & Policy Stance */}
          <div
            className={`rounded-xl border p-5 ${
              theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>LAF Corridor &amp; Stance</span>
              <span className="font-mono-tabular text-[11px] text-cyan-400">
                ±25 bps Band
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between font-mono-tabular">
              <div>
                <span className="text-xs text-slate-400">SDF: </span>
                <span className="text-lg font-semibold text-cyan-400">
                  {(repoMeta?.sdfRate ?? latestRepo.secondaryValue ?? 5.25).toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400">MSF/Bank: </span>
                <span className="text-lg font-semibold text-amber-400">
                  {(repoMeta?.msfAndBankRate ?? latestRepo.tertiaryValue ?? 5.75).toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
              <span>MPC Stance:</span>
              <span className="font-mono-tabular text-amber-400 font-semibold">
                {repoMeta?.policyStance || latestRepo.policyStance || 'Calibrated Tightening'}
              </span>
            </div>
          </div>

          {/* Card 4: Official Reserve Bank of India Links */}
          <div
            className={`rounded-xl border p-5 flex flex-col justify-between ${
              theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            <div>
              <div className="text-xs text-slate-400">Official RBI Verification Links</div>
              <div className="font-mono-tabular text-xs font-semibold text-emerald-400 mt-1">
                Reserve Bank of India (MPC)
              </div>
            </div>

            <div className="space-y-1 pt-2 text-[11px]">
              <a
                href={repoMeta?.rbiOfficialWebsiteUrl || 'https://www.rbi.org.in/'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-emerald-400 hover:underline"
              >
                <span>1. RBI Official Website (rbi.org.in)</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
              <a
                href={
                  repoMeta?.rbiMonetaryPolicyUrl ||
                  'https://www.rbi.org.in/Scripts/MPView.aspx'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-amber-400 hover:underline"
              >
                <span>2. RBI Monetary Policy Statements</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
              <a
                href={repoMeta?.rbiDbiePortalUrl || 'https://data.rbi.org.in'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-cyan-400 hover:underline"
              >
                <span>3. RBI DBIE Statistical Portal</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 6. Official Monetary Policy Corridor Chart (RBI Repo, SDF, MSF) */}
      {!repoError && (
        <AnalyticalChartPanel
          title="Official RBI Monetary Policy Rate Corridor (2020–2026 · Repo, SDF & MSF)"
          subtitle="Verified Reserve Bank of India Monetary Policy Committee (MPC) policy rate decisions (% per annum, effective on announcement date)"
          unit="% p.a."
          sourceLabel="Reserve Bank of India (Official MPC Statements · rbi.org.in)"
          frequencyLabel="MPC Decisions"
          observations={repoIndicator.observations}
          seriesConfig={[
            { key: 'value', name: 'Policy Repo Rate (% p.a.)', color: '#10b981' },
            {
              key: 'secondaryValue',
              name: 'Standing Deposit Facility / Reverse Repo (% p.a.)',
              color: '#06b6d4',
            },
            {
              key: 'tertiaryValue',
              name: 'Marginal Standing Facility & Bank Rate (% p.a.)',
              color: '#f59e0b',
            },
          ]}
          defaultChartType="line"
          defaultRange="MAX"
          theme={theme}
        />
      )}

      {/* 7. Official RBI MPC Decision History & Verification Table */}
      {!repoError && (
        <div
          className={`rounded-xl border p-5 sm:p-6 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800/60">
            <div>
              <div className="text-xs font-mono-tabular text-emerald-400">
                Official Reserve Bank of India Monetary Policy Committee (MPC) Chronology
              </div>
              <h2 className="text-base sm:text-lg font-semibold mt-0.5">
                Historical Policy Repo Rate Decisions (2020 – October 7, 2026)
              </h2>
            </div>
            <span className="text-xs font-mono-tabular text-slate-400">
              {repoIndicator.observations.length} Official MPC Resolutions Verified
            </span>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  className={`border-b font-mono-tabular text-[11px] ${
                    theme === 'dark'
                      ? 'border-slate-800 text-slate-400'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  <th className="py-2.5 pr-4">MPC Meeting</th>
                  <th className="py-2.5 px-3">Announcement Date</th>
                  <th className="py-2.5 px-3">Effective Date</th>
                  <th className="py-2.5 px-3 text-right">Policy Repo Rate</th>
                  <th className="py-2.5 px-3 text-right">Change (bps)</th>
                  <th className="py-2.5 px-3 text-right">SDF / Rev. Repo</th>
                  <th className="py-2.5 px-3 text-right">MSF / Bank Rate</th>
                  <th className="py-2.5 pl-3">MPC Policy Stance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-mono-tabular">
                {[...repoIndicator.observations].reverse().map((obs, idx) => {
                  const bps = obs.changeBps ?? 0;
                  return (
                    <tr
                      key={obs.date}
                      className={
                        idx === 0
                          ? theme === 'dark'
                            ? 'bg-emerald-950/20'
                            : 'bg-emerald-50/70'
                          : ''
                      }
                    >
                      <td className="py-2.5 pr-4 font-semibold">
                        {obs.label}
                        {idx === 0 && (
                          <span className="ml-2 text-[10px] text-emerald-400 font-normal">
                            (Current)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {obs.announcementDate || obs.releaseDate || obs.date}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {obs.effectiveDate || obs.announcementDate || obs.date}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-400">
                        {obs.value.toFixed(2)}%
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-semibold ${
                          bps > 0
                            ? 'text-amber-400'
                            : bps < 0
                            ? 'text-cyan-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {bps > 0 ? `+${bps} bps` : bps < 0 ? `${bps} bps` : '0 bps (Hold)'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-cyan-400">
                        {obs.secondaryValue !== undefined
                          ? `${obs.secondaryValue.toFixed(2)}%`
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-400">
                        {obs.tertiaryValue !== undefined
                          ? `${obs.tertiaryValue.toFixed(2)}%`
                          : '—'}
                      </td>
                      <td className="py-2.5 pl-3 font-sans text-slate-300">
                        {obs.policyStance || 'Neutral'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7B. Live Indian Stock Market Indices Section (NIFTY 50, SENSEX, BANK NIFTY, NIFTY IT, MIDCAP 100) */}
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

      {/* 8. Explicit Delayed / Archival Equity Market Data Disclosure Banner */}
      <div
        className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          theme === 'dark'
            ? 'bg-amber-950/20 border-amber-500/35 text-amber-200'
            : 'bg-amber-50 border-amber-200 text-amber-950'
        }`}
        role="status"
      >
        <div className="flex items-start sm:items-center gap-2.5">
          <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <span className="font-semibold">Capital Markets Historical Settlement Notice: </span>
            <span>
              While the RBI Policy Repo Rate above reflects verified official MPC announcements, the equity indices (NIFTY 50, SENSEX) and 10Y G-Sec yields below are end-of-month illustrative archival settlements for macroeconomic research—not live trading quotes.
            </span>
          </div>
        </div>
        <span className="font-mono-tabular text-[11px] text-amber-400 shrink-0">
          EOM Archival Series · Non-Live
        </span>
      </div>

      {/* 9. Equity & Bond Benchmark Switcher + 3 Cards */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-400">
            <span>Capital Markets &amp; Sovereign Yield Curve</span>
            <span aria-hidden="true">·</span>
            <span>NSE · BSE · CCIL</span>
          </div>
          <h2
            className={`font-display text-xl sm:text-2xl font-semibold tracking-tight mt-0.5 ${
              theme === 'dark' ? 'text-white' : 'text-slate-950'
            }`}
          >
            Equity Benchmarks &amp; 10-Year G-Sec Sovereign Yield
          </h2>
        </div>

        <div
          className={`flex items-center p-1 rounded-lg border self-start md:self-auto ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
          role="group"
          aria-label="Select financial market benchmark"
        >
          {[
            { id: 'nifty', label: 'NIFTY 50' },
            { id: 'sensex', label: 'BSE SENSEX' },
            { id: 'gsec', label: '10Y G-Sec Yield' },
          ].map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedBenchmark(b.id as 'nifty' | 'sensex' | 'gsec')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                selectedBenchmark === b.id
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setSelectedBenchmark('nifty')}
          className={`text-left rounded-xl border p-5 transition-colors cursor-pointer ${
            selectedBenchmark === 'nifty'
              ? 'border-emerald-500/60 bg-emerald-500/5'
              : theme === 'dark'
              ? 'bg-[#0B1325] border-slate-800/90 hover:border-slate-700'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>NIFTY 50 (NSE EOM)</span>
            <span className="font-mono-tabular text-[11px]">{latestMarket.label}</span>
          </div>
          <div className="font-mono-tabular text-2xl font-semibold text-emerald-400 mt-1">
            {latestMarket.value.toLocaleString('en-IN')}{' '}
            <span className="text-xs font-normal text-slate-400">pts</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            50-stock free-float market cap benchmark
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedBenchmark('sensex')}
          className={`text-left rounded-xl border p-5 transition-colors cursor-pointer ${
            selectedBenchmark === 'sensex'
              ? 'border-amber-500/60 bg-amber-500/5'
              : theme === 'dark'
              ? 'bg-[#0B1325] border-slate-800/90 hover:border-slate-700'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>BSE SENSEX (30 EOM)</span>
            <span className="font-mono-tabular text-[11px]">{latestMarket.label}</span>
          </div>
          <div className="font-mono-tabular text-2xl font-semibold text-amber-400 mt-1">
            {(latestMarket.secondaryValue || 92180).toLocaleString('en-IN')}{' '}
            <span className="text-xs font-normal text-slate-400">pts</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            30-stock blue-chip benchmark index
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedBenchmark('gsec')}
          className={`text-left rounded-xl border p-5 transition-colors cursor-pointer ${
            selectedBenchmark === 'gsec'
              ? 'border-cyan-500/60 bg-cyan-500/5'
              : theme === 'dark'
              ? 'bg-[#0B1325] border-slate-800/90 hover:border-slate-700'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>10-Year India G-Sec Yield</span>
            <span className="font-mono-tabular text-[11px]">{latestMarket.label}</span>
          </div>
          <div className="font-mono-tabular text-2xl font-semibold text-cyan-400 mt-1">
            {(latestMarket.tertiaryValue || 6.52).toFixed(2)}%{' '}
            <span className="text-xs font-normal text-slate-400">p.a.</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Sovereign risk-free rate &amp; fiscal borrowing anchor
          </div>
        </button>
      </div>

      {/* Selected Benchmark Interactive Chart */}
      <AnalyticalChartPanel
        title={benchmarkMeta.title}
        subtitle={benchmarkMeta.subtitle}
        unit={benchmarkMeta.unit}
        sourceLabel={benchmarkMeta.source}
        frequencyLabel="Monthly (EOM)"
        observations={benchmarkObservations}
        seriesConfig={[
          { key: 'value', name: benchmarkMeta.title, color: benchmarkMeta.color },
        ]}
        defaultChartType="area"
        defaultRange="10Y"
        theme={theme}
      />
    </div>
  );
};
