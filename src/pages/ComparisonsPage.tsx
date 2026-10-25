import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, CheckCircle2, GitCompare } from 'lucide-react';
import { DateRangeFilter, EconomicIndicator } from '../types/economy';
import { RelationshipExplorer } from '../components/dashboard/RelationshipExplorer';
import { alignIndicatorsForComparison } from '../services/economyService';

interface ComparisonsPageProps {
  indicators: EconomicIndicator[];
  initialIndicatorId?: string | null;
  theme: 'dark' | 'light';
}

export const ComparisonsPage: React.FC<ComparisonsPageProps> = ({
  indicators,
  initialIndicatorId,
  theme,
}) => {
  const [ledgerPair, setLedgerPair] = useState<{ a: string; b: string }>(() => ({
    a: initialIndicatorId || 'gdp-growth',
    b: initialIndicatorId === 'cpi-inflation' ? 'rbi-repo-rate' : 'cpi-inflation',
  }));

  useEffect(() => {
    if (initialIndicatorId) {
      setLedgerPair({
        a: initialIndicatorId,
        b: initialIndicatorId === 'cpi-inflation' ? 'rbi-repo-rate' : 'cpi-inflation',
      });
    }
  }, [initialIndicatorId]);

  const indA = useMemo(
    () => indicators.find((i) => i.id === ledgerPair.a) || indicators[0],
    [indicators, ledgerPair.a]
  );
  const indB = useMemo(
    () => indicators.find((i) => i.id === ledgerPair.b) || indicators[1],
    [indicators, ledgerPair.b]
  );

  const aligned = useMemo(
    () => alignIndicatorsForComparison(indA, indB, '5Y' as DateRangeFilter),
    [indA, indB]
  );

  const curatedComparisonPresets = [
    {
      label: 'Monetary Policy vs. Inflation',
      desc: 'RBI Repo Rate (% p.a.) vs. Headline CPI Inflation (% YoY)',
      a: 'rbi-repo-rate',
      b: 'cpi-inflation',
    },
    {
      label: 'Imported Energy vs. Exchange Rate',
      desc: 'Indian Basket Crude (USD/bbl) vs. USD/INR Spot Reference (₹)',
      a: 'crude-oil',
      b: 'usd-inr',
    },
    {
      label: 'Output Growth vs. Labour Market',
      desc: 'Real GDP Growth (% YoY) vs. PLFS Unemployment Rate (%)',
      a: 'gdp-growth',
      b: 'unemployment-rate',
    },
    {
      label: 'Real Economy vs. Equity Benchmark',
      desc: 'Real GDP Growth (% YoY) vs. NIFTY 50 Index (Base-100 Normalized)',
      a: 'gdp-growth',
      b: 'nifty-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-500">
          <GitCompare className="w-3.5 h-3.5" />
          <span>Econometric Comparison Workbench</span>
          <span aria-hidden="true">·</span>
          <span>Unit-Safe Normalization Engine (Sample Data)</span>
        </div>
        <h1
          className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-1 ${
            theme === 'dark' ? 'text-white' : 'text-slate-950'
          }`}
        >
          Economic Indicator Comparisons
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Compare any two Indian macroeconomic series across historical timeframes using Base-100 indexing, cumulative percentage changes, or dual-scale axes while preventing misleading unit distortions.
        </p>
      </div>

      {/* Interactive Relationship Explorer Workbench */}
      <RelationshipExplorer
        indicators={indicators}
        defaultIndicatorAId={ledgerPair.a}
        defaultIndicatorBId={ledgerPair.b}
        onPairChange={(a, b) => setLedgerPair({ a, b })}
        theme={theme}
      />

      {/* Normalization Methodology & Unit Compatibility Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Normalization Formulas (6 cols) */}
        <div
          className={`lg:col-span-6 rounded-xl border p-5 sm:p-6 space-y-4 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-amber-400 font-mono-tabular">
            <Calculator className="w-4 h-4" />
            <span>Normalization Methodology</span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold">
            How ArthNiti Normalizes Incompatible Units
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Plotting NIFTY 50 (<strong className="font-mono-tabular">~28,240 Index Points</strong>) and Real GDP Growth (<strong className="font-mono-tabular">7.1% YoY</strong>) on a single raw vertical axis would flatten GDP into an unreadable horizontal line. ArthNiti solves this using three transparent mathematical transformations:
          </p>

          <div className="space-y-3 text-xs">
            <div
              className={`p-3.5 rounded-lg border ${
                theme === 'dark' ? 'bg-[#060B16] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="font-semibold text-emerald-400 mb-1">
                1. Base-100 Indexing (Default for Cross-Unit Series)
              </div>
              <p className="text-slate-400 leading-relaxed">
                Sets the initial observation in the selected date window to <code className="font-mono-tabular">100.0</code> for both series:
              </p>
              <div className="mt-1.5 font-mono-tabular text-[11px] text-slate-300">
                Index(t) = 100 + ((Value(t) − Value(t₀)) / |Value(t₀)|) × 100
              </div>
            </div>

            <div
              className={`p-3.5 rounded-lg border ${
                theme === 'dark' ? 'bg-[#060B16] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="font-semibold text-amber-400 mb-1">
                2. Cumulative Percentage Change (% Δ)
              </div>
              <p className="text-slate-400 leading-relaxed">
                Measures relative proportional change from the start of the chosen historical period (<code className="font-mono-tabular">0.0%</code> baseline), allowing volatility and elasticity comparisons.
              </p>
            </div>

            <div
              className={`p-3.5 rounded-lg border ${
                theme === 'dark' ? 'bg-[#060B16] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="font-semibold text-cyan-400 mb-1">
                3. Native Shared Axis vs. Dual-Scale Axis Guard
              </div>
              <p className="text-slate-400 leading-relaxed">
                When two indicators share compatible native units (e.g., <strong className="font-mono-tabular">CPI Inflation %</strong> and <strong className="font-mono-tabular">RBI Repo Rate %</strong>), they can be inspected on a shared percentage scale. When units differ, ArthNiti automatically separates Left and Right axes and displays an explicit scale warning.
              </p>
            </div>
          </div>
        </div>

        {/* Curated Macroeconomic Comparison Pairs & Aligned Data Table (6 cols) */}
        <div
          className={`lg:col-span-6 rounded-xl border p-5 sm:p-6 flex flex-col justify-between space-y-5 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono-tabular">
              <CheckCircle2 className="w-4 h-4" />
              <span>Benchmark Analytical Pairings</span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold mt-1">
              Curated Macroeconomic Relationships
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a canonical pairing below to load its aligned 5-year observation table:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
              {curatedComparisonPresets.map((preset) => {
                const isSelected =
                  ledgerPair.a === preset.a && ledgerPair.b === preset.b;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setLedgerPair({ a: preset.a, b: preset.b })}
                    className={`text-left p-3 rounded-lg border text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500/60 bg-emerald-500/10'
                        : theme === 'dark'
                        ? 'bg-[#060B16] border-slate-800 hover:border-slate-700'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-semibold text-emerald-400">{preset.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                      {preset.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aligned Recent Observations Ledger */}
          <div className="overflow-x-auto">
            <div className="text-xs font-semibold mb-2">
              Aligned Observation Ledger: {indA.shortName} vs. {indB.shortName}
            </div>
            <table className="w-full text-left border-collapse text-xs font-mono-tabular">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="py-2 pr-3">Period</th>
                  <th className="py-2 px-2 text-right text-emerald-400">{indA.shortName}</th>
                  <th className="py-2 px-2 text-right text-amber-400">{indB.shortName}</th>
                  <th className="py-2 pl-2 text-right">Base-100 Spread</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {aligned.points.slice(-6).map((pt) => (
                  <tr key={pt.periodKey}>
                    <td className="py-2 pr-3 font-medium">{pt.label}</td>
                    <td className="py-2 px-2 text-right">
                      {pt.rawA} {indA.unit}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {pt.rawB} {indB.unit}
                    </td>
                    <td className="py-2 pl-2 text-right text-cyan-400">
                      {(pt.indexedA - pt.indexedB).toFixed(1)} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
