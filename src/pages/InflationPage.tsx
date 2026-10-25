import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertCircle, BookOpen, Layers, Scale } from 'lucide-react';
import { EconomicIndicator } from '../types/economy';
import { AnalyticalChartPanel } from '../components/charts/AnalyticalChartPanel';

interface InflationPageProps {
  indicator: EconomicIndicator;
  theme: 'dark' | 'light';
}

export const InflationPage: React.FC<InflationPageProps> = ({ indicator, theme }) => {
  const latest = indicator.observations[indicator.observations.length - 1];

  // Build cumulative Consumer Price Level Index series (Base 2016 = 100) to illustrate Inflation Rate vs Price Level
  const cumulativePriceLevelSeries = useMemo(() => {
    let priceIndex = 130.0; // Illustrative CPI index level in early 2017 (Base 2012 = 100)
    return indicator.observations.map((obs) => {
      // Quarterly step compounding from annual YoY rate
      const stepFactor = 1 + (obs.value / 100) * 0.25;
      priceIndex = Number((priceIndex * stepFactor).toFixed(1));
      return {
        label: obs.label,
        inflationRate: obs.value,
        priceLevelIndex: priceIndex,
      };
    });
  }, [indicator.observations]);

  const basketWeights = [
    { group: 'Food & Beverages', weight: 45.86, latestYoY: latest.tertiaryValue || 5.4, color: 'bg-amber-500' },
    { group: 'Miscellaneous (Health, Education, Transport)', weight: 28.32, latestYoY: 3.8, color: 'bg-emerald-500' },
    { group: 'Housing (Urban Rentals & Maintenance)', weight: 10.07, latestYoY: 3.4, color: 'bg-cyan-500' },
    { group: 'Fuel & Light', weight: 6.84, latestYoY: 2.1, color: 'bg-blue-500' },
    { group: 'Clothing & Footwear', weight: 6.53, latestYoY: 3.5, color: 'bg-indigo-500' },
    { group: 'Pan, Tobacco & Intoxicants', weight: 2.38, latestYoY: 4.1, color: 'bg-slate-500' },
  ];

  const gridStroke = theme === 'dark' ? '#1e293b' : '#e2e8f0';
  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-400">
          <span>Consumer Price Index (Combined)</span>
          <span aria-hidden="true">·</span>
          <span>MoSPI (NSO)</span>
          <span aria-hidden="true">·</span>
          <span>Base Year: 2012 = 100</span>
        </div>
        <h1
          className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-1 ${
            theme === 'dark' ? 'text-white' : 'text-slate-950'
          }`}
        >
          CPI Inflation &amp; Price Stability
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Track Headline CPI, Core CPI (excluding food &amp; fuel), and Consumer Food Price Inflation (CFPI) against the Reserve Bank of India&apos;s statutory 4.0% (±2%) flexible inflation targeting mandate.
        </p>
      </div>

      {/* Headline Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={`rounded-xl border p-5 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs text-slate-400">Headline CPI Combined ({latest.label})</div>
          <div className="font-mono-tabular text-2xl font-semibold text-emerald-400 mt-1">
            {latest.value.toFixed(2)}% YoY
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Inside RBI 2.0% – 6.0% tolerance band
          </div>
        </div>

        <div
          className={`rounded-xl border p-5 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs text-slate-400">Core CPI (Ex-Food &amp; Fuel)</div>
          <div className="font-mono-tabular text-2xl font-semibold text-cyan-400 mt-1">
            {(latest.secondaryValue || 3.7).toFixed(2)}% YoY
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Measures underlying demand-side price stickiness
          </div>
        </div>

        <div
          className={`rounded-xl border p-5 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs text-slate-400">Consumer Food Price Index (CFPI)</div>
          <div className="font-mono-tabular text-2xl font-semibold text-amber-400 mt-1">
            {(latest.tertiaryValue || 5.4).toFixed(2)}% YoY
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Sensitive to monsoon distribution &amp; supply chains
          </div>
        </div>
      </div>

      {/* Main Interactive Multi-Series CPI Chart */}
      <AnalyticalChartPanel
        title="Headline CPI, Core CPI & Food Inflation vs. RBI Target Band"
        subtitle="Year-over-year percentage change across Combined (Rural + Urban) consumer baskets"
        unit="% YoY"
        sourceLabel="MoSPI (NSO)"
        frequencyLabel="Monthly"
        observations={indicator.observations}
        seriesConfig={[
          { key: 'value', name: 'Headline CPI (% YoY)', color: '#10b981' },
          { key: 'secondaryValue', name: 'Core CPI (% YoY)', color: '#06b6d4' },
          { key: 'tertiaryValue', name: 'Food Inflation CFPI (% YoY)', color: '#f59e0b' },
        ]}
        defaultChartType="line"
        defaultRange="10Y"
        referenceBand={{
          y1: 2.0,
          y2: 6.0,
          label: 'RBI 2.0%–6.0% Tolerance Band',
        }}
        zeroReferenceLine
        theme={theme}
      />

      {/* Inflation Rate vs. Price Level Explanation & Basket Weights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Disinflation vs Deflation (Inflation Rate vs Price Level) Interactive Visual (7 cols) */}
        <div
          className={`lg:col-span-7 rounded-xl border p-5 sm:p-6 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-amber-400 font-mono-tabular">
            <Scale className="w-4 h-4" />
            <span>Critical Economic Distinction · Rate of Change vs. Absolute Price Level</span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold mt-1">
            Why Falling Inflation Does Not Mean Falling Prices
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            A common public misconception is that when CPI inflation falls from <strong className="font-mono-tabular">7.4%</strong> to <strong className="font-mono-tabular">4.4%</strong>, everyday goods become cheaper. In reality, <strong>disinflation</strong> means the cumulative price level continues to rise—just at a slower pace. Only negative inflation (<strong>deflation</strong>, below 0%) reduces the absolute price level.
          </p>

          <div className="h-[230px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativePriceLevelSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceLevelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: tickColor, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: gridStroke }}
                  minTickGap={28}
                />
                <YAxis
                  tick={{ fill: '#f59e0b', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  domain={['dataMin - 5', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#060B16' : '#ffffff',
                    borderColor: '#334155',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="priceLevelIndex"
                  name="Cumulative CPI Basket Index (Base 2012 = 100)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#priceLevelGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-400">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Notice how the cumulative CPI Index (Base 2012 = 100) rises steadily from ~131 in 2017 to ~212 in 2026 even as YoY inflation moderates.
            </span>
          </div>
        </div>

        {/* CPI Basket Weights Breakdown (5 cols) */}
        <div
          className={`lg:col-span-5 rounded-xl border p-5 sm:p-6 flex flex-col justify-between ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono-tabular">
              <Layers className="w-4 h-4" />
              <span>MoSPI All-India Combined Weights</span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold mt-1">
              CPI Consumption Basket Architecture
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Food and Beverages account for nearly 46% of India&apos;s headline CPI basket, explaining why agricultural supply shocks dominate monetary policy debates.
            </p>

            <div className="mt-4 space-y-3">
              {basketWeights.map((item) => (
                <div key={item.group} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium truncate pr-2">{item.group}</span>
                    <div className="font-mono-tabular shrink-0 flex items-center gap-3">
                      <span className="text-slate-400">Wt: {item.weight}%</span>
                      <span className="text-emerald-400">{item.latestYoY}% YoY</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${item.weight * 2}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`mt-5 pt-3.5 border-t text-xs text-slate-400 ${
              theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-slate-200 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>RBI Flexible Inflation Targeting Framework</span>
            </div>
            <p className="leading-relaxed">
              Under Section 45ZA of the RBI Act, the statutory inflation target is 4.0% Headline CPI with an upper tolerance limit of 6.0% and lower limit of 2.0%. Breaching 6.0% or 2.0% for three consecutive quarters constitutes a formal mandate failure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
