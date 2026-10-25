import React from 'react';
import { ArrowRight, Droplets, Globe2, Layers, ShieldAlert } from 'lucide-react';
import { EconomicIndicator } from '../types/economy';
import { AnalyticalChartPanel } from '../components/charts/AnalyticalChartPanel';
import { RelationshipExplorer } from '../components/dashboard/RelationshipExplorer';

interface CurrencyOilPageProps {
  inrIndicator: EconomicIndicator;
  crudeIndicator: EconomicIndicator;
  allIndicators: EconomicIndicator[];
  theme: 'dark' | 'light';
}

export const CurrencyOilPage: React.FC<CurrencyOilPageProps> = ({
  inrIndicator,
  crudeIndicator,
  allIndicators,
  theme,
}) => {
  const transmissionSteps = [
    {
      step: '01. External Energy Price Shock',
      title: 'Indian Basket Crude Oil Rises ($/bbl)',
      detail:
        'Because domestic refineries import >85% of crude requirements, a $10/bbl increase immediately raises dollar demand from Oil Marketing Companies (OMCs) in the interbank FX market.',
      accent: 'text-amber-400',
    },
    {
      step: '02. Trade Balance & CAD Widening',
      title: 'Merchandise Trade Deficit Expands',
      detail:
        'Higher landed petroleum import bills widen the Current Account Deficit (CAD) by roughly 35–40 bps of GDP per $10/bbl sustained move, increasing net external financing needs.',
      accent: 'text-cyan-400',
    },
    {
      step: '03. Exchange Rate & FX Reserve Buffer',
      title: 'USD/INR Depreciation Pressure & RBI Intervention',
      detail:
        'Heightened importer USD demand puts upward pressure on USD/INR (Rupee depreciation). The RBI may deploy spot/forward FX reserves to curb disorderly volatility without targeting a fixed level.',
      accent: 'text-emerald-400',
    },
    {
      step: '04. Domestic Pass-Through & Fiscal Split',
      title: 'WPI/CPI Transport Pass-Through vs. Excise Absorption',
      detail:
        'Higher INR-landed crude costs pass through into aviation turbine fuel, industrial inputs, and freight logistics—or are partially absorbed via central excise duty adjustments and OMC margins.',
      accent: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-400">
          <span>External Sector &amp; Energy Macro</span>
          <span aria-hidden="true">·</span>
          <span>RBI / FBIL &amp; PPAC (MoPNG)</span>
        </div>
        <h1
          className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-1 ${
            theme === 'dark' ? 'text-white' : 'text-slate-950'
          }`}
        >
          INR Exchange Rate &amp; Crude Oil Dynamics
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Inspect the USD/INR exchange rate, the 40-Currency Real Effective Exchange Rate (REER), Indian Basket Crude Oil prices, and the macroeconomic transmission channels linking energy imports to currency stability.
        </p>
      </div>

      {/* Dual Chart Grid: USD/INR and Crude Oil */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnalyticalChartPanel
          title="USD / INR Exchange Rate (2017–2026)"
          subtitle="Monthly average reference rate (₹ per 1 USD). Higher values denote nominal Rupee depreciation."
          unit="₹ / USD"
          sourceLabel="RBI / FBIL"
          frequencyLabel="Monthly"
          observations={inrIndicator.observations}
          seriesConfig={[
            { key: 'value', name: 'USD / INR Spot Reference (₹)', color: '#10b981' },
          ]}
          defaultChartType="area"
          defaultRange="10Y"
          theme={theme}
        />

        <AnalyticalChartPanel
          title="Indian Basket Crude Oil Price (2017–2026)"
          subtitle="Weighted average of Oman/Dubai Sour and Brent Sweet crude landed cost in USD per barrel"
          unit="USD / bbl"
          sourceLabel="PPAC · Ministry of Petroleum"
          frequencyLabel="Monthly"
          observations={crudeIndicator.observations}
          seriesConfig={[
            { key: 'value', name: 'Indian Basket Crude (USD/bbl)', color: '#f59e0b' },
          ]}
          defaultChartType="area"
          defaultRange="10Y"
          theme={theme}
        />
      </div>

      {/* Educational Transmission Channels Section */}
      <section
        className={`rounded-xl border p-5 sm:p-6 ${
          theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono-tabular">
              <Droplets className="w-4 h-4" />
              <span>Macroeconomic Transmission Mechanism</span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold mt-0.5">
              How Global Crude Oil &amp; Dollar Cycles Transmit to India&apos;s Economy
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono-tabular">
            Structural Balance-of-Payments Channels
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
          {transmissionSteps.map((item, idx) => (
            <div
              key={item.step}
              className={`relative p-4 rounded-xl border flex flex-col justify-between ${
                theme === 'dark'
                  ? 'bg-[#060B16]/80 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <div className={`text-[11px] font-mono-tabular font-semibold ${item.accent}`}>
                  {item.step}
                </div>
                <h3 className="text-sm font-semibold mt-1">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.detail}</p>
              </div>

              {idx < transmissionSteps.length - 1 && (
                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-end text-[11px] text-slate-400">
                  <span>Transmits to Stage {idx + 2}</span>
                  <ArrowRight className="w-3 h-3 ml-1 text-emerald-400" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Nuance Note on Services & Remittances Cushion */}
        <div
          className={`mt-5 p-3.5 rounded-lg border flex items-start gap-2.5 text-xs ${
            theme === 'dark'
              ? 'bg-emerald-950/15 border-emerald-500/30 text-slate-300'
              : 'bg-emerald-50 border-emerald-200 text-slate-800'
          }`}
        >
          <Globe2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-emerald-400">
              Structural Offset — Services Exports &amp; Remittances:
            </strong>{' '}
            While crude oil dominates India&apos;s merchandise import bill, strong net software/GCC services exports and inward diaspora remittances frequently offset a substantial portion of the petroleum trade deficit, moderating net Current Account Deficit (CAD) stress.
          </div>
        </div>
      </section>

      {/* Direct Interactive Comparison of USD/INR vs. Crude Oil */}
      <RelationshipExplorer
        indicators={allIndicators}
        defaultIndicatorAId="usd-inr"
        defaultIndicatorBId="crude-oil"
        theme={theme}
        compact
      />
    </div>
  );
};
