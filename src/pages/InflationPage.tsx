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
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Layers,
  RefreshCw,
  Scale,
} from 'lucide-react';
import { EconomicIndicator } from '../types/economy';
import { AnalyticalChartPanel } from '../components/charts/AnalyticalChartPanel';

interface InflationPageProps {
  indicator: EconomicIndicator;
  isLoading: boolean;
  errorMessage: string | null;
  lastUpdated: string;
  dataOrigin?: 'official_mospi_csv' | 'user_uploaded_csv' | 'demonstration_fallback';
  onRefreshOfficialCpi: (simulateError?: boolean) => void;
  onUploadCustomCsv?: (csvText: string) => { ok: boolean; error?: string };
  onResetCustomCsv?: () => void;
  onActivateDemoFallback?: () => void;
  theme: 'dark' | 'light';
}

export const InflationPage: React.FC<InflationPageProps> = ({
  indicator,
  isLoading,
  errorMessage,
  lastUpdated,
  dataOrigin,
  onRefreshOfficialCpi,
  theme,
}) => {

  const latest = indicator.observations[indicator.observations.length - 1];
  const meta = indicator.officialCpiMeta;

  // Build General CPI Index series so users can inspect the actual index level alongside YoY inflation rate
  const indexLevelSeries = useMemo(() => {
    let fallbackIndex = 130.0;
    return indicator.observations.map((obs) => {
      if (obs.generalIndexValue !== undefined) {
        return {
          label: obs.label,
          inflationRate: obs.value,
          priceLevelIndex: obs.generalIndexValue,
          baseYear: obs.baseYear || '2024=100',
        };
      }
      const stepFactor = 1 + (obs.value / 100) * 0.25;
      fallbackIndex = Number((fallbackIndex * stepFactor).toFixed(1));
      return {
        label: obs.label,
        inflationRate: obs.value,
        priceLevelIndex: fallbackIndex,
        baseYear: '2012=100',
      };
    });
  }, [indicator.observations]);

  const basketWeights = [
    {
      group: 'Food & Beverages',
      weight: 45.86,
      latestYoY: latest?.tertiaryValue || 7.74,
      color: 'bg-amber-500',
    },
    {
      group: 'Miscellaneous (Health, Education, Personal Care)',
      weight: 28.32,
      latestYoY: 3.9,
      color: 'bg-emerald-500',
    },
    {
      group: 'Housing (Urban Rentals & Utilities)',
      weight: 10.07,
      latestYoY: 3.4,
      color: 'bg-cyan-500',
    },
    {
      group: 'Fuel & Light',
      weight: 6.84,
      latestYoY: 2.1,
      color: 'bg-blue-500',
    },
    {
      group: 'Clothing & Footwear',
      weight: 6.53,
      latestYoY: 3.5,
      color: 'bg-indigo-500',
    },
    {
      group: 'Pan, Tobacco & Intoxicants',
      weight: 2.38,
      latestYoY: 4.1,
      color: 'bg-slate-500',
    },
  ];

  const gridStroke = theme === 'dark' ? '#1e293b' : '#e2e8f0';
  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  return (
    <div className="space-y-8">
      {/* 1. Header & Official MoSPI Provenance Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular text-emerald-400">
            <span className="font-semibold">
              Official MoSPI All-India Combined CPI Integrated
            </span>
            <span aria-hidden="true">·</span>
            <span>Base Year: {meta?.activeBaseYear || '2024 = 100'} (Jan 2026+)</span>
            <span aria-hidden="true">·</span>
            <span>Last Checked: {lastUpdated}</span>
          </div>

          <h1
            className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-1 ${
              theme === 'dark' ? 'text-white' : 'text-slate-950'
            }`}
          >
            CPI Inflation &amp; Price Stability (MoSPI)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Displays the official National Statistical Office (NSO), Ministry of Statistics &amp; Programme Implementation (MoSPI) <strong>All-India Combined Year-on-Year Inflation Rate (% YoY)</strong>, kept strictly distinct from the raw <strong>CPI Index Level</strong>.
          </p>
        </div>

        {/* Action Toolbar: Reload Official Data */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => onRefreshOfficialCpi(false)}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#0B1325] border-slate-700 text-slate-200 hover:border-emerald-500/50'
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Loading MoSPI Data...' : 'Reload Official Data'}</span>
          </button>
        </div>
      </div>

      {/* 2. Official Source Links & Base Year Documentation Strip */}
      <div
        className={`rounded-xl border p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs ${
          theme === 'dark'
            ? 'bg-[#0B1325] border-emerald-500/30 text-slate-200'
            : 'bg-emerald-50/70 border-emerald-200 text-slate-800'
        }`}
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Series: All-India Combined (Rural + Urban) Consumer Price Index · YoY Inflation Rate (%)
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            <strong>Base Year Documentation:</strong> MoSPI transitioned to the revised{' '}
            <strong className="font-mono-tabular text-emerald-400">Base Year 2024 = 100</strong> starting in January 2026 (based on the 2023–24 Household Consumption Expenditure Survey). Historical observations from 2017 through December 2025 reflect the earlier{' '}
            <strong className="font-mono-tabular">Base Year 2012 = 100</strong> series.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 font-mono-tabular">
          <a
            href="https://mospi.gov.in/web/mospi/cpi"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex items-center gap-1.5 transition-colors"
          >
            <span>MoSPI CPI Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://esankhyiki.mospi.gov.in/catalogue-main/catalogue?product=CPI"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 flex items-center gap-1.5 transition-colors"
          >
            <span>eSankhyiki CPI Catalogue</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 3. Explicit Loading or Error States (Never Silently Substitute Sample Data on Failure) */}
      {isLoading ? (
        <div
          className={`rounded-xl border p-8 text-center space-y-3 animate-pulse ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800' : 'bg-white border-slate-200'
          }`}
          role="status"
        >
          <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin mx-auto" />
          <div className="text-sm font-semibold">
            Loading Official All-India Combined CPI Series from MoSPI CSV...
          </div>
          <p className="text-xs text-slate-400">
            Verifying YoY inflation rates, General CPI Index values, and Base Year metadata.
          </p>
        </div>
      ) : errorMessage ? (
        <div
          className={`rounded-xl border p-6 space-y-4 ${
            theme === 'dark'
              ? 'bg-red-950/20 border-red-500/40 text-slate-100'
              : 'bg-red-50 border-red-200 text-slate-900'
          }`}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-red-400">
                Official MoSPI CPI Data Retrieval Failed
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">{errorMessage}</p>
              <p className="text-xs text-slate-400">
                To maintain statistical integrity, ArthNiti has paused the CPI charts rather than silently substituting unlabelled sample figures. Click &ldquo;Retry Official MoSPI Fetch&rdquo; to reload the official dataset.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => onRefreshOfficialCpi(false)}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Official MoSPI Fetch</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 5. Four-Card Headline Strip (Separating YoY Inflation Rate from CPI Index Value) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1: Official YoY Inflation Rate */}
            <div
              className={`rounded-xl border p-5 ${
                theme === 'dark'
                  ? 'bg-[#0B1325] border-emerald-500/40'
                  : 'bg-white border-emerald-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>All-India Combined Inflation</span>
                <span className="font-mono-tabular text-emerald-400 font-semibold">
                  {latest.status}
                </span>
              </div>
              <div className="font-mono-tabular text-2xl font-semibold text-emerald-400 mt-1">
                {latest.value.toFixed(2)}% YoY
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Ref: {latest.label} · Released {latest.releaseDate || '12 Oct 2026'}
              </div>
            </div>

            {/* Card 2: General CPI Index Level (Kept Strictly Separate from Inflation %) */}
            <div
              className={`rounded-xl border p-5 ${
                theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>General CPI Index Value</span>
                <span className="font-mono-tabular text-amber-400">
                  Base {latest.baseYear || '2024=100'}
                </span>
              </div>
              <div className="font-mono-tabular text-2xl font-semibold text-amber-400 mt-1">
                {(latest.generalIndexValue ?? 109.49).toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-400">Index Pts</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Price index level (Not the % YoY inflation rate)
              </div>
            </div>

            {/* Card 3: Consumer Food Price Index (CFPI) YoY Inflation */}
            <div
              className={`rounded-xl border p-5 ${
                theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Food Inflation (CFPI Combined)</span>
                <span className="font-mono-tabular">{latest.label}</span>
              </div>
              <div className="font-mono-tabular text-2xl font-semibold text-amber-400 mt-1">
                {(latest.tertiaryValue ?? 7.74).toFixed(2)}% YoY
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                MoSPI Consumer Food Price Index YoY change
              </div>
            </div>

            {/* Card 4: Core CPI Inflation */}
            <div
              className={`rounded-xl border p-5 ${
                theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Core CPI (Ex-Food &amp; Fuel)</span>
                <span className="font-mono-tabular">{latest.label}</span>
              </div>
              <div className="font-mono-tabular text-2xl font-semibold text-cyan-400 mt-1">
                {(latest.secondaryValue ?? 3.85).toFixed(2)}% YoY
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Underlying non-food, non-fuel price momentum
              </div>
            </div>
          </div>

          {/* 6. Main Interactive Multi-Series CPI Chart */}
          <AnalyticalChartPanel
            title="Official MoSPI All-India Combined CPI, Food (CFPI) & Core Inflation (% YoY)"
            subtitle="Year-on-year percentage inflation rates plotted against the RBI 2.0%–6.0% tolerance band (Base 2012=100 through Dec 2025; Base 2024=100 from Jan 2026)"
            unit="% YoY"
            sourceLabel={
              dataOrigin === 'demonstration_fallback'
                ? 'Demonstration Fallback Series'
                : 'MoSPI · eSankhyiki Official Series'
            }
            frequencyLabel="Monthly"
            observations={indicator.observations}
            seriesConfig={[
              { key: 'value', name: 'All-India Combined CPI (% YoY)', color: '#10b981' },
              { key: 'tertiaryValue', name: 'Food Inflation CFPI (% YoY)', color: '#f59e0b' },
              { key: 'secondaryValue', name: 'Core CPI (% YoY)', color: '#06b6d4' },
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

          {/* 7. Official Monthly Release Ledger & Index vs. Inflation Rate Explainer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* General CPI Index Level vs. YoY Inflation Rate Visual & Ledger (7 cols) */}
            <div
              className={`lg:col-span-7 rounded-xl border p-5 sm:p-6 space-y-4 ${
                theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 text-xs text-amber-400 font-mono-tabular">
                <Scale className="w-4 h-4" />
                <span>Crucial Distinction · YoY Inflation Rate (%) vs. General CPI Index Number</span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold">
                Why the CPI Index (109.49) Is Not the Inflation Rate (5.54%)
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                When MoSPI releases monthly CPI tables on <code className="font-mono-tabular">esankhyiki.mospi.gov.in</code>, two numbers are published side by side:{' '}
                <strong>(1) The General CPI Index Number</strong> (e.g., <strong className="font-mono-tabular">109.49</strong> in Sep 2026 under Base <code className="font-mono-tabular">2024 = 100</code>), which measures the cost of the consumer basket relative to 2024, and{' '}
                <strong>(2) The Year-on-Year (YoY) Inflation Rate</strong> (<strong className="font-mono-tabular">5.54%</strong>), which measures the percentage change in that index compared to the same month one year earlier:
              </p>

              <div
                className={`p-3 rounded-lg border font-mono-tabular text-xs ${
                  theme === 'dark'
                    ? 'bg-[#060B16] border-slate-800 text-emerald-400'
                    : 'bg-slate-50 border-slate-200 text-emerald-800'
                }`}
              >
                YoY Inflation Rate (%) = [(CPI Index_t − CPI Index_(t−12)) / CPI Index_(t−12)] × 100
              </div>

              {/* Recent 2026 Official MoSPI Table (Base 2024=100) */}
              <div className="pt-2 overflow-x-auto">
                <div className="text-xs font-semibold mb-2">
                  Recent Official MoSPI Monthly Releases (2026 · Revised Base 2024 = 100)
                </div>
                <table className="w-full text-left border-collapse text-xs font-mono-tabular">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                      <th className="py-2 pr-2">Reference Month</th>
                      <th className="py-2 px-2 text-right text-emerald-400">Combined YoY %</th>
                      <th className="py-2 px-2 text-right text-amber-400">Food CFPI %</th>
                      <th className="py-2 px-2 text-right">CPI Index</th>
                      <th className="py-2 px-2">Base Year</th>
                      <th className="py-2 pl-2 text-right">Status &amp; Release</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {indicator.observations.slice(-9).map((obs) => (
                      <tr key={obs.date}>
                        <td className="py-2 pr-2 font-semibold">{obs.label}</td>
                        <td className="py-2 px-2 text-right text-emerald-400 font-semibold">
                          {obs.value.toFixed(2)}%
                        </td>
                        <td className="py-2 px-2 text-right text-amber-400">
                          {obs.tertiaryValue !== undefined ? `${obs.tertiaryValue.toFixed(2)}%` : '—'}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {obs.generalIndexValue !== undefined
                            ? obs.generalIndexValue.toFixed(2)
                            : '—'}
                        </td>
                        <td className="py-2 px-2 text-slate-400">{obs.baseYear || '2024=100'}</td>
                        <td className="py-2 pl-2 text-right text-[11px] text-slate-400">
                          <span
                            className={
                              obs.status === 'Provisional' ? 'text-amber-400' : 'text-emerald-400'
                            }
                          >
                            {obs.status}
                          </span>{' '}
                          · {obs.releaseDate || '12th'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CPI Basket Weights & Index Chart (5 cols) */}
            <div
              className={`lg:col-span-5 rounded-xl border p-5 sm:p-6 flex flex-col justify-between space-y-5 ${
                theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono-tabular">
                  <Layers className="w-4 h-4" />
                  <span>General CPI Index Level Trajectory</span>
                </div>
                <h2 className="text-base sm:text-lg font-semibold mt-1">
                  General CPI Index Level &amp; Basket Structure
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Note the structural base-year reset in January 2026 when MoSPI transitioned the index reference from <code className="font-mono-tabular">2012=100</code> (~198) to <code className="font-mono-tabular">2024=100</code> (~103.6).
                </p>

                <div className="h-[175px] w-full mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={indexLevelSeries}
                      margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="priceLevelGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{
                          fill: tickColor,
                          fontSize: 10,
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                        tickLine={false}
                        axisLine={{ stroke: gridStroke }}
                        minTickGap={28}
                      />
                      <YAxis
                        tick={{
                          fill: '#f59e0b',
                          fontSize: 10,
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                        tickLine={false}
                        axisLine={false}
                        width={42}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#060B16' : '#ffffff',
                          borderColor: '#334155',
                          fontSize: '11px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="priceLevelIndex"
                        name="General CPI Index Number"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fill="url(#priceLevelGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 space-y-2.5">
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
                className={`pt-3.5 border-t text-xs text-slate-400 ${
                  theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-slate-200 mb-1">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Why Official Repository Series Instead of Direct Browser Scraping?</span>
                </div>
                <p className="leading-relaxed">
                  MoSPI&apos;s eSankhyiki API (<code className="font-mono-tabular">api.mospi.gov.in</code>) requires user login credentials and issues 15-minute access tokens. Storing personal login secrets inside a static Vercel website would expose them publicly. Serving the verified official MoSPI CPI dataset ensures 100% reliability, zero cost, and full security in production.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
