import React, { useState } from 'react';
import { Clock, Landmark, ShieldAlert, TrendingUp } from 'lucide-react';
import { EconomicIndicator } from '../types/economy';
import { AnalyticalChartPanel } from '../components/charts/AnalyticalChartPanel';

interface FinancialMarketsPageProps {
  marketIndicator: EconomicIndicator;
  repoIndicator: EconomicIndicator;
  theme: 'dark' | 'light';
}

export const FinancialMarketsPage: React.FC<FinancialMarketsPageProps> = ({
  marketIndicator,
  repoIndicator,
  theme,
}) => {
  const [selectedBenchmark, setSelectedBenchmark] = useState<'nifty' | 'sensex' | 'gsec'>('nifty');
  const latest = marketIndicator.observations[marketIndicator.observations.length - 1];

  // Transform observations so the selected benchmark is plotted on the primary 'value' key
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
      {/* Explicit Delayed / Archival Data Disclosure Banner (No Fabricated Live Quotes) */}
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
            <span className="font-semibold">Historical End-of-Month Settlement Data Notice: </span>
            <span>
              All market indices and sovereign bond yields displayed on ArthNiti are delayed, end-of-month illustrative archival settlements for macroeconomic research—not live trading quotes or financial advice.
            </span>
          </div>
        </div>
        <span className="font-mono-tabular text-[11px] text-amber-400 shrink-0">
          EOM Archival Series · Non-Live
        </span>
      </div>

      {/* Header & Benchmark Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-400">
            <span>Capital Markets &amp; Sovereign Yield Curve</span>
            <span aria-hidden="true">·</span>
            <span>NSE · BSE · CCIL</span>
          </div>
          <h1
            className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-1 ${
              theme === 'dark' ? 'text-white' : 'text-slate-950'
            }`}
          >
            Financial Markets &amp; Sovereign Yields
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Examine long-term capital formation across Indian equity benchmarks (NIFTY 50, BSE SENSEX) and the 10-Year Government Security (G-Sec) sovereign borrowing yield.
          </p>
        </div>

        {/* Benchmark Selector Tabs */}
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

      {/* 3 Market Benchmark Cards */}
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
            <span className="font-mono-tabular text-[11px]">{latest.label}</span>
          </div>
          <div className="font-mono-tabular text-2xl font-semibold text-emerald-400 mt-1">
            {latest.value.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">pts</span>
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
            <span className="font-mono-tabular text-[11px]">{latest.label}</span>
          </div>
          <div className="font-mono-tabular text-2xl font-semibold text-amber-400 mt-1">
            {(latest.secondaryValue || 92180).toLocaleString('en-IN')}{' '}
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
            <span className="font-mono-tabular text-[11px]">{latest.label}</span>
          </div>
          <div className="font-mono-tabular text-2xl font-semibold text-cyan-400 mt-1">
            {(latest.tertiaryValue || 6.52).toFixed(2)}%{' '}
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

      {/* Monetary Policy Corridor Chart (RBI Repo, SDF, MSF) */}
      <AnalyticalChartPanel
        title="RBI Monetary Policy Rate Corridor (Repo, SDF & MSF)"
        subtitle="The interest rate corridor governing overnight banking liquidity and money-market pricing"
        unit="% p.a."
        sourceLabel="Reserve Bank of India (MPC)"
        frequencyLabel="Monthly"
        observations={repoIndicator.observations}
        seriesConfig={[
          { key: 'value', name: 'Policy Repo Rate (%)', color: '#10b981' },
          { key: 'secondaryValue', name: 'Standing Deposit Facility / Reverse Repo (%)', color: '#06b6d4' },
          { key: 'tertiaryValue', name: 'Marginal Standing Facility MSF (%)', color: '#f59e0b' },
        ]}
        defaultChartType="line"
        defaultRange="10Y"
        theme={theme}
      />
    </div>
  );
};
