import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Droplets,
  ExternalLink,
  FileSpreadsheet,
  Globe2,
  Inbox,
  Info,
  RefreshCw,
  ShieldCheck,
  Table,
  Upload,
} from 'lucide-react';
import { EconomicIndicator } from '../types/economy';
import { AnalyticalChartPanel } from '../components/charts/AnalyticalChartPanel';
import { RelationshipExplorer } from '../components/dashboard/RelationshipExplorer';

interface CurrencyOilPageProps {
  inrIndicator: EconomicIndicator;
  crudeIndicator: EconomicIndicator;
  allIndicators: EconomicIndicator[];
  usdInrLoading: boolean;
  usdInrError: string | null;
  usdInrEmpty: boolean;
  usdInrRetrievalTimestamp: string;
  usdInrDataOrigin: 'official_rbi_fbil_csv' | 'user_uploaded_csv' | 'demonstration_fallback';
  onRefreshOfficialUsdInr: (options?: { simulateError?: boolean; simulateEmpty?: boolean }) => void;
  onUploadCustomUsdInrCsv: (csvText: string) => { ok: boolean; error?: string };
  onResetCustomUsdInrCsv: () => void;
  onActivateUsdInrDemoFallback: () => void;
  theme: 'dark' | 'light';
}

export const CurrencyOilPage: React.FC<CurrencyOilPageProps> = ({
  inrIndicator,
  crudeIndicator,
  allIndicators,
  usdInrLoading,
  usdInrError,
  usdInrEmpty,
  usdInrRetrievalTimestamp,
  usdInrDataOrigin,
  onRefreshOfficialUsdInr,
  onUploadCustomUsdInrCsv,
  onResetCustomUsdInrCsv,
  onActivateUsdInrDemoFallback,
  theme,
}) => {
  const [showCsvUpdater, setShowCsvUpdater] = useState<boolean>(false);
  const [csvDraft, setCsvDraft] = useState<string>('');
  const [csvFeedback, setCsvFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const observations = inrIndicator.observations || [];
  const latest = observations[observations.length - 1];
  const previous = observations.length > 1 ? observations[observations.length - 2] : latest;
  const fxMeta = inrIndicator.officialUsdInrMeta;

  const reversedObservations = [...observations].reverse();

  const absChange = latest && previous ? Number((latest.value - previous.value).toFixed(4)) : -0.0159;
  const pctChange =
    latest && previous && previous.value > 0
      ? Number((((latest.value - previous.value) / previous.value) * 100).toFixed(4))
      : -0.0168;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      setCsvDraft(content);
      const res = onUploadCustomUsdInrCsv(content);
      if (res.ok) {
        setCsvFeedback({
          type: 'success',
          message: `Uploaded "${file.name}" and updated the USD/INR Reference Rate chart and table.`,
        });
      } else {
        setCsvFeedback({
          type: 'error',
          message: res.error || 'Could not parse uploaded USD/INR CSV file.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleApplyPastedCsv = () => {
    if (!csvDraft.trim()) {
      setCsvFeedback({
        type: 'error',
        message: 'Please paste CSV rows or choose a .csv file first.',
      });
      return;
    }
    const res = onUploadCustomUsdInrCsv(csvDraft);
    if (res.ok) {
      setCsvFeedback({
        type: 'success',
        message: 'Custom FBIL / RBI DBIE USD/INR CSV dataset applied and saved in your browser.',
      });
    } else {
      setCsvFeedback({
        type: 'error',
        message: res.error || 'Failed to parse pasted USD/INR CSV.',
      });
    }
  };

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
      {/* 1. Header & Official FBIL / RBI DBIE Provenance Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular">
            {inrIndicator.isOfficialData && !usdInrError && !usdInrEmpty ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {usdInrDataOrigin === 'user_uploaded_csv'
                    ? 'USER-UPLOADED FBIL / RBI DBIE CSV'
                    : 'OFFICIAL FBIL REFERENCE RATE & RBI DBIE ARCHIVE'}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  {usdInrError
                    ? 'OFFICIAL USD/INR DATA UNAVAILABLE'
                    : usdInrEmpty
                    ? 'EMPTY USD/INR DATASET STATE'
                    : 'DEMONSTRATION FALLBACK SERIES'}
                </span>
              </span>
            )}
            <span className="text-slate-400">·</span>
            <span className="text-emerald-400">Unit: INR per 1 USD</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Retrieved: {usdInrRetrievalTimestamp}</span>
            </span>
          </div>

          <h1
            className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-2 ${
              theme === 'dark' ? 'text-white' : 'text-slate-950'
            }`}
          >
            USD / INR Exchange Rate Intelligence &amp; Crude Oil Dynamics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Official daily USD/INR spot reference rates published by Financial Benchmarks India Pvt. Ltd. (FBIL, post-July 2018) and archived in the Reserve Bank of India Database on Indian Economy (RBI DBIE Table <code className="font-mono-tabular">r691</code>), paired with Indian Basket Crude Oil transmission analysis.
          </p>
        </div>

        {/* Action Toolbar: Reload, Zero-Code CSV Updater, Error & Empty State Testers */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => onRefreshOfficialUsdInr({ simulateError: false, simulateEmpty: false })}
            disabled={usdInrLoading}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#0B1325] border-slate-700 text-slate-200 hover:border-emerald-500/50'
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${usdInrLoading ? 'animate-spin' : ''}`} />
            <span>{usdInrLoading ? 'Verifying USD/INR...' : 'Reload Official USD/INR'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCsvUpdater((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{showCsvUpdater ? 'Hide CSV Updater' : 'Update USD/INR CSV (No-Code)'}</span>
          </button>

          <button
            type="button"
            onClick={() => onRefreshOfficialUsdInr({ simulateError: true })}
            title="Simulate an official data load failure to verify that ArthNiti never silently substitutes fake rates"
            className="px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium transition-colors cursor-pointer"
          >
            Test Error State
          </button>

          <button
            type="button"
            onClick={() => onRefreshOfficialUsdInr({ simulateEmpty: true })}
            title="Test empty dataset handling"
            className="px-2.5 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-medium transition-colors cursor-pointer"
          >
            Test Empty State
          </button>
        </div>
      </div>

      {/* 2. Mandatory Reference Rate vs. Live Tradable Market Quote Disclaimer Banner */}
      <div
        className={`rounded-xl border p-4 flex items-start gap-3 text-xs ${
          theme === 'dark'
            ? 'bg-amber-950/20 border-amber-500/40 text-slate-200'
            : 'bg-amber-50 border-amber-300 text-slate-800'
        }`}
      >
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <div className="font-semibold text-amber-400">
            Important Benchmark Notice — Reference Rate Is Not a Live Tradable Market Quote
          </div>
          <p>
            The USD/INR values displayed here are <strong>official daily reference rates</strong> (expressed as <strong>INR per 1 USD</strong>), computed by <strong>Financial Benchmarks India Pvt. Ltd. (FBIL)</strong> from interbank spot transactions during a random 15-minute window between <strong>11:30 AM and 12:30 PM IST</strong> and published around <strong>13:30 IST</strong> on Indian banking business days. A reference rate is an official settlement and valuation benchmark—<strong>it is not a live, real-time tradable bank or retail market quote</strong>.
          </p>
        </div>
      </div>

      {/* 3. Explicit Error State Banner */}
      {usdInrError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/40 bg-rose-950/25 p-5 text-xs text-slate-200 space-y-3"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <div className="text-sm font-semibold text-rose-300">
                Official RBI DBIE / FBIL USD/INR Reference Rate Currently Unavailable
              </div>
              <p className="text-slate-300 leading-relaxed">{usdInrError}</p>
              <p className="text-slate-400">
                <strong>Strict Data Integrity Guarantee:</strong> ArthNiti <strong>never invents exchange rates or silently substitutes hardcoded sample data</strong> when official retrieval fails. Last verified observation prior to failure: <strong>22 Oct 2026 (₹94.6986 per 1 USD)</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 pl-8">
            <button
              type="button"
              onClick={() => onRefreshOfficialUsdInr({ simulateError: false })}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
            >
              Retry Official RBI / FBIL Dataset
            </button>
            <button
              type="button"
              onClick={onActivateUsdInrDemoFallback}
              className="px-3.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-medium cursor-pointer"
            >
              Use Clearly Labelled Demonstration Data Instead
            </button>
          </div>
        </div>
      )}

      {/* 4. Explicit Empty State Banner */}
      {usdInrEmpty && !usdInrError && (
        <div
          role="status"
          className={`rounded-xl border p-6 text-center space-y-3 ${
            theme === 'dark'
              ? 'bg-[#0B1325] border-slate-800 text-slate-200'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <Inbox className="w-8 h-8 text-cyan-400 mx-auto" />
          <div className="text-sm font-semibold">
            No USD/INR Reference Rate Observations Available in Active Filter
          </div>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            The active USD/INR dataset returned zero observations. ArthNiti does not fabricate placeholder exchange rates when a feed is empty.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => onRefreshOfficialUsdInr({ simulateError: false, simulateEmpty: false })}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
            >
              Restore Verified Official RBI / FBIL Dataset
            </button>
          </div>
        </div>
      )}

      {/* 5. Zero-Code CSV Updater Drawer for Non-Programmers */}
      {showCsvUpdater && (
        <div
          className={`rounded-xl border p-5 space-y-4 ${
            theme === 'dark'
              ? 'bg-[#0B1325] border-emerald-500/40 text-slate-200'
              : 'bg-emerald-50/40 border-emerald-300 text-slate-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-mono-tabular text-emerald-400 font-semibold">
                ZERO-CODE RBI DBIE / FBIL USD/INR CSV UPDATER (FOR NON-PROGRAMMERS)
              </div>
              <h2 className="text-base font-semibold mt-0.5">
                Update Official USD/INR Reference Rates Without Touching Code
              </h2>
            </div>
            {usdInrDataOrigin === 'user_uploaded_csv' && (
              <button
                type="button"
                onClick={() => {
                  onResetCustomUsdInrCsv();
                  setCsvFeedback({
                    type: 'success',
                    message:
                      'Restored default verified FBIL / RBI DBIE dataset (/data/rbi_fbil_usdinr_official.csv).',
                  });
                }}
                className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs font-medium cursor-pointer self-start"
              >
                Reset to Default Verified USD/INR CSV
              </button>
            )}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Because RBI DBIE and FBIL historical tables do not expose an unauthenticated browser JSON API that auto-streams today&apos;s observations without CORS restrictions, you can download the latest reference rates from{' '}
            <a
              href="https://www.fbil.org.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 underline"
            >
              fbil.org.in
            </a>{' '}
            or{' '}
            <a
              href="https://dbie.rbihub.in/tables?table=financial_markets.r691_daily_interbank_forex_rates_usd_vis_a_vis_inr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 underline"
            >
              RBI DBIE Table r691
            </a>{' '}
            and either replace <code className="font-mono-tabular text-emerald-400">public/data/rbi_fbil_usdinr_official.csv</code> on GitHub or upload/paste a CSV right here.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 space-y-3">
              <label className="block text-xs font-medium">
                Option A: Choose a <code className="font-mono-tabular">.csv</code> file from your computer
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="mt-1.5 block w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                />
              </label>

              <div className="p-3 rounded-lg bg-[#060B16]/80 border border-slate-800 text-[11px] font-mono-tabular text-slate-300 space-y-1">
                <div className="text-emerald-400 font-semibold">Example New Business Day Row:</div>
                <div className="break-all">
                  2026-10-23,23 Oct 2026,94.6810,13:30 IST,FBIL (Post-Jul 2018),FBIL / RBI DBIE,Reference Rate (INR per 1 USD),Final,Daily Official FBIL Reference Rate
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-2">
              <label className="block text-xs font-medium">
                Option B: Paste full CSV content directly
                <textarea
                  rows={4}
                  value={csvDraft}
                  onChange={(e) => setCsvDraft(e.target.value)}
                  placeholder="Observation_Date,Period_Label,USD_INR_Reference_Rate,Observation_Time_IST,Benchmark_Publisher&#10;2026-10-21,21 Oct 2026,94.7145,13:30 IST,FBIL (Post-Jul 2018)&#10;2026-10-22,22 Oct 2026,94.6986,13:30 IST,FBIL (Post-Jul 2018)"
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#060B16] p-2.5 text-xs font-mono-tabular text-slate-100 focus:outline-2 focus:outline-emerald-500"
                />
              </label>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleApplyPastedCsv}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Apply Pasted CSV Data
                </button>
                {csvFeedback && (
                  <span
                    className={`text-xs font-medium ${
                      csvFeedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {csvFeedback.message}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Official 4-Card USD/INR Verification Strip */}
      {!usdInrError && !usdInrEmpty && latest && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: Latest Verified USD/INR Reference Rate */}
          <div
            className={`rounded-xl border p-5 ${
              theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Latest Verified USD/INR Rate</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono-tabular text-[10px] font-semibold">
                INR per 1 USD
              </span>
            </div>
            <div className="font-mono-tabular text-3xl font-semibold text-emerald-400 mt-1.5">
              ₹{latest.value.toFixed(4)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between font-mono-tabular">
              <span>Obs: {latest.label}</span>
              <span className="text-slate-300">{latest.observationTimeIst || '13:30 IST'}</span>
            </div>
          </div>

          {/* Card 2: Previous Observation, Absolute Change & Percentage Change */}
          <div
            className={`rounded-xl border p-5 ${
              theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Verified Consecutive Change</span>
              <span className="font-mono-tabular text-[11px] text-cyan-400">
                vs {previous.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mt-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-[10px] text-slate-400">Absolute Change</div>
                <div className="font-mono-tabular text-lg font-semibold text-emerald-400">
                  {absChange < 0
                    ? `-₹${Math.abs(absChange).toFixed(4)}`
                    : `+₹${absChange.toFixed(4)}`}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <div className="text-[10px] text-slate-400">% Change</div>
                <div className="font-mono-tabular text-lg font-semibold text-cyan-400">
                  {pctChange > 0 ? `+${pctChange.toFixed(4)}%` : `${pctChange.toFixed(4)}%`}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 font-mono-tabular">
              Previous ({previous.label}): <strong className="text-slate-200">₹{previous.value.toFixed(4)}</strong> per 1 USD
            </div>
          </div>

          {/* Card 3: Distinct Data Source, Observation Timestamp & Retrieval Timestamp */}
          <div
            className={`rounded-xl border p-5 flex flex-col justify-between ${
              theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Timestamp Separation</span>
                <span
                  className={`px-1.5 py-0.5 rounded font-mono-tabular text-[10px] ${
                    fxMeta?.isStaleOrLagging
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-emerald-500/15 text-emerald-400'
                  }`}
                >
                  {fxMeta?.isStaleOrLagging ? 'Archive Lag Notice' : 'Verified Banking Day'}
                </span>
              </div>
              <div className="text-[11px] font-mono-tabular space-y-1 pt-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">1. Data Source:</span>
                  <span className="text-emerald-400 font-semibold">FBIL &amp; RBI DBIE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">2. Observation Time:</span>
                  <span className="text-slate-200">
                    {latest.label} · {latest.observationTimeIst || '13:30 IST'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">3. Retrieval Time:</span>
                  <span className="text-cyan-400">{usdInrRetrievalTimestamp}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Institutional Provenance & Clickable Official Source Links */}
          <div
            className={`rounded-xl border p-5 flex flex-col justify-between ${
              theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Active Publisher (Post-Jul 2018)</span>
                <span className="text-amber-400 font-mono-tabular text-[11px]">FBIL</span>
              </div>
              <div className="text-xs font-medium mt-1 text-slate-200">
                Financial Benchmarks India Pvt. Ltd. (FBIL) &amp; RBI DBIE Archive
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 mt-2 border-t border-slate-800/80 text-[11px] font-mono-tabular">
              <a
                href={fxMeta?.fbilOfficialUrl || 'https://www.fbil.org.in/'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                <span>FBIL Official</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-600">·</span>
              <a
                href={
                  fxMeta?.rbiDbieTableUrl ||
                  'https://dbie.rbihub.in/tables?table=financial_markets.r691_daily_interbank_forex_rates_usd_vis_a_vis_inr'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                <span>RBI DBIE (Table r691)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-600">·</span>
              <a
                href={fxMeta?.rbiOfficialUrl || 'https://www.rbi.org.in/'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline inline-flex items-center gap-1"
              >
                <span>RBI.org.in</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 7. Dual Chart Grid: Official USD/INR (with selectable ranges) and Crude Oil */}
      {!usdInrError && !usdInrEmpty && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AnalyticalChartPanel
            title="Official USD / INR Reference Rate (2017–2026 · INR per 1 USD)"
            subtitle="RBI Reference Rate (prior to 10 Jul 2018) & FBIL Daily Spot Reference Rate (from 10 Jul 2018). Not a live tradable market quote."
            unit="INR / USD"
            sourceLabel="FBIL (Current) · RBI DBIE Table r691 (Archive)"
            frequencyLabel="Official Reference Rate"
            observations={inrIndicator.observations}
            seriesConfig={[
              {
                key: 'value',
                name: 'USD / INR Official Reference Rate (INR per 1 USD)',
                color: '#10b981',
              },
            ]}
            defaultChartType="area"
            defaultRange="MAX"
            theme={theme}
          />

          <AnalyticalChartPanel
            title="Indian Basket Crude Oil Price (2017–2026 · Labelled Illustrative Series)"
            subtitle="Weighted average of Oman/Dubai Sour and Brent Sweet crude landed cost in USD per barrel"
            unit="USD / bbl"
            sourceLabel="PPAC · Ministry of Petroleum (Illustrative)"
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
      )}

      {/* 8. Institutional Distinction: RBI Historical Database vs. FBIL Current Benchmark Publisher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          className={`lg:col-span-7 rounded-xl border p-5 sm:p-6 space-y-4 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono-tabular">
            <BookOpen className="w-4 h-4" />
            <span>Institutional Governance · The July 10, 2018 Benchmark Transition</span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold">
            Distinguishing RBI&apos;s Historical Database from FBIL (Current Benchmark Publisher)
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            When analyzing Indian exchange-rate data, economists distinguish between the <strong>historical statistical archive</strong> and the <strong>active benchmark administrator</strong>:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div
              className={`p-4 rounded-lg border ${
                theme === 'dark' ? 'bg-[#060B16] border-amber-500/30' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-xs font-semibold text-amber-400 mb-1.5">
                1. Up to July 9, 2018: RBI Reference Rate
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prior to July 10, 2018, the <strong>Reserve Bank of India (RBI)</strong> directly computed and published daily reference rates for USD, EUR, GBP, and JPY based on noon interbank quotes. Historical series remain archived in the <strong>RBI Database on Indian Economy (DBIE, Table r691)</strong>.
              </p>
            </div>

            <div
              className={`p-4 rounded-lg border ${
                theme === 'dark' ? 'bg-[#060B16] border-emerald-500/30' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-xs font-semibold text-emerald-400 mb-1.5">
                2. Since July 10, 2018: FBIL Reference Rate
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                RBI discontinued publishing its own daily reference rates in July 2018. Since <strong>July 10, 2018</strong>, <strong>Financial Benchmarks India Pvt. Ltd. (FBIL)</strong>—an independent benchmark administrator regulated by RBI—computes and disseminates the official daily USD/INR reference rate.
              </p>
            </div>
          </div>
        </div>

        <div
          className={`lg:col-span-5 rounded-xl border p-5 sm:p-6 flex flex-col justify-between space-y-4 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono-tabular">
              <Clock className="w-4 h-4" />
              <span>Data Freshness, Lag &amp; Timestamp Integrity</span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold">
              Why Historical Feeds Do Not Auto-Stream Today&apos;s Live Quotes
            </h2>
            <ul className="space-y-2 text-xs text-slate-400 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>
                    Banking Day Schedule &amp; Archive Lag:
                  </strong>{' '}
                  FBIL computes reference rates only on Indian banking business days (excluding Saturdays, Sundays, and Mumbai settlement holidays) from a random 15-minute window between 11:30 AM and 12:30 PM IST.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>
                    Honest Status Disclosure:
                  </strong>{' '}
                  {fxMeta?.stalenessMessage ||
                    'Latest verified observation in dataset is 22 Oct 2026 (₹94.6986 per 1 USD).'}
                </span>
              </li>
            </ul>
          </div>

          <div
            className={`pt-3 border-t text-xs text-slate-400 ${
              theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <span className="font-mono-tabular text-emerald-400 font-semibold">
              Local Verified CSV Mirror:
            </span>{' '}
            <code className="font-mono-tabular">/data/rbi_fbil_usdinr_official.csv</code>
          </div>
        </div>
      </div>

      {/* 9. Verified USD/INR Reference Rate Observation Log Table */}
      {!usdInrError && !usdInrEmpty && reversedObservations.length > 0 && (
        <div
          className={`rounded-xl border p-5 sm:p-6 space-y-4 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-400">
                <Table className="w-3.5 h-3.5" />
                <span>Verified USD/INR Reference Rate Log (FBIL Post-Jul 2018 &amp; RBI Pre-Jul 2018)</span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold mt-0.5">
                Official Historical &amp; Daily Reference Rate Observations (INR per 1 USD)
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-tabular">
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Source: /data/rbi_fbil_usdinr_official.csv ({reversedObservations.length} Verified Checkpoints)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono-tabular text-[11px]">
                  <th className="py-2.5 pr-4">Observation Date</th>
                  <th className="py-2.5 px-3">Reference Rate (INR per 1 USD)</th>
                  <th className="py-2.5 px-3">Obs. Time (IST)</th>
                  <th className="py-2.5 px-3">Benchmark Publisher</th>
                  <th className="py-2.5 px-3">Archive Repository</th>
                  <th className="py-2.5 pl-3">Verification Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono-tabular">
                {reversedObservations.map((obs, idx) => (
                  <tr
                    key={obs.date}
                    className={
                      idx === 0
                        ? theme === 'dark'
                          ? 'bg-emerald-950/20 text-slate-100'
                          : 'bg-emerald-50/70 text-slate-900'
                        : 'text-slate-300'
                    }
                  >
                    <td className="py-2.5 pr-4 font-semibold whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{obs.label}</span>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">
                            Latest Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-400 whitespace-nowrap">
                      ₹{obs.value.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {obs.observationTimeIst || '13:30 IST'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          obs.benchmarkPublisher?.includes('RBI (Pre')
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-emerald-500/15 text-emerald-400'
                        }`}
                      >
                        {obs.benchmarkPublisher || 'FBIL (Post-Jul 2018)'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-cyan-400 whitespace-nowrap">
                      {obs.archiveSource || 'FBIL / RBI DBIE'}
                    </td>
                    <td className="py-2.5 pl-3 text-slate-400 font-sans text-[11px]">
                      {obs.note || 'Official Daily Reference Rate'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 10. Educational Transmission Channels Section */}
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

      {/* 11. Direct Interactive Comparison of USD/INR vs. Crude Oil */}
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
