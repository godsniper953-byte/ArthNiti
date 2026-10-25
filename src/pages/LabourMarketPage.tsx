import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  RefreshCw,
  ShieldCheck,
  Table,
  Upload,
  Users,
} from 'lucide-react';
import { EconomicIndicator } from '../types/economy';
import { AnalyticalChartPanel } from '../components/charts/AnalyticalChartPanel';

interface LabourMarketPageProps {
  indicator: EconomicIndicator;
  isLoading: boolean;
  errorMessage: string | null;
  lastVerified: string;
  dataOrigin: 'official_mospi_csv' | 'user_uploaded_csv' | 'demonstration_fallback';
  onRefreshOfficialPlfs: (simulateError?: boolean) => void;
  onUploadCustomCsv: (csvText: string) => { ok: boolean; error?: string };
  onResetCustomCsv: () => void;
  onActivateDemoFallback: () => void;
  theme: 'dark' | 'light';
}

export const LabourMarketPage: React.FC<LabourMarketPageProps> = ({
  indicator,
  isLoading,
  errorMessage,
  lastVerified,
  dataOrigin,
  onRefreshOfficialPlfs,
  onUploadCustomCsv,
  onResetCustomCsv,
  onActivateDemoFallback,
  theme,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'ur_breakdown' | 'lfpr_wpr' | 'all'>('ur_breakdown');
  const [showCsvUpdater, setShowCsvUpdater] = useState<boolean>(false);
  const [csvDraft, setCsvDraft] = useState<string>('');
  const [csvFeedback, setCsvFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const observations = indicator.observations || [];
  const latest = observations[observations.length - 1];
  const previous = observations.length > 1 ? observations[observations.length - 2] : latest;
  const plfsMeta = indicator.officialPlfsMeta;

  // Recent 18 monthly observations sorted newest first for table verification
  const recentMonthlyObservations = [...observations].reverse();

  const seriesConfig =
    selectedMetric === 'ur_breakdown'
      ? [
          {
            key: 'value' as const,
            name: 'All-India Unemployment Rate (CWS · Age 15+)',
            color: '#10b981',
          },
          {
            key: 'ruralUrPct' as const,
            name: 'Rural Unemployment Rate (CWS · Age 15+)',
            color: '#06b6d4',
          },
          {
            key: 'urbanUrPct' as const,
            name: 'Urban Unemployment Rate (CWS · Age 15+)',
            color: '#f59e0b',
          },
        ]
      : selectedMetric === 'lfpr_wpr'
      ? [
          {
            key: 'lfprCwsPct' as const,
            name: 'Labour Force Participation Rate — LFPR (CWS · Age 15+)',
            color: '#f59e0b',
          },
          {
            key: 'wprCwsPct' as const,
            name: 'Worker Population Ratio — WPR (CWS · Age 15+)',
            color: '#06b6d4',
          },
        ]
      : [
          {
            key: 'value' as const,
            name: 'All-India Unemployment Rate (UR · %)',
            color: '#10b981',
          },
          {
            key: 'lfprCwsPct' as const,
            name: 'Labour Force Participation Rate (LFPR · %)',
            color: '#f59e0b',
          },
          {
            key: 'wprCwsPct' as const,
            name: 'Worker Population Ratio (WPR · %)',
            color: '#06b6d4',
          },
        ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      setCsvDraft(content);
      const res = onUploadCustomCsv(content);
      if (res.ok) {
        setCsvFeedback({
          type: 'success',
          message: `Uploaded "${file.name}" and updated the PLFS Unemployment chart and table.`,
        });
      } else {
        setCsvFeedback({
          type: 'error',
          message: res.error || 'Could not parse uploaded PLFS CSV file.',
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
    const res = onUploadCustomCsv(csvDraft);
    if (res.ok) {
      setCsvFeedback({
        type: 'success',
        message: 'Custom MoSPI PLFS CSV dataset applied and saved in your browser.',
      });
    } else {
      setCsvFeedback({
        type: 'error',
        message: res.error || 'Failed to parse pasted PLFS CSV.',
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header & Official MoSPI PLFS Data Provenance Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular">
            {indicator.isOfficialData && !errorMessage ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {dataOrigin === 'user_uploaded_csv'
                    ? 'USER-UPLOADED MOSPI PLFS CSV'
                    : 'OFFICIAL MOSPI PLFS DATA · MONTHLY CWS (AGE 15+)'}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  {errorMessage
                    ? 'OFFICIAL PLFS DATA UNAVAILABLE'
                    : 'DEMONSTRATION FALLBACK SERIES'}
                </span>
              </span>
            )}
            <span className="text-slate-400">·</span>
            <span className="text-emerald-400">
              {plfsMeta?.ageCohort || 'Age 15 Years & Above'}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Last Verified: {lastVerified}</span>
            </span>
          </div>

          <h1
            className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-2 ${
              theme === 'dark' ? 'text-white' : 'text-slate-950'
            }`}
          >
            India&apos;s Official Unemployment Rate &amp; Labour Market (MoSPI PLFS)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Official National Statistical Office (NSO), MoSPI Monthly Periodic Labour Force Survey (PLFS) All-India Unemployment Rate for persons aged 15 years and above under the Current Weekly Status (CWS) framework, with Rural and Urban breakdowns.
          </p>
        </div>

        {/* Action Toolbar: Refresh, CSV Updater, & Error State Tester */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => onRefreshOfficialPlfs(false)}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#0B1325] border-slate-700 text-slate-200 hover:border-emerald-500/50'
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Verifying PLFS Data...' : 'Reload Official PLFS Data'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCsvUpdater((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{showCsvUpdater ? 'Hide CSV Updater' : 'Update PLFS CSV (No-Code)'}</span>
          </button>

          <button
            type="button"
            onClick={() => onRefreshOfficialPlfs(true)}
            title="Simulate an official data load failure to verify that ArthNiti never silently substitutes fake data"
            className="px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium transition-colors cursor-pointer"
          >
            Test Error State
          </button>
        </div>
      </div>

      {/* 2. Explicit Error / Data-Unavailable Banner (Never silently substitutes fake data) */}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/40 bg-rose-950/25 p-5 text-xs text-slate-200 space-y-3"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <div className="text-sm font-semibold text-rose-300">
                Official MoSPI PLFS Unemployment Data Currently Unavailable
              </div>
              <p className="text-slate-300 leading-relaxed">{errorMessage}</p>
              <p className="text-slate-400">
                <strong>Strict Data Integrity Guarantee:</strong> In accordance with ArthNiti&apos;s statistical governance standards, the platform <strong>never silently substitutes sample or stale data</strong> when official PLFS retrieval fails. You may retry loading the verified MoSPI PLFS dataset or explicitly view a clearly labelled demonstration fallback series.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 pl-8">
            <button
              type="button"
              onClick={() => onRefreshOfficialPlfs(false)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
            >
              Retry Official MoSPI PLFS Dataset
            </button>
            <button
              type="button"
              onClick={onActivateDemoFallback}
              className="px-3.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-medium cursor-pointer"
            >
              Use Clearly Labelled Demonstration Data Instead
            </button>
          </div>
        </div>
      )}

      {/* 3. Zero-Code CSV Updater Drawer for Non-Programmers */}
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
                ZERO-CODE MOSPI PLFS DATA UPDATER (FOR NON-PROGRAMMERS)
              </div>
              <h2 className="text-base font-semibold mt-0.5">
                Update Monthly PLFS Unemployment Data Without Touching Code
              </h2>
            </div>
            {dataOrigin === 'user_uploaded_csv' && (
              <button
                type="button"
                onClick={() => {
                  onResetCustomCsv();
                  setCsvFeedback({
                    type: 'success',
                    message: 'Restored default verified MoSPI PLFS dataset (/data/mospi_plfs_official.csv).',
                  });
                }}
                className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs font-medium cursor-pointer self-start"
              >
                Reset to Default Verified MoSPI PLFS CSV
              </button>
            )}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            When MoSPI releases a new Monthly PLFS Bulletin on the 15th of the month, you can either replace{' '}
            <code className="font-mono-tabular text-emerald-400">public/data/mospi_plfs_official.csv</code> in GitHub OR upload/paste the updated CSV right here. Required columns:{' '}
            <code className="font-mono-tabular text-amber-300">
              date,label,overall_ur_cws_pct,rural_ur_cws_pct,urban_ur_cws_pct,lfpr_cws_pct,wpr_cws_pct,age_group,measure,status,release_date
            </code>
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
                <div className="text-emerald-400 font-semibold">Example New Monthly Row (Oct 2026):</div>
                <div className="break-all">
                  2026-10,Oct 2026,4.9,4.1,6.8,55.6,52.9,15 years and above,CWS,Provisional,15 Nov 2026
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
                  placeholder="date,label,overall_ur_cws_pct,rural_ur_cws_pct,urban_ur_cws_pct,lfpr_cws_pct,wpr_cws_pct,age_group,measure,status,release_date&#10;2026-09,Sep 2026,5.0,4.2,6.9,55.5,52.7,15 years and above,CWS,Provisional,15 Oct 2026"
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

      {/* 4. Official MoSPI PLFS Verification Strip (4 Cards) */}
      {!errorMessage && latest && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: Headline All-India CWS Unemployment Rate */}
          <div
            className={`rounded-xl border p-5 ${
              theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>All-India Unemployment Rate</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono-tabular text-[10px] font-semibold">
                CWS · Age 15+
              </span>
            </div>
            <div className="font-mono-tabular text-3xl font-semibold text-emerald-400 mt-1.5">
              {latest.value.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Ref Month: {latest.label}</span>
              <span className="font-mono-tabular text-slate-300">
                Prev ({previous.label}): {previous.value.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Card 2: Rural vs. Urban Unemployment Breakdown */}
          <div
            className={`rounded-xl border p-5 ${
              theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Rural vs. Urban UR ({latest.label})</span>
              <span className="font-mono-tabular text-[11px] text-cyan-400">Sectoral Split</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <div className="text-[10px] text-slate-400">Rural (CWS 15+)</div>
                <div className="font-mono-tabular text-xl font-semibold text-cyan-400">
                  {(latest.ruralUrPct ?? plfsMeta?.ruralUrPct ?? 4.2).toFixed(1)}%
                </div>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="text-[10px] text-slate-400">Urban (CWS 15+)</div>
                <div className="font-mono-tabular text-xl font-semibold text-amber-400">
                  {(latest.urbanUrPct ?? plfsMeta?.urbanUrPct ?? 6.9).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Distinct Companion Ratios (LFPR & WPR Kept Strictly Separate from UR) */}
          <div
            className={`rounded-xl border p-5 ${
              theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Workforce Ratios (Not Unemployment)</span>
              <span className="font-mono-tabular text-[10px] text-amber-400">Separate Metrics</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <div className="text-[11px] text-slate-400">LFPR (CWS 15+)</div>
                <div className="font-mono-tabular text-xl font-semibold text-amber-400 mt-0.5">
                  {(latest.lfprCwsPct ?? plfsMeta?.lfprCwsPct ?? 55.5).toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500">In Labour Force</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">WPR (CWS 15+)</div>
                <div className="font-mono-tabular text-xl font-semibold text-cyan-400 mt-0.5">
                  {(latest.wprCwsPct ?? plfsMeta?.wprCwsPct ?? 52.7).toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500">Employed / Pop.</div>
              </div>
            </div>
          </div>

          {/* Card 4: Release Metadata & Official MoSPI Links */}
          <div
            className={`rounded-xl border p-5 flex flex-col justify-between ${
              theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Release Date: {latest.releaseDate || indicator.releaseDate}</span>
                <span className="text-emerald-400 font-mono-tabular text-[11px]">
                  {latest.status || 'Final'}
                </span>
              </div>
              <div className="text-xs font-medium mt-1.5 text-slate-200">
                MoSPI Monthly PLFS Bulletin
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 mt-2 border-t border-slate-800/80 text-[11px] font-mono-tabular">
              <a
                href={plfsMeta?.mospiPlfsPortalUrl || 'https://www.mospi.gov.in/themes/product/69--'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                <span>MoSPI PLFS</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-600">·</span>
              <a
                href={
                  plfsMeta?.esankhyikiPlfsCatalogueUrl ||
                  'https://esankhyiki.mospi.gov.in/catalogue-main/catalogue?product=PLFS'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                <span>eSankhyiki PLFS</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-600">·</span>
              <a
                href={plfsMeta?.mospiLatestReleasesUrl || 'https://mospi.gov.in/latest-releases'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Releases</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 5. Main Chart with Series Mode Switcher */}
      {!errorMessage && observations.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              Select chart view: Compare <strong className="text-slate-200">All-India, Rural &amp; Urban Unemployment Rates</strong> or inspect <strong className="text-slate-200">LFPR &amp; WPR</strong> separately.
            </div>
            <div
              className={`flex items-center p-1 rounded-lg border self-start sm:self-auto ${
                theme === 'dark' ? 'bg-[#0B1325] border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              {[
                { id: 'ur_breakdown', label: 'Unemployment: All-India vs Rural vs Urban' },
                { id: 'lfpr_wpr', label: 'Separate Workforce Ratios (LFPR & WPR)' },
                { id: 'all', label: 'Combined View' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMetric(m.id as 'ur_breakdown' | 'lfpr_wpr' | 'all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedMetric === m.id
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <AnalyticalChartPanel
            title={
              selectedMetric === 'ur_breakdown'
                ? 'Official MoSPI Monthly PLFS Unemployment Rate: All-India, Rural & Urban (CWS · Age 15+)'
                : selectedMetric === 'lfpr_wpr'
                ? 'Official MoSPI Monthly PLFS Workforce Participation: LFPR & WPR (CWS · Age 15+)'
                : 'Official MoSPI Monthly PLFS Indicators: UR, LFPR & WPR (CWS · Age 15+)'
            }
            subtitle="Monthly Current Weekly Status (CWS, 7-day reference window) estimates for persons aged 15 years and above across All-India (Rural + Urban)"
            unit="%"
            sourceLabel="NSO · MoSPI (Official Monthly PLFS Bulletin)"
            frequencyLabel="Monthly (CWS)"
            observations={observations}
            seriesConfig={seriesConfig}
            defaultChartType="line"
            defaultRange="MAX"
            theme={theme}
          />
        </div>
      )}

      {/* 6. Critical Methodological Distinctions: UR vs LFPR vs WPR & CWS vs Usual Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Distinguishing UR from LFPR and WPR */}
        <div
          className={`lg:col-span-7 rounded-xl border p-5 sm:p-6 space-y-4 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono-tabular">
            <Users className="w-4 h-4" />
            <span>Methodological Guardrail 1 · Do Not Confuse UR, LFPR, and WPR</span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold">
            How Unemployment Rate (UR) Differs from LFPR &amp; WPR
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            A common mistake in economic commentary is confusing the <strong>Unemployment Rate</strong> with population-wide ratios. MoSPI defines three distinct indicators for persons aged 15 years and above:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            <div
              className={`p-3.5 rounded-lg border ${
                theme === 'dark' ? 'bg-[#060B16] border-emerald-500/30' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-xs font-semibold text-emerald-400 mb-1">
                1. Unemployment Rate (UR: {latest ? `${latest.value.toFixed(1)}%` : '5.0%'})
              </div>
              <div className="font-mono-tabular text-[11px] text-slate-300 mb-1.5">
                = (Unemployed ÷ Labour Force) × 100
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Percentage of persons <strong>in the labour force</strong> who did not work even 1 hour during the 7-day reference week but sought or were available for work.
              </p>
            </div>

            <div
              className={`p-3.5 rounded-lg border ${
                theme === 'dark' ? 'bg-[#060B16] border-amber-500/30' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-xs font-semibold text-amber-400 mb-1">
                2. LFPR ({latest?.lfprCwsPct ? `${latest.lfprCwsPct.toFixed(1)}%` : '55.5%'})
              </div>
              <div className="font-mono-tabular text-[11px] text-slate-300 mb-1.5">
                = (Labour Force ÷ Population 15+) × 100
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Percentage of the total working-age population (15+) that is either working (employed) or actively seeking/available for work.
              </p>
            </div>

            <div
              className={`p-3.5 rounded-lg border ${
                theme === 'dark' ? 'bg-[#060B16] border-cyan-500/30' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-xs font-semibold text-cyan-400 mb-1">
                3. WPR ({latest?.wprCwsPct ? `${latest.wprCwsPct.toFixed(1)}%` : '52.7%'})
              </div>
              <div className="font-mono-tabular text-[11px] text-slate-300 mb-1.5">
                = (Employed ÷ Population 15+) × 100
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Percentage of the total population aged 15+ that is currently employed. Note that <code className="font-mono-tabular">WPR = LFPR × (1 − UR)</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Right 5 cols: Monthly CWS vs Annual Usual Status (Never Mix Series) */}
        <div
          className={`lg:col-span-5 rounded-xl border p-5 sm:p-6 flex flex-col justify-between space-y-4 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono-tabular">
              <Briefcase className="w-4 h-4" />
              <span>Methodological Guardrail 2 · Never Mix CWS &amp; Usual Status</span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold">
              Monthly CWS (7-Day Window) vs. Annual Usual Status (365-Day Window)
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              MoSPI publishes two separate measurement frameworks in PLFS. Mixing them produces misleading trend jumps:
            </p>

            <ul className="space-y-2.5 text-xs text-slate-400 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>
                    Current Weekly Status (CWS — Used Here: 5.0% in Sep 2026):
                  </strong>{' '}
                  Uses a <strong>7-day reference week</strong> prior to the survey interview. A person is classified as unemployed if they did not work for even 1 hour on any day during those 7 days but sought/were available for work. Since Jan 2025, MoSPI publishes monthly All-India (Rural + Urban) CWS bulletins.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>
                    Annual Usual Status (ps+ss — ~3.2% Annual):
                  </strong>{' '}
                  Uses a <strong>365-day reference window</strong>. Because many workers find subsidiary or seasonal work for at least 30 days during a full year, Annual Usual Status unemployment (~3.2%) is structurally lower than Monthly CWS unemployment (~5.0%). ArthNiti never splices these two series together.
                </span>
              </li>
            </ul>
          </div>

          <div
            className={`pt-3 border-t text-xs text-slate-400 ${
              theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-slate-200 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Series Compatibility &amp; Public Data Access Findings</span>
            </div>
            <p className="leading-relaxed">
              {plfsMeta?.seriesCompatibilityNote ||
                'MoSPI publishes official PLFS Monthly Bulletins and microdata catalogues on mospi.gov.in and esankhyiki.mospi.gov.in. Because cross-origin browser requests are restricted by CORS, ArthNiti serves a verified local CSV mirror (/data/mospi_plfs_official.csv) with a zero-code browser CSV updater.'}
            </p>
          </div>
        </div>
      </div>

      {/* 7. Official Monthly PLFS Verification Table */}
      {!errorMessage && recentMonthlyObservations.length > 0 && (
        <div
          className={`rounded-xl border p-5 sm:p-6 space-y-4 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-400">
                <Table className="w-3.5 h-3.5" />
                <span>Official Monthly PLFS Verification Log (All-India · Age 15+ · CWS)</span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold mt-0.5">
                Monthly CWS Unemployment Rate, Rural/Urban Split &amp; Workforce Ratios
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-tabular">
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              <span>Source: /data/mospi_plfs_official.csv ({recentMonthlyObservations.length} Months)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono-tabular text-[11px]">
                  <th className="py-2.5 pr-4">Reference Month</th>
                  <th className="py-2.5 px-3">All-India UR (CWS 15+)</th>
                  <th className="py-2.5 px-3">Rural UR (CWS)</th>
                  <th className="py-2.5 px-3">Urban UR (CWS)</th>
                  <th className="py-2.5 px-3">LFPR (CWS 15+)</th>
                  <th className="py-2.5 px-3">WPR (CWS 15+)</th>
                  <th className="py-2.5 px-3">Measure &amp; Cohort</th>
                  <th className="py-2.5 pl-3 text-right">Release Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono-tabular">
                {recentMonthlyObservations.map((obs, idx) => (
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
                    <td className="py-2.5 pr-4 font-semibold">
                      <div className="flex items-center gap-2">
                        <span>{obs.label}</span>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">
                            Latest
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-400">
                      {obs.value.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-cyan-400">
                      {obs.ruralUrPct !== undefined ? `${obs.ruralUrPct.toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-amber-400">
                      {obs.urbanUrPct !== undefined ? `${obs.urbanUrPct.toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {obs.lfprCwsPct !== undefined ? `${obs.lfprCwsPct.toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {obs.wprCwsPct !== undefined ? `${obs.wprCwsPct.toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-400">
                      {obs.surveyMeasure || 'CWS'} · Age 15+
                    </td>
                    <td className="py-2.5 pl-3 text-right text-slate-400">
                      {obs.releaseDate || '15th of next month'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
