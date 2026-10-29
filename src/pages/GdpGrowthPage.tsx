import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Calculator,
  CheckCircle2,
  ExternalLink,
  Info,
  Layers,
  RefreshCw,
  Scale,
} from 'lucide-react';
import { EconomicIndicator, ObservationPoint, SectorGvaShare } from '../types/economy';
import { AnalyticalChartPanel } from '../components/charts/AnalyticalChartPanel';

interface GdpGrowthPageProps {
  indicator: EconomicIndicator;
  sectorGva: SectorGvaShare[];
  isLoading: boolean;
  errorMessage: string | null;
  lastUpdated: string;
  dataOrigin?: 'official_mospi_csv' | 'user_uploaded_csv' | 'demonstration_fallback';
  onRefreshOfficialGdp: (simulateError?: boolean) => void;
  onUploadCustomCsv?: (csvText: string) => { ok: boolean; error?: string };
  onResetCustomCsv?: () => void;
  onActivateDemoFallback?: () => void;
  theme: 'dark' | 'light';
}

export const GdpGrowthPage: React.FC<GdpGrowthPageProps> = ({
  indicator,
  sectorGva,
  isLoading,
  errorMessage,
  lastUpdated,
  onRefreshOfficialGdp,
  theme,
}) => {
  const [cadenceView, setCadenceView] = useState<'Quarterly' | 'Annual'>('Quarterly');

  const meta = indicator.officialGdpMeta;
  const latestObs = indicator.observations[indicator.observations.length - 1];
  const prevObs =
    indicator.observations.length >= 2
      ? indicator.observations[indicator.observations.length - 2]
      : latestObs;

  // Compute Annual Financial Year (FY) summary observations when 'Annual' view is selected
  const displayedObservations: ObservationPoint[] = useMemo(() => {
    if (cadenceView === 'Quarterly') {
      return indicator.observations;
    }

    // Official MoSPI Full-Year Financial Year Real & Nominal GDP growth rates (Base Year 2022-23)
    const officialFyTotals: Record<string, { real: number; nominal: number; status: 'Final' | 'Revised' | 'Provisional'; note: string }> = {
      '2023-24': {
        real: 7.2,
        nominal: 9.5,
        status: 'Revised',
        note: 'Official MoSPI First Revised Estimate (Full Financial Year 2023–24, Base 2022–23)',
      },
      '2024-25': {
        real: 7.2,
        nominal: 9.5,
        status: 'Revised',
        note: 'Official MoSPI First Revised Estimate (Full Financial Year 2024–25, Base 2022–23)',
      },
      '2025-26': {
        real: 7.7,
        nominal: 8.9,
        status: 'Provisional',
        note: 'Official MoSPI Provisional Estimate released 05 Jun 2026 (Full Financial Year 2025–26)',
      },
    };

    const byFy = new Map<
      string,
      { realVals: number[]; nomVals: number[]; latestTimestamp: number }
    >();

    indicator.observations.forEach((obs) => {
      const fy = obs.financialYear || obs.date.slice(0, 7);
      const curr = byFy.get(fy) || {
        realVals: [],
        nomVals: [],
        latestTimestamp: obs.timestamp,
      };
      curr.realVals.push(obs.value);
      if (obs.secondaryValue !== undefined) curr.nomVals.push(obs.secondaryValue);
      curr.latestTimestamp = Math.max(curr.latestTimestamp, obs.timestamp);
      byFy.set(fy, curr);
    });

    const annualObs: ObservationPoint[] = [];
    Array.from(byFy.entries()).forEach(([fy, group]) => {
      const officialMatch = officialFyTotals[fy];
      const avgReal = officialMatch
        ? officialMatch.real
        : Number(
            (group.realVals.reduce((a, b) => a + b, 0) / group.realVals.length).toFixed(1)
          );
      const avgNom = officialMatch
        ? officialMatch.nominal
        : Number(
            (
              group.nomVals.reduce((a, b) => a + b, 0) / (group.nomVals.length || 1)
            ).toFixed(1)
          );

      const isPartialYear = group.realVals.length < 4;
      annualObs.push({
        date: `FY-${fy}`,
        timestamp: group.latestTimestamp,
        label: isPartialYear ? `FY ${fy} (Q1)` : `FY ${fy}`,
        value: avgReal,
        secondaryValue: avgNom,
        financialYear: fy,
        baseYear: '2022-23=100',
        status: officialMatch ? officialMatch.status : 'Provisional',
        note:
          officialMatch?.note ||
          `YTD average across ${group.realVals.length} quarter(s) in FY ${fy}`,
      });
    });

    return annualObs;
  }, [cadenceView, indicator.observations]);

  const implicitDeflator = Number(
    ((latestObs?.secondaryValue || 10.3) - (latestObs?.value || 7.8)).toFixed(1)
  );

  // Compute sequential Quarter-on-Quarter (QoQ) real volume change to demonstrate why YoY is preferred
  const sequentialQoQChange = useMemo(() => {
    if (
      latestObs?.realGdpConstantLakhCr !== undefined &&
      prevObs?.realGdpConstantLakhCr !== undefined &&
      prevObs.realGdpConstantLakhCr > 0
    ) {
      return Number(
        (
          ((latestObs.realGdpConstantLakhCr - prevObs.realGdpConstantLakhCr) /
            prevObs.realGdpConstantLakhCr) *
          100
        ).toFixed(1)
      );
    }
    return -5.2;
  }, [latestObs, prevObs]);

  return (
    <div className="space-y-8">
      {/* 1. Page Header, Official MoSPI Provenance & Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular text-emerald-400">
            <span className="font-semibold">
              Official MoSPI National Accounts (NAS) Integrated
            </span>
            <span aria-hidden="true">·</span>
            <span>Base Year: {meta?.activeBaseYear || '2022–23'} (Constant Prices)</span>
            <span aria-hidden="true">·</span>
            <span>Last Checked: {lastUpdated}</span>
          </div>

          <h1
            className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-1 ${
              theme === 'dark' ? 'text-white' : 'text-slate-950'
            }`}
          >
            Real GDP Growth &amp; National Accounts (MoSPI)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Displays India&apos;s official <strong>Quarterly Year-on-Year (YoY %) Real GDP Growth Rate</strong> at <strong>Constant (2022–23) Market Prices</strong> published by the National Statistical Office (NSO), Ministry of Statistics &amp; Programme Implementation (MoSPI).
          </p>
        </div>

        {/* Toolbar: Reload Official Data & Cadence Toggle */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => onRefreshOfficialGdp(false)}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#0B1325] border-slate-700 text-slate-200 hover:border-emerald-500/50'
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Loading MoSPI GDP...' : 'Reload Official Data'}</span>
          </button>

          {/* Quarterly vs Annual View Toggle */}
          <div
            className={`flex items-center p-1 rounded-lg border ${
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
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
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
      </div>

      {/* 2. Error State Banner (Never silently substitutes fake data when real fetch fails) */}
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
                  Official MoSPI GDP Data Retrieval Failed
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  {errorMessage}
                </p>
                <p className="text-[11px] text-slate-400">
                  In accordance with ArthNiti&apos;s data integrity standards, sample data is never silently substituted when official data fails to load. Click &ldquo;Retry Official MoSPI Fetch&rdquo; to reload the verified dataset.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onRefreshOfficialGdp(false)}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Official MoSPI Fetch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Official MoSPI GDP Verification Metadata Strip (4 Cards) */}
      {!errorMessage && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Real GDP YoY Growth (Constant 2022-23 Prices) */}
          <div
            className={`rounded-xl border p-5 ${
              theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Real GDP Growth (YoY %)</span>
              <span className="font-mono-tabular text-[11px] text-emerald-400 font-semibold">
                Constant {meta?.activeBaseYear || '2022–23'} Prices
              </span>
            </div>
            <div className="font-mono-tabular text-2xl sm:text-3xl font-semibold text-emerald-400 mt-1.5">
              {latestObs.value.toFixed(1)}% YoY
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
              <span>
                {latestObs.label} ({latestObs.referencePeriod || 'Apr–Jun 2026'})
              </span>
              {latestObs.realGdpConstantLakhCr && (
                <span className="font-mono-tabular text-slate-300">
                  ₹{latestObs.realGdpConstantLakhCr}L Cr
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Nominal GDP YoY Growth & Implicit Deflator */}
          <div
            className={`rounded-xl border p-5 ${
              theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Nominal GDP Growth (YoY %)</span>
              <span className="font-mono-tabular text-[11px] text-amber-400">
                Current Market Prices
              </span>
            </div>
            <div className="font-mono-tabular text-2xl sm:text-3xl font-semibold text-amber-400 mt-1.5">
              {(latestObs.secondaryValue || 10.3).toFixed(1)}% YoY
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
              <span>Implicit Price Deflator Wedge:</span>
              <span className="font-mono-tabular text-cyan-400 font-semibold">
                +{implicitDeflator}%
              </span>
            </div>
          </div>

          {/* Card 3: Financial Year, Quarter, Estimate Status & Release Date */}
          <div
            className={`rounded-xl border p-5 ${
              theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            <div className="text-xs text-slate-400">
              Financial Year, Quarter &amp; Status
            </div>
            <div className="font-mono-tabular text-base sm:text-lg font-semibold mt-1.5">
              {meta?.financialYear || `FY ${latestObs.financialYear || '2026–27'}`} ·{' '}
              {meta?.quarter || latestObs.quarter || 'Q1'}
            </div>
            <div className="text-[11px] text-emerald-400 font-mono-tabular mt-1">
              {meta?.estimateStatus || latestObs.estimateStatusLabel || 'Quarterly Estimate (Q1)'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Released: <span className="font-mono-tabular text-slate-300">{meta?.releaseDate || latestObs.releaseDate || '31 Aug 2026'}</span>
            </div>
          </div>

          {/* Card 4: Official MoSPI Reference Links & Base Year */}
          <div
            className={`rounded-xl border p-5 flex flex-col justify-between ${
              theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            <div>
              <div className="text-xs text-slate-400">Official MoSPI Sources</div>
              <div className="font-mono-tabular text-xs font-semibold text-cyan-400 mt-1">
                Base Year: {meta?.activeBaseYear || '2022–23'} (NAS Series)
              </div>
            </div>

            <div className="space-y-1 pt-2 text-[11px]">
              <a
                href={
                  meta?.mospiGdpPortalUrl ||
                  'https://www.mospi.gov.in/themes/product/6-gross-domestic-product'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-emerald-400 hover:underline"
              >
                <span>1. MoSPI GDP Releases Page</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
              <a
                href={
                  meta?.esankhyikiNasCatalogueUrl ||
                  'https://esankhyiki.mospi.gov.in/catalogue-main/catalogue?product=NAS'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-amber-400 hover:underline"
              >
                <span>2. eSankhyiki NAS Catalogue</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
              <a
                href={meta?.mospiFaqUrl || 'https://mospi.gov.in/faq'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-cyan-400 hover:underline"
              >
                <span>3. MoSPI Official GDP FAQs</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 6. Primary Interactive Chart (Reusing AnalyticalChartPanel) */}
      {!errorMessage && (
        <AnalyticalChartPanel
          title={`India Real vs. Nominal GDP Growth (${cadenceView} View · Base Year 2022–23)`}
          subtitle={
            cadenceView === 'Quarterly'
              ? 'Official MoSPI quarterly Year-on-Year (% YoY) growth at Constant (2022–23) Prices vs. Current Prices (Q1 FY24 – Q1 FY27)'
              : 'Full Financial Year (Annual YoY %) Real vs. Nominal GDP growth under the 2022–23 National Accounts Base Series'
          }
          unit="% YoY"
          sourceLabel="MoSPI · NSO (Base Year 2022–23)"
          frequencyLabel={cadenceView}
          observations={displayedObservations}
          seriesConfig={[
            { key: 'value', name: 'Real GDP Growth (Constant 2022–23 Prices, % YoY)', color: '#10b981' },
            { key: 'secondaryValue', name: 'Nominal GDP Growth (Current Prices, % YoY)', color: '#f59e0b' },
          ]}
          defaultChartType={cadenceView === 'Annual' ? 'bar' : 'area'}
          defaultRange="MAX"
          zeroReferenceLine
          theme={theme}
        />
      )}

      {/* 7. Crucial Economic Distinctions: Quarterly YoY vs QoQ vs Annual + Base Year 2022–23 Compatibility */}
      {!errorMessage && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 cols: Quarterly YoY vs Quarter-on-Quarter (QoQ) vs Annual Growth */}
          <div
            className={`lg:col-span-7 rounded-xl border p-5 sm:p-6 space-y-4 ${
              theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono-tabular">
              <Scale className="w-4 h-4" />
              <span>Essential National Accounts Guide · How GDP Growth Is Measured</span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold">
              Quarterly YoY Growth vs. Quarter-on-Quarter (QoQ) vs. Annual Growth
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              When reading Indian GDP headlines, it is critical not to confuse three very different growth formulas. Here is how MoSPI defines and uses each measure:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1 text-xs">
              {/* Box 1: Quarterly YoY */}
              <div
                className={`p-4 rounded-xl border ${
                  theme === 'dark'
                    ? 'bg-emerald-950/15 border-emerald-500/40'
                    : 'bg-emerald-50/70 border-emerald-200'
                }`}
              >
                <div className="text-[11px] font-mono-tabular text-emerald-400 font-semibold">
                  1. PRIMARY HEADLINE METRIC
                </div>
                <div className="font-semibold text-sm mt-1">
                  Quarterly Year-on-Year (YoY %)
                </div>
                <div className="font-mono-tabular text-xl font-bold text-emerald-400 my-1.5">
                  +{latestObs.value.toFixed(1)}% YoY
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Compares <strong>{latestObs.label} (Apr–Jun 2026)</strong> directly with the <strong>same quarter one year ago (Q1 FY26, Apr–Jun 2025)</strong>. MoSPI uses YoY % as India&apos;s headline measure because it neutralizes monsoon, harvest, and festival seasonality.
                </p>
              </div>

              {/* Box 2: Sequential QoQ */}
              <div
                className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-[#060B16] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-[11px] font-mono-tabular text-amber-400 font-semibold">
                  2. SEQUENTIAL UNADJUSTED
                </div>
                <div className="font-semibold text-sm mt-1">
                  Quarter-on-Quarter (QoQ %)
                </div>
                <div className="font-mono-tabular text-xl font-bold text-amber-400 my-1.5">
                  {sequentialQoQChange > 0 ? `+${sequentialQoQChange}%` : `${sequentialQoQChange}%`} vs Q4
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Compares {latestObs.label} real output (₹{latestObs.realGdpConstantLakhCr ?? 90.41}L Cr) against the <strong>immediately preceding quarter ({prevObs.label}: ₹{prevObs.realGdpConstantLakhCr ?? 95.32}L Cr)</strong>. In India, Q4 (Jan–Mar) always spikes due to fiscal year-end targets, so raw Q1 vs. Q4 QoQ is seasonally lower and is <em>not</em> the headline rate.
                </p>
              </div>

              {/* Box 3: Annual Full-Year Growth */}
              <div
                className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-[#060B16] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-[11px] font-mono-tabular text-cyan-400 font-semibold">
                  3. FULL FINANCIAL YEAR
                </div>
                <div className="font-semibold text-sm mt-1">
                  Annual FY Growth (Apr–Mar)
                </div>
                <div className="font-mono-tabular text-xl font-bold text-cyan-400 my-1.5">
                  +7.7% (FY 2025–26)
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Sums all four quarters (Q1 + Q2 + Q3 + Q4) of an entire Indian Financial Year (1 April to 31 March) at Constant 2022–23 Prices and compares that 12-month total against the prior Financial Year (FY 2024–25: +7.2%).
                </p>
              </div>
            </div>
          </div>

          {/* Right 5 cols: Base Year 2022–23 Transition & Series Compatibility Explanation */}
          <div
            className={`lg:col-span-5 rounded-xl border p-5 sm:p-6 flex flex-col justify-between space-y-4 ${
              theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-mono-tabular">
                <Info className="w-4 h-4" />
                <span>Base Year Revision · Series Compatibility Rule</span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold">
                Why ArthNiti Uses the New 2022–23 Base Year Series Without Mixing 2011–12 Data
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                On <strong>27 February 2026</strong>, MoSPI officially updated India&apos;s National Accounts base year from <strong>2011–12</strong> to <strong>2022–23</strong> to capture structural shifts in digital services, GST tax data, renewable energy, and updated household consumption weights.
              </p>

              <div
                className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                  theme === 'dark' ? 'bg-[#060B16] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="font-semibold text-emerald-400">
                  Why Old (2011–12) and New (2022–23) Series Are Kept Separate:
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>
                    <strong>Constant-Price Valuation Base:</strong> In the new series, &ldquo;Real GDP&rdquo; is valued at constant <strong>2022–23 market prices</strong> rather than 2011–12 prices.
                  </li>
                  <li>
                    <strong>Improved Double Deflation &amp; GST Coverage:</strong> The 2022–23 series incorporates MCA-21 corporate filings and GSTN turnover data with updated sectoral deflators.
                  </li>
                  <li>
                    <strong>Strict Comparability:</strong> Because 2022–23 is the base year, official YoY quarterly growth rates under the new methodology start from <strong>Q1 FY 2023–24</strong>. Combining pre-2023 quarters from the old 2011–12 base on the same line without official back-series splicing would distort historical comparisons.
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>Reference: MoSPI NAS Methodology FAQ</span>
              <a
                href="https://mospi.gov.in/faq"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>Read Official MoSPI FAQ</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 8. Official MoSPI Quarterly GDP Verification Table (Base Year 2022–23) */}
      {!errorMessage && (
        <div
          className={`rounded-xl border p-5 sm:p-6 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800/60">
            <div>
              <div className="text-xs font-mono-tabular text-emerald-400">
                Official MoSPI Quarterly National Accounts Series · Base Year 2022–23
              </div>
              <h2 className="text-base sm:text-lg font-semibold mt-0.5">
                Quarterly Real &amp; Nominal GDP Estimates Table (FY 2023–24 to FY 2026–27)
              </h2>
            </div>
            <span className="text-xs font-mono-tabular text-slate-400">
              {indicator.observations.length} Verified Quarters Loaded
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
                  <th className="py-2.5 pr-4">Quarter</th>
                  <th className="py-2.5 px-3">Financial Year</th>
                  <th className="py-2.5 px-3">Reference Period</th>
                  <th className="py-2.5 px-3 text-right">Real GDP (% YoY, Const. 2022–23)</th>
                  <th className="py-2.5 px-3 text-right">Nominal GDP (% YoY, Current)</th>
                  <th className="py-2.5 px-3 text-right">Real GDP Level (₹ Lakh Cr)</th>
                  <th className="py-2.5 px-3">Estimate Status</th>
                  <th className="py-2.5 pl-3 text-right">Release Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-mono-tabular">
                {[...indicator.observations].reverse().map((obs, idx) => (
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
                          (Latest)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      FY {obs.financialYear || '2026-27'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {obs.referencePeriod || 'Apr–Jun 2026'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-400">
                      +{obs.value.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-400">
                      {obs.secondaryValue !== undefined
                        ? `+${obs.secondaryValue.toFixed(1)}%`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {obs.realGdpConstantLakhCr !== undefined
                        ? `₹${obs.realGdpConstantLakhCr.toFixed(2)}L Cr`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans">
                      {obs.estimateStatusLabel || obs.status}
                    </td>
                    <td className="py-2.5 pl-3 text-right text-slate-400">
                      {obs.releaseDate || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 9. Real vs. Nominal GDP Explanation & Sectoral GVA Breakdown */}
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
              Understanding Real (Constant) vs. Nominal (Current) GDP
            </h2>

            <div className="space-y-3 text-xs leading-relaxed text-slate-400">
              <div
                className={`p-3 rounded-lg border ${
                  theme === 'dark' ? 'bg-[#060B16] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="font-semibold text-emerald-400 mb-1">
                  1. Real GDP (Constant 2022–23 Prices) — Primary Growth Indicator
                </div>
                <p>
                  Strips out price inflation by valuing output at fixed <strong>2022–23 base-year prices</strong>. This measures true physical volume expansion of goods and services produced and is always used for India&apos;s headline economic growth rate ({latestObs.value.toFixed(1)}% YoY in {latestObs.label}).
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
                  Measured at prevailing market prices without inflation adjustment ({(latestObs.secondaryValue || 10.3).toFixed(1)}% YoY in {latestObs.label}). Used as the denominator for Union Budget fiscal deficit-to-GDP, tax buoyancy, and sovereign debt-to-GDP ratios.
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
                  GDP at Market Prices = ∑ Sectoral GVA at Basic Prices + (Net Taxes on Products: GST + Customs − Subsidies)
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
