import React, { useMemo, useState } from 'react';
import { BookOpen, Calculator, Layers, TrendingUp } from 'lucide-react';
import { EconomicIndicator, ObservationPoint, SectorGvaShare } from '../types/economy';
import { AnalyticalChartPanel } from '../components/charts/AnalyticalChartPanel';

interface GdpGrowthPageProps {
  indicator: EconomicIndicator;
  sectorGva: SectorGvaShare[];
  theme: 'dark' | 'light';
}

export const GdpGrowthPage: React.FC<GdpGrowthPageProps> = ({
  indicator,
  sectorGva,
  theme,
}) => {
  const [cadenceView, setCadenceView] = useState<'Quarterly' | 'Annual'>('Quarterly');

  // Compute Annual fiscal-year summary observations from quarterly series when 'Annual' is selected
  const displayedObservations: ObservationPoint[] = useMemo(() => {
    if (cadenceView === 'Quarterly') {
      return indicator.observations;
    }

    const byYear = new Map<number, { realVals: number[]; nomVals: number[] }>();
    indicator.observations.forEach((obs) => {
      const year = parseInt(obs.date.split('-')[0], 10);
      const curr = byYear.get(year) || { realVals: [], nomVals: [] };
      curr.realVals.push(obs.value);
      if (obs.secondaryValue !== undefined) curr.nomVals.push(obs.secondaryValue);
      byYear.set(year, curr);
    });

    const annualObs: ObservationPoint[] = [];
    Array.from(byYear.entries()).forEach(([year, group]) => {
      const avgReal = Number(
        (group.realVals.reduce((a, b) => a + b, 0) / group.realVals.length).toFixed(2)
      );
      const avgNom = Number(
        (group.nomVals.reduce((a, b) => a + b, 0) / (group.nomVals.length || 1)).toFixed(2)
      );
      annualObs.push({
        date: `FY-${year}`,
        timestamp: new Date(year, 11, 31).getTime(),
        label: `CY ${year}`,
        value: avgReal,
        secondaryValue: avgNom,
        status: year === 2026 ? 'Provisional' : 'Final',
        note: `Annualized average across ${group.realVals.length} quarters in ${year}`,
      });
    });

    return annualObs;
  }, [cadenceView, indicator.observations]);

  const latestObs = indicator.observations[indicator.observations.length - 1];
  const implicitDeflator = Number(
    ((latestObs.secondaryValue || 10.6) - latestObs.value).toFixed(2)
  );

  return (
    <div className="space-y-8">
      {/* Page Header & Cadence Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-400">
            <span>National Accounts Statistics (NAS)</span>
            <span aria-hidden="true">·</span>
            <span>MoSPI (NSO)</span>
            <span aria-hidden="true">·</span>
            <span>Base Year: 2011–12</span>
          </div>
          <h1
            className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-1 ${
              theme === 'dark' ? 'text-white' : 'text-slate-950'
            }`}
          >
            GDP &amp; National Output Growth
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Analyze India&apos;s Gross Domestic Product at constant (Real) and current (Nominal) market prices, sectoral Gross Value Added (GVA) drivers, and the implicit price deflator.
          </p>
        </div>

        {/* Quarterly vs Annual View Toggle */}
        <div
          className={`flex items-center p-1 rounded-lg border self-start md:self-auto ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
          role="group"
          aria-label="Select Quarterly or Annual aggregation"
        >
          {(['Quarterly', 'Annual'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setCadenceView(mode)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                cadenceView === mode
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode} View
            </button>
          ))}
        </div>
      </div>

      {/* Headline Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={`rounded-xl border p-5 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs text-slate-400">Real GDP Growth ({latestObs.label})</div>
          <div className="font-mono-tabular text-2xl font-semibold text-emerald-400 mt-1">
            {latestObs.value.toFixed(1)}% YoY
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Constant 2011–12 market prices (inflation-adjusted)
          </div>
        </div>

        <div
          className={`rounded-xl border p-5 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs text-slate-400">Nominal GDP Growth ({latestObs.label})</div>
          <div className="font-mono-tabular text-2xl font-semibold text-amber-400 mt-1">
            {(latestObs.secondaryValue || 10.6).toFixed(1)}% YoY
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Current market prices (used for tax buoyancy &amp; debt/GDP)
          </div>
        </div>

        <div
          className={`rounded-xl border p-5 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs text-slate-400">Implicit GDP Deflator Wedge</div>
          <div className="font-mono-tabular text-2xl font-semibold text-cyan-400 mt-1">
            +{implicitDeflator}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Spread between Nominal and Real growth rates
          </div>
        </div>
      </div>

      {/* Primary Interactive Chart */}
      <AnalyticalChartPanel
        title={`India Real vs. Nominal GDP Growth (${cadenceView} View)`}
        subtitle="Comparison of constant-price volume expansion against current-price nominal value growth"
        unit="% YoY"
        sourceLabel="MoSPI (National Statistical Office)"
        frequencyLabel={cadenceView}
        observations={displayedObservations}
        seriesConfig={[
          { key: 'value', name: 'Real GDP Growth (% YoY)', color: '#10b981' },
          { key: 'secondaryValue', name: 'Nominal GDP Growth (% YoY)', color: '#f59e0b' },
        ]}
        defaultChartType={cadenceView === 'Annual' ? 'bar' : 'area'}
        defaultRange="10Y"
        zeroReferenceLine
        theme={theme}
      />

      {/* Real vs. Nominal GDP Explanation & Sectoral GVA Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sectoral GVA Breakdown (7 cols) */}
        <div
          className={`lg:col-span-7 rounded-xl border p-5 sm:p-6 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono-tabular">
            <Layers className="w-4 h-4" />
            <span>Production Approach · Gross Value Added (GVA)</span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold mt-1">
            Sectoral GVA Composition &amp; Growth Drivers
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            GVA measures output at basic prices across primary, secondary, and tertiary sectors before product taxes and subsidies.
          </p>

          <div className="mt-5 space-y-4">
            {sectorGva.map((sec) => (
              <div
                key={sec.sector}
                className={`p-3.5 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-[#060B16]/70 border-slate-800/90'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-semibold">{sec.sector}</span>
                  <div className="flex items-center gap-3 font-mono-tabular text-xs">
                    <span className="text-slate-400">Share: {sec.sharePercent}%</span>
                    <span className="text-emerald-400 font-semibold">
                      +{sec.growthRateYoY}% YoY
                    </span>
                    <span className="text-amber-400">₹{sec.realTrillionInr}T</span>
                  </div>
                </div>

                {/* Progress bar of GVA share */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${sec.sharePercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  {sec.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Real vs. Nominal GDP & Methodology Explainer (5 cols) */}
        <div
          className={`lg:col-span-5 rounded-xl border p-5 sm:p-6 flex flex-col justify-between space-y-5 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono-tabular">
              <Calculator className="w-4 h-4" />
              <span>Economic Concepts &amp; Identities</span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold">
              Understanding Real vs. Nominal GDP &amp; GVA
            </h2>

            <div className="space-y-3 text-xs leading-relaxed text-slate-400">
              <div
                className={`p-3 rounded-lg border ${
                  theme === 'dark' ? 'bg-[#060B16] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="font-semibold text-emerald-400 mb-1">
                  1. Real GDP (Constant 2011–12 Prices)
                </div>
                <p>
                  Strips out price inflation to measure true physical volume growth of goods and services produced. Used to evaluate living standards and real capacity expansion.
                </p>
              </div>

              <div
                className={`p-3 rounded-lg border ${
                  theme === 'dark' ? 'bg-[#060B16] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="font-semibold text-amber-400 mb-1">
                  2. Nominal GDP (Current Market Prices)
                </div>
                <p>
                  Measured at prevailing market prices without inflation adjustment. Critical for Union Budget fiscal deficit ratios, sovereign debt sustainability, and corporate revenue growth.
                </p>
              </div>

              <div
                className={`p-3 rounded-lg border ${
                  theme === 'dark' ? 'bg-[#060B16] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="font-semibold text-cyan-400 mb-1">
                  3. Relationship Between GDP and GVA
                </div>
                <p className="font-mono-tabular text-[11px]">
                  GDP = ∑ Sectoral GVA at Basic Prices + (Product Taxes − Product Subsidies)
                </p>
              </div>
            </div>
          </div>

          <div
            className={`pt-4 border-t text-xs text-slate-400 ${
              theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-slate-200 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>MoSPI Methodology Note</span>
            </div>
            <p className="leading-relaxed">{indicator.methodologyNote}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
