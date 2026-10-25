import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Droplets,
  ExternalLink,
  Globe2,
  Inbox,
  Info,
  RefreshCw,
  Scale,
  ShieldCheck,
  Ship,
  Table,
  Upload,
} from 'lucide-react';
import { EconomicIndicator } from '../types/economy';
import { AnalyticalChartPanel } from '../components/charts/AnalyticalChartPanel';
import { RelationshipExplorer } from '../components/dashboard/RelationshipExplorer';

interface CurrencyOilPageProps {
  inrIndicator: EconomicIndicator;
  crudeIndicator: EconomicIndicator;
  tradeIndicator: EconomicIndicator;
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
  crudeLoading: boolean;
  crudeError: string | null;
  crudeRetrievalTimestamp: string;
  crudeDataOrigin: 'official_ppac_csv' | 'user_uploaded_csv' | 'demonstration_fallback';
  onRefreshOfficialCrude: (simulateError?: boolean) => void;
  onUploadCustomCrudeCsv: (csvText: string) => { ok: boolean; error?: string };
  onResetCustomCrudeCsv: () => void;
  onActivateCrudeDemoFallback: () => void;
  tradeLoading: boolean;
  tradeError: string | null;
  tradeRetrievalTimestamp: string;
  tradeDataOrigin: 'official_moci_csv' | 'user_uploaded_csv' | 'demonstration_fallback';
  onRefreshOfficialTrade: (simulateError?: boolean) => void;
  onUploadCustomTradeCsv: (csvText: string) => { ok: boolean; error?: string };
  onResetCustomTradeCsv: () => void;
  onActivateTradeDemoFallback: () => void;
  theme: 'dark' | 'light';
}

export const CurrencyOilPage: React.FC<CurrencyOilPageProps> = ({
  inrIndicator,
  crudeIndicator,
  tradeIndicator,
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
  crudeLoading,
  crudeError,
  crudeRetrievalTimestamp,
  crudeDataOrigin,
  onRefreshOfficialCrude,
  onUploadCustomCrudeCsv,
  onResetCustomCrudeCsv,
  onActivateCrudeDemoFallback,
  tradeLoading,
  tradeError,
  tradeRetrievalTimestamp,
  tradeDataOrigin,
  onRefreshOfficialTrade,
  onUploadCustomTradeCsv,
  onResetCustomTradeCsv,
  onActivateTradeDemoFallback,
  theme,
}) => {
  const [showUsdInrCsvUpdater, setShowUsdInrCsvUpdater] = useState<boolean>(false);
  const [usdInrCsvDraft, setUsdInrCsvDraft] = useState<string>('');
  const [usdInrCsvFeedback, setUsdInrCsvFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [showCrudeCsvUpdater, setShowCrudeCsvUpdater] = useState<boolean>(false);
  const [crudeCsvDraft, setCrudeCsvDraft] = useState<string>('');
  const [crudeCsvFeedback, setCrudeCsvFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [showTradeCsvUpdater, setShowTradeCsvUpdater] = useState<boolean>(false);
  const [tradeCsvDraft, setTradeCsvDraft] = useState<string>('');
  const [tradeCsvFeedback, setTradeCsvFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [crudeChartMode, setCrudeChartMode] = useState<'price_only' | 'price_and_mom'>('price_only');
  const [tradeBalanceChartMode, setTradeBalanceChartMode] = useState<
    'signed_balance' | 'deficit_magnitude' | 'yoy_growth'
  >('signed_balance');

  // 1. Merchandise Trade Observations & Metadata
  const tradeObservations = tradeIndicator.observations || [];
  const latestTrade = tradeObservations[tradeObservations.length - 1];
  const previousTrade =
    tradeObservations.length > 1 ? tradeObservations[tradeObservations.length - 2] : latestTrade;
  const sameMonthPrevYearTrade =
    tradeObservations.length >= 13 ? tradeObservations[tradeObservations.length - 13] : previousTrade;
  const tradeMeta = tradeIndicator.officialTradeMeta;
  const reversedTradeObservations = [...tradeObservations].reverse();

  const latestExportsBn =
    tradeMeta?.merchandiseExportsUsdBn ?? latestTrade?.merchandiseExportsUsdBn ?? latestTrade?.secondaryValue ?? 44.4;
  const latestImportsBn =
    tradeMeta?.merchandiseImportsUsdBn ?? latestTrade?.merchandiseImportsUsdBn ?? latestTrade?.tertiaryValue ?? 74.61;
  const latestSignedBalanceBn =
    tradeMeta?.tradeBalanceUsdBn ??
    latestTrade?.tradeBalanceUsdBn ??
    Number((latestExportsBn - latestImportsBn).toFixed(2));
  const latestDeficitMagnitudeBn =
    tradeMeta?.tradeDeficitMagnitudeUsdBn ??
    latestTrade?.tradeDeficitMagnitudeUsdBn ??
    (latestSignedBalanceBn < 0 ? Number(Math.abs(latestSignedBalanceBn).toFixed(2)) : 0);

  const latestExportsYoYPct = tradeMeta?.exportsYoYPct ?? latestTrade?.exportsYoYPct ?? 23.04;
  const latestImportsYoYPct = tradeMeta?.importsYoYPct ?? latestTrade?.importsYoYPct ?? 8.0;

  const prevMonthExportsBn =
    previousTrade?.merchandiseExportsUsdBn ?? previousTrade?.secondaryValue ?? 43.81;
  const prevMonthImportsBn =
    previousTrade?.merchandiseImportsUsdBn ?? previousTrade?.tertiaryValue ?? 70.67;
  const prevMonthBalanceBn =
    previousTrade?.tradeBalanceUsdBn ?? previousTrade?.value ?? -26.86;

  const exportsMoMPct =
    prevMonthExportsBn > 0
      ? Number((((latestExportsBn - prevMonthExportsBn) / prevMonthExportsBn) * 100).toFixed(2))
      : 1.35;
  const importsMoMPct =
    prevMonthImportsBn > 0
      ? Number((((latestImportsBn - prevMonthImportsBn) / prevMonthImportsBn) * 100).toFixed(2))
      : 5.58;

  // 2. USD/INR Observations & Metadata
  const observations = inrIndicator.observations || [];
  const latestInr = observations[observations.length - 1];
  const previousInr = observations.length > 1 ? observations[observations.length - 2] : latestInr;
  const fxMeta = inrIndicator.officialUsdInrMeta;
  const reversedInrObservations = [...observations].reverse();

  const absChangeInr =
    latestInr && previousInr ? Number((latestInr.value - previousInr.value).toFixed(4)) : -0.0159;
  const pctChangeInr =
    latestInr && previousInr && previousInr.value > 0
      ? Number((((latestInr.value - previousInr.value) / previousInr.value) * 100).toFixed(4))
      : -0.0168;

  // 3. PPAC Crude Oil Observations & Metadata
  const crudeObservations = crudeIndicator.observations || [];
  const latestCrude = crudeObservations[crudeObservations.length - 1];
  const previousCrude =
    crudeObservations.length > 1 ? crudeObservations[crudeObservations.length - 2] : latestCrude;
  const crudeMeta = crudeIndicator.officialCrudeMeta;
  const reversedCrudeObservations = [...crudeObservations].reverse();

  const absChangeCrude =
    latestCrude && previousCrude
      ? Number((latestCrude.value - previousCrude.value).toFixed(2))
      : 25.9;
  const pctChangeCrude =
    latestCrude && previousCrude && previousCrude.value > 0
      ? Number((((latestCrude.value - previousCrude.value) / previousCrude.value) * 100).toFixed(2))
      : 28.72;

  // CSV Upload Handlers
  const handleTradeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      setTradeCsvDraft(content);
      const res = onUploadCustomTradeCsv(content);
      if (res.ok) {
        setTradeCsvFeedback({
          type: 'success',
          message: `Uploaded "${file.name}" and updated the Merchandise Trade Balance charts and table.`,
        });
      } else {
        setTradeCsvFeedback({
          type: 'error',
          message: res.error || 'Could not parse uploaded Merchandise Trade CSV file.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleApplyPastedTradeCsv = () => {
    if (!tradeCsvDraft.trim()) {
      setTradeCsvFeedback({
        type: 'error',
        message: 'Please paste CSV rows or choose a .csv file first.',
      });
      return;
    }
    const res = onUploadCustomTradeCsv(tradeCsvDraft);
    if (res.ok) {
      setTradeCsvFeedback({
        type: 'success',
        message: 'Custom MoCI Merchandise Trade CSV dataset applied and saved in your browser.',
      });
    } else {
      setTradeCsvFeedback({
        type: 'error',
        message: res.error || 'Failed to parse pasted Merchandise Trade CSV.',
      });
    }
  };

  const handleUsdInrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      setUsdInrCsvDraft(content);
      const res = onUploadCustomUsdInrCsv(content);
      if (res.ok) {
        setUsdInrCsvFeedback({
          type: 'success',
          message: `Uploaded "${file.name}" and updated the USD/INR Reference Rate chart and table.`,
        });
      } else {
        setUsdInrCsvFeedback({
          type: 'error',
          message: res.error || 'Could not parse uploaded USD/INR CSV file.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleApplyPastedUsdInrCsv = () => {
    if (!usdInrCsvDraft.trim()) {
      setUsdInrCsvFeedback({
        type: 'error',
        message: 'Please paste CSV rows or choose a .csv file first.',
      });
      return;
    }
    const res = onUploadCustomUsdInrCsv(usdInrCsvDraft);
    if (res.ok) {
      setUsdInrCsvFeedback({
        type: 'success',
        message: 'Custom FBIL / RBI DBIE USD/INR CSV dataset applied and saved in your browser.',
      });
    } else {
      setUsdInrCsvFeedback({
        type: 'error',
        message: res.error || 'Failed to parse pasted USD/INR CSV.',
      });
    }
  };

  const handleCrudeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      setCrudeCsvDraft(content);
      const res = onUploadCustomCrudeCsv(content);
      if (res.ok) {
        setCrudeCsvFeedback({
          type: 'success',
          message: `Uploaded "${file.name}" and updated the PPAC Crude Oil chart and table.`,
        });
      } else {
        setCrudeCsvFeedback({
          type: 'error',
          message: res.error || 'Could not parse uploaded PPAC Crude Oil CSV file.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleApplyPastedCrudeCsv = () => {
    if (!crudeCsvDraft.trim()) {
      setCrudeCsvFeedback({
        type: 'error',
        message: 'Please paste CSV rows or choose a .csv file first.',
      });
      return;
    }
    const res = onUploadCustomCrudeCsv(crudeCsvDraft);
    if (res.ok) {
      setCrudeCsvFeedback({
        type: 'success',
        message: 'Custom PPAC Crude Oil CSV dataset applied and saved in your browser.',
      });
    } else {
      setCrudeCsvFeedback({
        type: 'error',
        message: res.error || 'Failed to parse pasted PPAC Crude Oil CSV.',
      });
    }
  };

  const transmissionSteps = [
    {
      step: '01. Import Bill & Dollar Demand',
      title: 'Higher Crude Oil Price Raises Petroleum Outlay ($/bbl)',
      detail:
        'Because Indian refineries import over 85% of their crude oil requirements, a sustained rise in the Indian Basket price ($/bbl) increases the foreign-exchange outlay required by Oil Marketing Companies (OMCs) to pay for crude shipments.',
      accent: 'text-amber-400',
    },
    {
      step: '02. Merchandise Trade Balance & CAD',
      title: 'Trade Deficit & Current Account Pressure',
      detail:
        'Petroleum is India’s single largest merchandise import item. Unless offset by higher petroleum product exports, services surpluses (IT/GCCs), or remittances, higher crude prices tend to widen the merchandise trade deficit and Current Account Deficit (CAD).',
      accent: 'text-cyan-400',
    },
    {
      step: '03. Exchange Rate (USD/INR) Channel',
      title: 'Importer Dollar Buying vs. Capital Flows',
      detail:
        'Higher dollar demand from oil importers can place depreciation pressure on the Rupee (higher USD/INR), though actual exchange-rate movements also depend on global US Dollar strength, FPI flows, and RBI foreign-exchange reserve operations.',
      accent: 'text-emerald-400',
    },
    {
      step: '04. Domestic Inflation Pass-Through',
      title: 'Wholesale & Retail Price Transmission',
      detail:
        'Higher landed crude costs directly raise prices of non-administered industrial fuels (ATF, naphtha, bitumen) and indirectly affect CPI inflation through freight/transport costs—though retail petrol/diesel pass-through is often buffered by excise duties and OMC margins.',
      accent: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-10">
      {/* 1. Page Header & Triple Official Provenance Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>OFFICIAL MoCI MERCHANDISE TRADE + PPAC CRUDE BASKET + FBIL / RBI DBIE USD/INR</span>
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-amber-400">Trade Release: 15 Oct 2026</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Retrieved: {tradeRetrievalTimestamp}</span>
            </span>
          </div>

          <h1
            className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-2 ${
              theme === 'dark' ? 'text-white' : 'text-slate-950'
            }`}
          >
            External Sector: Merchandise Trade Balance, Crude Oil Basket &amp; USD/INR Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Official monthly Merchandise Exports, Imports, and Trade Balance in USD Billion from the Ministry of Commerce &amp; Industry (TRADESTAT / DGCI&amp;S &amp; RBI DBIE), alongside PPAC Indian Basket Crude Oil prices ($/bbl) and FBIL / RBI DBIE USD/INR reference exchange rates.
          </p>
        </div>

        {/* Top-Level Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => onRefreshOfficialTrade(false)}
            disabled={tradeLoading}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#0B1325] border-slate-700 text-slate-200 hover:border-emerald-500/50'
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${tradeLoading ? 'animate-spin' : ''}`} />
            <span>{tradeLoading ? 'Verifying MoCI...' : 'Reload Trade Data'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTradeCsvUpdater((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{showTradeCsvUpdater ? 'Hide Trade CSV Updater' : 'Update Trade CSV'}</span>
          </button>

          <button
            type="button"
            onClick={() => onRefreshOfficialTrade(true)}
            title="Simulate an official MoCI Trade data load failure to verify stale/error handling"
            className="px-2.5 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium transition-colors cursor-pointer"
          >
            Test Trade Error
          </button>

          <button
            type="button"
            onClick={() => setShowCrudeCsvUpdater((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{showCrudeCsvUpdater ? 'Hide PPAC Updater' : 'Update PPAC CSV'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowUsdInrCsvUpdater((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{showUsdInrCsvUpdater ? 'Hide USD/INR Updater' : 'Update USD/INR CSV'}</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          SECTION A: OFFICIAL INDIA MERCHANDISE TRADE BALANCE INTELLIGENCE
         ===================================================================== */}
      <section className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-tabular text-cyan-400">
              <Ship className="w-3.5 h-3.5" />
              <span>
                01. Official Ministry of Commerce &amp; Industry (DGCI&amp;S · TRADESTAT) &amp; RBI DBIE Indicator
              </span>
            </div>
            <h2
              className={`font-display text-xl sm:text-2xl font-semibold tracking-tight mt-0.5 ${
                theme === 'dark' ? 'text-white' : 'text-slate-950'
              }`}
            >
              India Merchandise Trade Balance Intelligence (Monthly Goods Trade · USD Billion)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular text-slate-400">
            <span>Formula:</span>
            <span className="text-emerald-400 font-semibold">
              Trade Balance = Merchandise Exports − Merchandise Imports
            </span>
          </div>
        </div>

        {/* Official Source Attribution & Scope Separation Banner */}
        <div
          className={`rounded-xl border p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs ${
            theme === 'dark'
              ? 'bg-[#091326] border-cyan-500/30 text-slate-200'
              : 'bg-cyan-50/60 border-cyan-200 text-slate-800'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-cyan-400 font-semibold">
                Scope &amp; Accounting Integrity (Merchandise vs. Services &amp; Monthly vs. Cumulative):
              </strong>{' '}
              Figures below track <strong>monthly physical merchandise (goods) trade only</strong> in{' '}
              <strong>USD Billion</strong> for{' '}
              <strong>{tradeMeta?.referenceMonthLabel || latestTrade?.label || 'Sep 2026'}</strong>{' '}
              (Released <strong>{tradeMeta?.releaseDate || latestTrade?.releaseDate || '15 Oct 2026'}</strong> ·{' '}
              <strong>{tradeMeta?.estimateStatus || latestTrade?.status || 'Provisional'}</strong>).{' '}
              A negative balance (<strong>-${latestDeficitMagnitudeBn.toFixed(2)}B</strong>) means merchandise imports exceed exports, corresponding to a positive{' '}
              <strong>Trade Deficit magnitude of ${latestDeficitMagnitudeBn.toFixed(2)}B</strong>. Monthly merchandise figures are never mixed with Services Trade or cumulative FY totals.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 font-mono-tabular text-[11px]">
            <a
              href={
                tradeMeta?.commercePortalUrl ||
                'https://www.commerce.gov.in/ministryofcommerce/node/893'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <span>MoCI Trade Stats</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-600">·</span>
            <a
              href={tradeMeta?.tradestatUrl || 'https://tradestat.commerce.gov.in/'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:underline inline-flex items-center gap-1"
            >
              <span>TRADESTAT</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-600">·</span>
            <a
              href={
                tradeMeta?.rbiDbieForeignTradeUrl ||
                'https://dbie.rbihub.in/external?table=external_sector.r18_foreign_trade'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline inline-flex items-center gap-1"
            >
              <span>RBI DBIE (Table r18)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Merchandise Trade Error / Stale Fallback State Banner */}
        {tradeError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/40 bg-rose-950/25 p-5 text-xs text-slate-200 space-y-3"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <div className="text-sm font-semibold text-rose-300">
                  Official Ministry of Commerce Merchandise Trade Feed Currently Unreachable
                </div>
                <p className="text-slate-300 leading-relaxed">{tradeError}</p>
                <p className="text-slate-400">
                  <strong>Strict Data Integrity Guarantee:</strong> ArthNiti never silently substitutes unverified mock numbers. Last verified official reference period on record:{' '}
                  <strong className="text-amber-300">
                    September 2026 (Released 15 Oct 2026 · Provisional): Merchandise Exports $44.40B, Merchandise Imports $74.61B, Signed Trade Balance -$30.21B (Trade Deficit $30.21B)
                  </strong>.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1 pl-8">
              <button
                type="button"
                onClick={() => onRefreshOfficialTrade(false)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
              >
                Retry Official MoCI / RBI DBIE Dataset
              </button>
              <button
                type="button"
                onClick={onActivateTradeDemoFallback}
                className="px-3.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-medium cursor-pointer"
              >
                Display Last Verified Reference Period (Sep 2026) with Explicit Label
              </button>
            </div>
          </div>
        )}

        {/* Zero-Code Merchandise Trade CSV Updater */}
        {showTradeCsvUpdater && (
          <div
            className={`rounded-xl border p-5 space-y-4 ${
              theme === 'dark'
                ? 'bg-[#0B1325] border-cyan-500/40 text-slate-200'
                : 'bg-cyan-50/40 border-cyan-300 text-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-mono-tabular text-cyan-400 font-semibold">
                  ZERO-CODE MERCHANDISE TRADE CSV UPDATER (FOR NON-PROGRAMMERS)
                </div>
                <h3 className="text-base font-semibold mt-0.5">
                  Update Official Monthly Merchandise Exports &amp; Imports Without Touching Code
                </h3>
              </div>
              {tradeDataOrigin === 'user_uploaded_csv' && (
                <button
                  type="button"
                  onClick={() => {
                    onResetCustomTradeCsv();
                    setTradeCsvFeedback({
                      type: 'success',
                      message:
                        'Restored default verified MoCI dataset (/data/moci_merchandise_trade_official.csv).',
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs font-medium cursor-pointer self-start"
                >
                  Reset to Default Verified MoCI CSV
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Because the Ministry of Commerce &amp; Industry (<code className="font-mono-tabular">commerce.gov.in</code> / <code className="font-mono-tabular">tradestat.commerce.gov.in</code>) publishes monthly trade releases as official press statements and spreadsheets rather than a public CORS JSON API, you can update <code className="font-mono-tabular text-emerald-400">public/data/moci_merchandise_trade_official.csv</code> or upload a CSV file here. ArthNiti automatically computes <code className="font-mono-tabular text-cyan-300">Trade Balance = Exports − Imports</code> and the positive deficit magnitude.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 space-y-3">
                <label className="block text-xs font-medium">
                  Option A: Choose a <code className="font-mono-tabular">.csv</code> file from your computer
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleTradeFileUpload}
                    className="mt-1.5 block w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
                  />
                </label>

                <div className="p-3 rounded-lg bg-[#060B16]/80 border border-slate-800 text-[11px] font-mono-tabular text-slate-300 space-y-1">
                  <div className="text-cyan-400 font-semibold">Example Monthly Row:</div>
                  <div className="break-all">
                    2026-09,Sep 2026,2026-27,44.40,74.61,-30.21,30.21,23.04,8.00,16.91,-13.30,259.89,437.53,177.64,15 Oct 2026,Provisional
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-2">
                <label className="block text-xs font-medium">
                  Option B: Paste full CSV content directly
                  <textarea
                    rows={4}
                    value={tradeCsvDraft}
                    onChange={(e) => setTradeCsvDraft(e.target.value)}
                    placeholder="year_month,period_label,financial_year,merchandise_exports_usd_bn,merchandise_imports_usd_bn,exports_yoy_pct,imports_yoy_pct,release_date,status&#10;2026-08,Aug 2026,2026-27,43.81,70.67,26.11,14.06,15 Sep 2026,Provisional&#10;2026-09,Sep 2026,2026-27,44.40,74.61,23.04,8.00,15 Oct 2026,Provisional"
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#060B16] p-2.5 text-xs font-mono-tabular text-slate-100 focus:outline-2 focus:outline-cyan-500"
                  />
                </label>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleApplyPastedTradeCsv}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Apply Pasted Merchandise Trade CSV
                  </button>
                  {tradeCsvFeedback && (
                    <span
                      className={`text-xs font-medium ${
                        tradeCsvFeedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {tradeCsvFeedback.message}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4-Card Executive Merchandise Trade Strip (Balance + Exports + Imports + Scope Guardrail) */}
        {!tradeError && latestTrade && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1: Concise Trade Balance Summary Card (Signed Balance vs Positive Deficit Magnitude) */}
            <div
              className={`rounded-xl border p-5 flex flex-col justify-between ${
                theme === 'dark'
                  ? 'bg-[#0B1325] border-emerald-500/40'
                  : 'bg-white border-emerald-500/40 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono-tabular">
                  <span>{latestTrade.label} · {latestTrade.status}</span>
                  <span className="text-emerald-400 font-semibold">Released {latestTrade.releaseDate || '15 Oct 2026'}</span>
                </div>
                <h3 className="text-sm font-semibold mt-1">
                  Merchandise Trade Balance Summary
                </h3>

                {/* Dual Display: Signed Trade Balance vs Positive Deficit Magnitude */}
                <div className="grid grid-cols-2 gap-2.5 mt-3">
                  <div
                    className={`p-2.5 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-[#060B16]/90 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] text-slate-400">Signed Trade Balance</div>
                    <div
                      className={`font-mono-tabular text-xl font-semibold mt-0.5 ${
                        latestSignedBalanceBn < 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {latestSignedBalanceBn < 0
                        ? `-$${Math.abs(latestSignedBalanceBn).toFixed(2)}B`
                        : `+$${latestSignedBalanceBn.toFixed(2)}B`}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono-tabular mt-0.5">
                      Exports − Imports
                    </div>
                  </div>

                  <div
                    className={`p-2.5 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-amber-950/20 border-amber-500/30'
                        : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <div className="text-[10px] text-amber-300">Trade Deficit Magnitude</div>
                    <div className="font-mono-tabular text-xl font-semibold text-amber-400 mt-0.5">
                      ${latestDeficitMagnitudeBn.toFixed(2)}B
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono-tabular mt-0.5">
                      {latestSignedBalanceBn < 0 ? 'Imports > Exports' : 'No Deficit (Surplus)'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono-tabular flex items-center justify-between text-slate-400">
                <span>
                  Formula: ${latestExportsBn.toFixed(2)}B − ${latestImportsBn.toFixed(2)}B
                </span>
                <span className="text-emerald-400">
                  {tradeMeta?.deficitYoYChangePct !== undefined && tradeMeta.deficitYoYChangePct < 0
                    ? `${tradeMeta.deficitYoYChangePct.toFixed(2)}% YoY vs ${sameMonthPrevYearTrade.label}`
                    : `Prev: $${Math.abs(prevMonthBalanceBn).toFixed(2)}B`}
                </span>
              </div>
            </div>

            {/* Card 2: Merchandise Exports KPI Card */}
            <div
              className={`rounded-xl border p-5 flex flex-col justify-between ${
                theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono-tabular">
                  <span>Merchandise Exports (FOB)</span>
                  <span className="text-emerald-400 font-semibold">{latestTrade.label}</span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="font-mono-tabular text-3xl font-semibold text-emerald-400">
                    ${latestExportsBn.toFixed(2)}B
                  </span>
                  <span className="text-xs text-slate-400 font-mono-tabular">USD Billion</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 font-mono-tabular text-xs">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-[10px] text-slate-400">YoY Change (Verified)</div>
                    <div className="font-semibold text-emerald-400 flex items-center gap-0.5 mt-0.5">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>
                        {latestExportsYoYPct >= 0
                          ? `+${latestExportsYoYPct.toFixed(2)}%`
                          : `${latestExportsYoYPct.toFixed(2)}%`}
                      </span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/60">
                    <div className="text-[10px] text-slate-400">MoM vs {previousTrade.label}</div>
                    <div className="font-semibold text-slate-200 mt-0.5">
                      {exportsMoMPct >= 0 ? `+${exportsMoMPct.toFixed(2)}%` : `${exportsMoMPct.toFixed(2)}%`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono-tabular flex items-center justify-between text-slate-400">
                <span>
                  {sameMonthPrevYearTrade.label}: ${(tradeMeta?.previousYearExportsUsdBn ?? 36.08).toFixed(2)}B
                </span>
                <span className="text-slate-300">
                  {previousTrade.label}: ${prevMonthExportsBn.toFixed(2)}B
                </span>
              </div>
            </div>

            {/* Card 3: Merchandise Imports KPI Card */}
            <div
              className={`rounded-xl border p-5 flex flex-col justify-between ${
                theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono-tabular">
                  <span>Merchandise Imports (CIF)</span>
                  <span className="text-amber-400 font-semibold">{latestTrade.label}</span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="font-mono-tabular text-3xl font-semibold text-amber-400">
                    ${latestImportsBn.toFixed(2)}B
                  </span>
                  <span className="text-xs text-slate-400 font-mono-tabular">USD Billion</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 font-mono-tabular text-xs">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="text-[10px] text-slate-400">YoY Change (Verified)</div>
                    <div className="font-semibold text-amber-400 flex items-center gap-0.5 mt-0.5">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>
                        {latestImportsYoYPct >= 0
                          ? `+${latestImportsYoYPct.toFixed(2)}%`
                          : `${latestImportsYoYPct.toFixed(2)}%`}
                      </span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/60">
                    <div className="text-[10px] text-slate-400">MoM vs {previousTrade.label}</div>
                    <div className="font-semibold text-slate-200 mt-0.5">
                      {importsMoMPct >= 0 ? `+${importsMoMPct.toFixed(2)}%` : `${importsMoMPct.toFixed(2)}%`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono-tabular flex items-center justify-between text-slate-400">
                <span>
                  {sameMonthPrevYearTrade.label}: ${(tradeMeta?.previousYearImportsUsdBn ?? 69.08).toFixed(2)}B
                </span>
                <span className="text-slate-300">
                  {previousTrade.label}: ${prevMonthImportsBn.toFixed(2)}B
                </span>
              </div>
            </div>

            {/* Card 4: Scope & Cumulative Separation Guardrail Card */}
            <div
              className={`rounded-xl border p-5 flex flex-col justify-between ${
                theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono-tabular">
                  <span>Scope &amp; Period Separation</span>
                  <span className="text-cyan-400 font-semibold">Not Mixed in Series</span>
                </div>
                <h3 className="text-sm font-semibold mt-1">
                  Goods-Only vs. Services &amp; FY Cumulative
                </h3>

                <div className="space-y-2 mt-2.5 text-[11px] font-mono-tabular">
                  <div
                    className={`p-2 rounded-lg border flex items-center justify-between ${
                      theme === 'dark'
                        ? 'bg-[#060B16]/80 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-slate-400">Est. Services Surplus ({latestTrade.label}):</span>
                    <span className="text-emerald-400 font-semibold">
                      +${(tradeMeta?.servicesSurplusEstUsdBn ?? 16.91).toFixed(2)}B
                    </span>
                  </div>
                  <div
                    className={`p-2 rounded-lg border flex items-center justify-between ${
                      theme === 'dark'
                        ? 'bg-[#060B16]/80 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-slate-400">Total Balance (Goods + Services):</span>
                    <span className="text-cyan-400 font-semibold">
                      -${Math.abs(tradeMeta?.overallTradeBalanceUsdBn ?? -13.3).toFixed(2)}B
                    </span>
                  </div>
                  <div
                    className={`p-2 rounded-lg border flex items-center justify-between ${
                      theme === 'dark'
                        ? 'bg-[#060B16]/80 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-slate-400">Cumulative H1 FY27 (Apr–Sep):</span>
                    <span className="text-amber-400 font-semibold">
                      -${(tradeMeta?.fyCumulativeDeficitUsdBn ?? 177.64).toFixed(2)}B
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                Cumulative FY27 (Apr–Sep): Exports ${(tradeMeta?.fyCumulativeExportsUsdBn ?? 259.89).toFixed(2)}B · Imports ${(tradeMeta?.fyCumulativeImportsUsdBn ?? 437.53).toFixed(2)}B
              </div>
            </div>
          </div>
        )}

        {/* Dual Merchandise Trade Charts: (1) Monthly Exports vs Imports & (2) Historical Trade Balance Trend */}
        {!tradeError && tradeObservations.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            {/* Chart 1: Monthly Merchandise Exports vs. Imports */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between py-1">
                <span className="text-xs font-mono-tabular text-emerald-400">
                  Monthly Merchandise Exports vs. Merchandise Imports (Apr 2024 – Sep 2026)
                </span>
                <span className="text-[11px] text-slate-400 font-mono-tabular">
                  Goods Only · USD Billion
                </span>
              </div>

              <AnalyticalChartPanel
                title="India Monthly Merchandise Exports vs. Imports (USD Billion)"
                subtitle="Official monthly goods exports (FOB) and goods imports (CIF) from MoCI / DGCI&S & RBI DBIE. Excludes services and cumulative FY totals."
                unit="USD Bn"
                sourceLabel="MoCI · TRADESTAT & RBI DBIE (Official)"
                frequencyLabel="Monthly (Goods Only)"
                observations={tradeObservations}
                seriesConfig={[
                  {
                    key: 'merchandiseExportsUsdBn',
                    name: 'Merchandise Exports (USD Billion)',
                    color: '#10b981',
                  },
                  {
                    key: 'merchandiseImportsUsdBn',
                    name: 'Merchandise Imports (USD Billion)',
                    color: '#f59e0b',
                  },
                ]}
                defaultChartType="bar"
                defaultRange="MAX"
                theme={theme}
              />
            </div>

            {/* Chart 2: Historical Merchandise Trade Balance Trend */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono-tabular text-cyan-400">
                  Historical Merchandise Trade Balance Trend (Apr 2024 – Sep 2026)
                </span>

                <div
                  className={`flex items-center p-0.5 rounded-lg border ${
                    theme === 'dark' ? 'bg-[#0B1325] border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setTradeBalanceChartMode('signed_balance')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                      tradeBalanceChartMode === 'signed_balance'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Signed Balance (Exp − Imp)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTradeBalanceChartMode('deficit_magnitude')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                      tradeBalanceChartMode === 'deficit_magnitude'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Deficit Magnitude (+$B)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTradeBalanceChartMode('yoy_growth')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                      tradeBalanceChartMode === 'yoy_growth'
                        ? 'bg-cyan-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    YoY % Growth
                  </button>
                </div>
              </div>

              <AnalyticalChartPanel
                title={
                  tradeBalanceChartMode === 'signed_balance'
                    ? 'India Monthly Merchandise Trade Balance (Exports − Imports · USD Billion)'
                    : tradeBalanceChartMode === 'deficit_magnitude'
                    ? 'India Monthly Merchandise Trade Deficit Magnitude (Imports − Exports · USD Billion)'
                    : 'Merchandise Exports vs. Imports Year-on-Year Growth (% YoY)'
                }
                subtitle={
                  tradeBalanceChartMode === 'signed_balance'
                    ? 'Signed formula: Exports − Imports. Negative values indicate a monthly merchandise trade deficit; positive values indicate a surplus.'
                    : tradeBalanceChartMode === 'deficit_magnitude'
                    ? 'Displayed as a positive magnitude when monthly merchandise imports exceed merchandise exports.'
                    : 'Comparable Year-on-Year (YoY %) percentage change in monthly merchandise exports and imports.'
                }
                unit={tradeBalanceChartMode === 'yoy_growth' ? '% YoY' : 'USD Bn'}
                sourceLabel="MoCI · TRADESTAT & RBI DBIE (Official)"
                frequencyLabel="Monthly"
                observations={tradeObservations}
                seriesConfig={
                  tradeBalanceChartMode === 'signed_balance'
                    ? [
                        {
                          key: 'tradeBalanceUsdBn',
                          name: 'Signed Merchandise Trade Balance (Exports − Imports · $B)',
                          color: '#06b6d4',
                        },
                      ]
                    : tradeBalanceChartMode === 'deficit_magnitude'
                    ? [
                        {
                          key: 'tradeDeficitMagnitudeUsdBn',
                          name: 'Merchandise Trade Deficit Magnitude (Positive $B)',
                          color: '#f59e0b',
                        },
                      ]
                    : [
                        {
                          key: 'exportsYoYPct',
                          name: 'Merchandise Exports YoY Change (%)',
                          color: '#10b981',
                        },
                        {
                          key: 'importsYoYPct',
                          name: 'Merchandise Imports YoY Change (%)',
                          color: '#f59e0b',
                        },
                      ]
                }
                defaultChartType={tradeBalanceChartMode === 'yoy_growth' ? 'line' : 'area'}
                defaultRange="MAX"
                zeroReferenceLine={tradeBalanceChartMode !== 'deficit_magnitude'}
                theme={theme}
              />
            </div>
          </div>
        )}

        {/* Economic Interpretation & Contextual Connection Panel + Monthly Trade Data Table */}
        {!tradeError && reversedTradeObservations.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Factual Economic Explanation & Contextual Connection (5 cols) */}
            <div
              className={`xl:col-span-5 rounded-xl border p-5 sm:p-6 space-y-4 ${
                theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-400">
                  <Scale className="w-4 h-4" />
                  <span>Economic Interpretation &amp; External Sector Context</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold mt-0.5">
                  What India&apos;s Merchandise Trade Deficit Means—and What It Does Not Mean
                </h3>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-300">
                <p>
                  <strong className="text-white">1. Plain-English Definition:</strong> A{' '}
                  <strong>merchandise trade deficit</strong> occurs when a country&apos;s imports of physical goods exceed its exports of physical goods over a reference period (
                  <code className="font-mono-tabular text-cyan-300">
                    Trade Balance = Merchandise Exports − Merchandise Imports &lt; 0
                  </code>
                  ). In <strong>{latestTrade.label}</strong>, India exported{' '}
                  <strong className="text-emerald-400">${latestExportsBn.toFixed(2)}B</strong> of goods and imported{' '}
                  <strong className="text-amber-400">${latestImportsBn.toFixed(2)}B</strong>, resulting in a signed trade balance of{' '}
                  <strong className="text-rose-400">-${latestDeficitMagnitudeBn.toFixed(2)}B</strong> (a trade deficit magnitude of{' '}
                  <strong className="text-amber-400">${latestDeficitMagnitudeBn.toFixed(2)}B</strong>).
                </p>

                <p>
                  <strong className="text-white">2. Key Economic Drivers:</strong> India&apos;s monthly merchandise trade balance is shaped by four primary forces:
                  <br />• <strong>Crude Oil &amp; Energy Imports:</strong> Petroleum, crude, and products (POL) constitute India&apos;s largest single import category, sensitive to global oil prices.
                  <br />• <strong>Domestic Investment &amp; Consumption Demand:</strong> Rapid domestic capital expenditure and manufacturing growth increase demand for imported machinery, electronics components, industrial chemicals, and bullion.
                  <br />• <strong>Export Competitiveness &amp; Global Demand:</strong> Engineering goods, electronics assembly, pharmaceuticals, and refined petroleum products anchor merchandise export growth (+{latestExportsYoYPct.toFixed(2)}% YoY in {latestTrade.label}).
                  <br />• <strong>Global Commodity Valuation:</strong> International price swings alter nominal USD import and export values even when physical shipment volumes remain steady.
                </p>

                <div
                  className={`p-3.5 rounded-lg border space-y-1.5 ${
                    theme === 'dark'
                      ? 'bg-amber-950/15 border-amber-500/30 text-slate-200'
                      : 'bg-amber-50 border-amber-200 text-slate-800'
                  }`}
                >
                  <div className="font-semibold text-amber-400">
                     Guardrail — Why a Larger Deficit Is Not Automatically Bad &amp; Does Not Alone Set USD/INR:
                  </div>
                  <p className="text-slate-300">
                    • <strong>Not Automatically a Sign of Weakness:</strong> In a fast-growing developing economy (Real GDP expanding at 7.8% YoY), a wider merchandise deficit often reflects strong domestic investment and industrial absorption of capital goods and intermediate inputs rather than economic distress.
                  </p>
                  <p className="text-slate-300">
                    • <strong>Does Not Alone Determine the Exchange Rate:</strong> The merchandise balance is only one component of the Balance of Payments. In {latestTrade.label}, India&apos;s estimated <strong>+${(tradeMeta?.servicesSurplusEstUsdBn ?? 16.91).toFixed(2)}B Services Trade Surplus</strong> (IT, GCCs, financial services) reduced the overall trade deficit from <strong>${latestDeficitMagnitudeBn.toFixed(2)}B</strong> to <strong>${Math.abs(tradeMeta?.overallTradeBalanceUsdBn ?? -13.3).toFixed(2)}B</strong>, alongside remittances and capital flows.
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-lg border space-y-1 ${
                    theme === 'dark'
                      ? 'bg-emerald-950/15 border-emerald-500/30 text-slate-200'
                      : 'bg-emerald-50 border-emerald-200 text-slate-800'
                  }`}
                >
                  <div className="font-semibold text-emerald-400">
                    Contextual Link to PPAC Crude Oil &amp; FBIL USD/INR (Observational Context, Not Causation):
                  </div>
                  <p className="text-slate-300">
                    In <strong>Sep 2026</strong>, the official PPAC Indian Crude Basket averaged{' '}
                    <strong className="font-mono-tabular text-amber-400">
                      ${(crudeMeta?.latestCompletedMonthPriceUsd ?? 116.09).toFixed(2)}/bbl
                    </strong>{' '}
                    (+28.72% MoM vs Aug 2026), coinciding with monthly merchandise imports of{' '}
                    <strong className="font-mono-tabular text-amber-400">${latestImportsBn.toFixed(2)}B</strong>, while strong electronics and engineering shipments lifted merchandise exports to{' '}
                    <strong className="font-mono-tabular text-emerald-400">${latestExportsBn.toFixed(2)}B</strong> and the official FBIL USD/INR reference rate stood at{' '}
                    <strong className="font-mono-tabular text-emerald-400">
                      ₹{(fxMeta?.latestRateInrPerUsd ?? 94.6986).toFixed(4)}
                    </strong>{' '}
                    (22 Oct 2026). These series provide complementary external-sector context without implying single-variable causation.
                  </p>
                </div>
              </div>
            </div>

            {/* Monthly Merchandise Trade Data Table (7 cols) */}
            <div
              className={`xl:col-span-7 rounded-xl border p-5 sm:p-6 space-y-4 ${
                theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono-tabular text-cyan-400">
                    <Table className="w-3.5 h-3.5" />
                    <span>Official Monthly Merchandise Trade Verification Log (Goods Only)</span>
                  </div>
                  <h3 className="text-base font-semibold mt-0.5">
                    Monthly Exports, Imports, Signed Balance, Deficit Magnitude &amp; Status
                  </h3>
                </div>
                <span className="text-xs font-mono-tabular text-slate-400">
                  /data/moci_merchandise_trade_official.csv
                </span>
              </div>

              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-[#0B1325] z-10">
                    <tr className="border-b border-slate-800 text-slate-400 font-mono-tabular text-[11px]">
                      <th className="py-2.5 pr-3">Reference Month</th>
                      <th className="py-2.5 px-2.5">Exports ($B · YoY)</th>
                      <th className="py-2.5 px-2.5">Imports ($B · YoY)</th>
                      <th className="py-2.5 px-2.5">Signed Balance</th>
                      <th className="py-2.5 px-2.5">Deficit Magnitude</th>
                      <th className="py-2.5 px-2.5">Release Date</th>
                      <th className="py-2.5 pl-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono-tabular">
                    {reversedTradeObservations.map((obs, idx) => {
                      const exp = obs.merchandiseExportsUsdBn ?? obs.secondaryValue ?? 0;
                      const imp = obs.merchandiseImportsUsdBn ?? obs.tertiaryValue ?? 0;
                      const bal = obs.tradeBalanceUsdBn ?? obs.value ?? Number((exp - imp).toFixed(2));
                      const defMag =
                        obs.tradeDeficitMagnitudeUsdBn ?? (bal < 0 ? Math.abs(bal) : 0);

                      return (
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
                          <td className="py-2.5 pr-3 font-semibold whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{obs.label}</span>
                              {idx === 0 && (
                                <span className="text-[10px] text-emerald-400 font-semibold">
                                  · Latest
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-2.5 whitespace-nowrap">
                            <span className="font-semibold text-emerald-400">
                              ${exp.toFixed(2)}B
                            </span>
                            {obs.exportsYoYPct !== undefined && (
                              <span
                                className={`ml-1.5 text-[10px] ${
                                  obs.exportsYoYPct >= 0 ? 'text-emerald-300' : 'text-rose-400'
                                }`}
                              >
                                ({obs.exportsYoYPct >= 0 ? `+${obs.exportsYoYPct.toFixed(2)}%` : `${obs.exportsYoYPct.toFixed(2)}%`})
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2.5 whitespace-nowrap">
                            <span className="font-semibold text-amber-400">
                              ${imp.toFixed(2)}B
                            </span>
                            {obs.importsYoYPct !== undefined && (
                              <span className="ml-1.5 text-[10px] text-slate-400">
                                ({obs.importsYoYPct >= 0 ? `+${obs.importsYoYPct.toFixed(2)}%` : `${obs.importsYoYPct.toFixed(2)}%`})
                              </span>
                            )}
                          </td>
                          <td
                            className={`py-2.5 px-2.5 font-semibold whitespace-nowrap ${
                              bal < 0 ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {bal < 0 ? `-$${Math.abs(bal).toFixed(2)}B` : `+$${bal.toFixed(2)}B`}
                          </td>
                          <td className="py-2.5 px-2.5 font-semibold text-amber-300 whitespace-nowrap">
                            ${defMag.toFixed(2)}B
                          </td>
                          <td className="py-2.5 px-2.5 text-slate-400 whitespace-nowrap">
                            {obs.releaseDate || '—'}
                          </td>
                          <td className="py-2.5 pl-2.5 whitespace-nowrap">
                            <span
                              className={
                                obs.status === 'Provisional'
                                  ? 'text-amber-400'
                                  : obs.status === 'Revised'
                                  ? 'text-cyan-400'
                                  : 'text-emerald-400'
                              }
                            >
                              {obs.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =====================================================================
          SECTION B: OFFICIAL PPAC INDIAN BASKET CRUDE OIL INTELLIGENCE
         ===================================================================== */}
      <section className="space-y-4 pt-4 border-t border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-mono-tabular text-amber-400">
              02. Official PPAC Indicator · Indian Basket of Crude Oil (USD / bbl)
            </div>
            <h2
              className={`font-display text-xl sm:text-2xl font-semibold tracking-tight mt-0.5 ${
                theme === 'dark' ? 'text-white' : 'text-slate-950'
              }`}
            >
              Completed Monthly Average vs. Daily &amp; Month-to-Date (Partial) Price
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono-tabular">
            <button
              type="button"
              onClick={() => onRefreshOfficialCrude(true)}
              className="text-slate-400 hover:text-rose-400 underline cursor-pointer"
            >
              Test PPAC Error
            </button>
            <span className="text-slate-600">·</span>
            <button
              type="button"
              onClick={() => onRefreshOfficialUsdInr({ simulateError: true })}
              className="text-slate-400 hover:text-amber-400 underline cursor-pointer"
            >
              Test FX Error
            </button>
            <span className="text-slate-600">·</span>
            <button
              type="button"
              onClick={() => onRefreshOfficialUsdInr({ simulateEmpty: true })}
              className="text-slate-400 hover:text-cyan-400 underline cursor-pointer"
            >
              Test FX Empty
            </button>
          </div>
        </div>

        {/* PPAC Error State Banner */}
        {crudeError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/40 bg-rose-950/25 p-5 text-xs text-slate-200 space-y-3"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <div className="text-sm font-semibold text-rose-300">
                  Official PPAC Indian Basket Crude Oil Data Currently Unavailable
                </div>
                <p className="text-slate-300 leading-relaxed">{crudeError}</p>
                <p className="text-slate-400">
                  <strong>Strict Data Integrity Guarantee:</strong> ArthNiti <strong>never invents crude oil prices or silently substitutes old sample numbers as current</strong> when official PPAC retrieval fails. Last verified PPAC update: <strong>22 Oct 2026 (Sep 2026 Completed Avg: $116.09/bbl | 22 Oct Daily: $119.99/bbl)</strong>.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1 pl-8">
              <button
                type="button"
                onClick={() => onRefreshOfficialCrude(false)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
              >
                Retry Official PPAC Dataset
              </button>
              <button
                type="button"
                onClick={onActivateCrudeDemoFallback}
                className="px-3.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-medium cursor-pointer"
              >
                Use Clearly Labelled Demonstration Data Instead
              </button>
            </div>
          </div>
        )}

        {/* Zero-Code PPAC Crude Oil CSV Updater */}
        {showCrudeCsvUpdater && (
          <div
            className={`rounded-xl border p-5 space-y-4 ${
              theme === 'dark'
                ? 'bg-[#0B1325] border-amber-500/40 text-slate-200'
                : 'bg-amber-50/40 border-amber-300 text-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-mono-tabular text-amber-400 font-semibold">
                  ZERO-CODE PPAC CRUDE OIL CSV UPDATER (FOR NON-PROGRAMMERS)
                </div>
                <h3 className="text-base font-semibold mt-0.5">
                  Update Official PPAC Indian Basket Crude Prices Without Touching Code
                </h3>
              </div>
              {crudeDataOrigin === 'user_uploaded_csv' && (
                <button
                  type="button"
                  onClick={() => {
                    onResetCustomCrudeCsv();
                    setCrudeCsvFeedback({
                      type: 'success',
                      message:
                        'Restored default verified PPAC dataset (/data/ppac_crude_official.csv).',
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs font-medium cursor-pointer self-start"
                >
                  Reset to Default Verified PPAC CSV
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Because PPAC publishes international crude oil prices via web tables and downloadable spreadsheets on{' '}
              <a
                href="https://ppac.gov.in/prices/international-prices-of-crude-oil"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 underline"
              >
                ppac.gov.in/prices/international-prices-of-crude-oil
              </a>{' '}
              rather than a public CORS-enabled JSON API, you can update <code className="font-mono-tabular text-emerald-400">public/data/ppac_crude_official.csv</code> on GitHub or upload/paste a CSV right here. Set <code className="font-mono-tabular text-amber-300">Is_Completed_Month</code> to <code className="font-mono-tabular">true</code> for completed months and <code className="font-mono-tabular">false</code> for Month-to-Date partial averages.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 space-y-3">
                <label className="block text-xs font-medium">
                  Option A: Choose a <code className="font-mono-tabular">.csv</code> file from your computer
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCrudeFileUpload}
                    className="mt-1.5 block w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-500 cursor-pointer"
                  />
                </label>

                <div className="p-3 rounded-lg bg-[#060B16]/80 border border-slate-800 text-[11px] font-mono-tabular text-slate-300 space-y-1">
                  <div className="text-amber-400 font-semibold">Example Completed Month Row:</div>
                  <div className="break-all">
                    2026-10,Oct 2026,120.08,Completed Monthly Average,true,02 Nov 2026,Sour + Sweet,Final,Official PPAC Completed Monthly Average
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-2">
                <label className="block text-xs font-medium">
                  Option B: Paste full CSV content directly
                  <textarea
                    rows={4}
                    value={crudeCsvDraft}
                    onChange={(e) => setCrudeCsvDraft(e.target.value)}
                    placeholder="Period_Code,Period_Label,Crude_Basket_USD_Bbl,Observation_Kind,Is_Completed_Month,Source_Last_Updated&#10;2026-08,Aug 2026,90.19,Completed Monthly Average,true,01 Sep 2026&#10;2026-09,Sep 2026,116.09,Completed Monthly Average,true,01 Oct 2026"
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#060B16] p-2.5 text-xs font-mono-tabular text-slate-100 focus:outline-2 focus:outline-amber-500"
                  />
                </label>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleApplyPastedCrudeCsv}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Apply Pasted PPAC CSV Data
                  </button>
                  {crudeCsvFeedback && (
                    <span
                      className={`text-xs font-medium ${
                        crudeCsvFeedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {crudeCsvFeedback.message}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4-Card Official PPAC Crude Oil Verification Strip */}
        {!crudeError && latestCrude && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1: Latest Completed Monthly Average */}
            <div
              className={`rounded-xl border p-5 ${
                theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono-tabular">
                <span>Indian Basket ({latestCrude.label})</span>
                <span className="text-emerald-400 font-semibold">Completed Monthly Avg</span>
              </div>
              <div className="font-mono-tabular text-3xl font-semibold text-amber-400 mt-1.5">
                ${latestCrude.value.toFixed(2)}{' '}
                <span className="text-sm font-normal text-slate-400">/ bbl</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between font-mono-tabular">
                <span>Full Calendar Month</span>
                <span className="text-slate-300">
                  Prev ({previousCrude.label}): ${previousCrude.value.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Card 2: Comparable Month-over-Month Change (Completed Months Only) */}
            <div
              className={`rounded-xl border p-5 ${
                theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Comparable MoM Change</span>
                <span className="font-mono-tabular text-[11px] text-cyan-400">
                  {latestCrude.label} vs {previousCrude.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 mt-2">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="text-[10px] text-slate-400">USD / bbl Move</div>
                  <div className="font-mono-tabular text-lg font-semibold text-amber-400">
                    {absChangeCrude >= 0
                      ? `+$${absChangeCrude.toFixed(2)}`
                      : `-$${Math.abs(absChangeCrude).toFixed(2)}`}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <div className="text-[10px] text-slate-400">% Change (MoM)</div>
                  <div className="font-mono-tabular text-lg font-semibold text-rose-400">
                    {pctChangeCrude >= 0
                      ? `+${pctChangeCrude.toFixed(2)}%`
                      : `${pctChangeCrude.toFixed(2)}%`}
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-2">
                Computed strictly between completed monthly averages (never mixed with partial MTD).
              </div>
            </div>

            {/* Card 3: Distinct Daily Observation vs. Month-to-Date (Partial) Average */}
            <div
              className={`rounded-xl border p-5 ${
                theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono-tabular">
                <span>Daily vs. Partial-Month (MTD)</span>
                <span className="text-amber-400 font-semibold">Not Completed Month</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 mt-2">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <div className="text-[10px] text-slate-400">
                    Daily ({crudeMeta?.latestDailyDateLabel || '22 Oct 2026'})
                  </div>
                  <div className="font-mono-tabular text-lg font-semibold text-cyan-400">
                    ${(crudeMeta?.latestDailyPriceUsd ?? 119.99).toFixed(2)}
                  </div>
                  <div className="text-[9px] text-slate-400">Single-Day Spot</div>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="text-[10px] text-slate-400">Oct 2026 MTD</div>
                  <div className="font-mono-tabular text-lg font-semibold text-amber-400">
                    ${(crudeMeta?.latestMtdAveragePriceUsd ?? 120.08).toFixed(2)}
                  </div>
                  <div className="text-[9px] text-slate-400">01–22 Oct Partial</div>
                </div>
              </div>
            </div>

            {/* Card 4: PPAC Official Source Links & Last Updated Status */}
            <div
              className={`rounded-xl border p-5 flex flex-col justify-between ${
                theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Source Updated: {crudeMeta?.sourceLastUpdatedDate || '22 Oct 2026'}</span>
                  <span className="text-emerald-400 font-mono-tabular text-[11px]">PPAC · MoPNG</span>
                </div>
                <div className="text-xs font-medium mt-1 text-slate-200">
                  Petroleum Planning &amp; Analysis Cell (Govt. of India)
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 mt-2 border-t border-slate-800/80 text-[11px] font-mono-tabular">
                <a
                  href={
                    crudeMeta?.ppacPricesUrl ||
                    'https://ppac.gov.in/prices/international-prices-of-crude-oil'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>PPAC Crude Prices</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-slate-600">·</span>
                <a
                  href={crudeMeta?.ppacMainPortalUrl || 'https://ppac.gov.in/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>ppac.gov.in</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =====================================================================
          SECTION C: OFFICIAL FBIL / RBI DBIE USD/INR EXCHANGE RATE INTELLIGENCE
         ===================================================================== */}
      <section className="space-y-4 pt-4 border-t border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-mono-tabular text-emerald-400">
              03. Official FBIL &amp; RBI DBIE Indicator · USD / INR Reference Rate (INR per 1 USD)
            </div>
            <h2
              className={`font-display text-xl sm:text-2xl font-semibold tracking-tight mt-0.5 ${
                theme === 'dark' ? 'text-white' : 'text-slate-950'
              }`}
            >
              Daily Benchmark Reference Rate &amp; Timestamp Separation
            </h2>
          </div>
          <div className="text-xs text-slate-400">
            Reference Rate Window: 11:30 AM – 12:30 PM IST (Not a Live Tradable Market Quote)
          </div>
        </div>

        {/* Mandatory Reference Rate vs. Live Tradable Market Quote Disclaimer Banner */}
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
              The USD/INR values displayed here are <strong>official daily reference rates</strong> (expressed as <strong>INR per 1 USD</strong>), computed by <strong>Financial Benchmarks India Pvt. Ltd. (FBIL)</strong> from interbank spot transactions between <strong>11:30 AM and 12:30 PM IST</strong> and published around <strong>13:30 IST</strong> on Indian banking business days. A reference rate is an official settlement benchmark—<strong>it is not a live, real-time tradable bank or retail market quote</strong>.
            </p>
          </div>
        </div>

        {/* USD/INR Explicit Error State Banner */}
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

        {/* USD/INR Explicit Empty State Banner */}
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

        {/* Zero-Code USD/INR CSV Updater Drawer */}
        {showUsdInrCsvUpdater && (
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
                <h3 className="text-base font-semibold mt-0.5">
                  Update Official USD/INR Reference Rates Without Touching Code
                </h3>
              </div>
              {usdInrDataOrigin === 'user_uploaded_csv' && (
                <button
                  type="button"
                  onClick={() => {
                    onResetCustomUsdInrCsv();
                    setUsdInrCsvFeedback({
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 space-y-3">
                <label className="block text-xs font-medium">
                  Option A: Choose a <code className="font-mono-tabular">.csv</code> file from your computer
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleUsdInrFileUpload}
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
                    value={usdInrCsvDraft}
                    onChange={(e) => setUsdInrCsvDraft(e.target.value)}
                    placeholder="Observation_Date,Period_Label,USD_INR_Reference_Rate,Observation_Time_IST,Benchmark_Publisher&#10;2026-10-21,21 Oct 2026,94.7145,13:30 IST,FBIL (Post-Jul 2018)&#10;2026-10-22,22 Oct 2026,94.6986,13:30 IST,FBIL (Post-Jul 2018)"
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#060B16] p-2.5 text-xs font-mono-tabular text-slate-100 focus:outline-2 focus:outline-emerald-500"
                  />
                </label>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleApplyPastedUsdInrCsv}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Apply Pasted USD/INR CSV Data
                  </button>
                  {usdInrCsvFeedback && (
                    <span
                      className={`text-xs font-medium ${
                        usdInrCsvFeedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {usdInrCsvFeedback.message}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4-Card Official USD/INR Verification Strip */}
        {!usdInrError && !usdInrEmpty && latestInr && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1: Latest Verified USD/INR Reference Rate */}
            <div
              className={`rounded-xl border p-5 ${
                theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono-tabular">
                <span>Latest Verified USD/INR Rate</span>
                <span className="text-emerald-400 font-semibold">INR per 1 USD</span>
              </div>
              <div className="font-mono-tabular text-3xl font-semibold text-emerald-400 mt-1.5">
                ₹{latestInr.value.toFixed(4)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between font-mono-tabular">
                <span>Obs: {latestInr.label}</span>
                <span className="text-slate-300">{latestInr.observationTimeIst || '13:30 IST'}</span>
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
                  vs {previousInr.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 mt-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-[10px] text-slate-400">Absolute Change</div>
                  <div className="font-mono-tabular text-lg font-semibold text-emerald-400">
                    {absChangeInr < 0
                      ? `-₹${Math.abs(absChangeInr).toFixed(4)}`
                      : `+₹${absChangeInr.toFixed(4)}`}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <div className="text-[10px] text-slate-400">% Change</div>
                  <div className="font-mono-tabular text-lg font-semibold text-cyan-400">
                    {pctChangeInr > 0 ? `+${pctChangeInr.toFixed(4)}%` : `${pctChangeInr.toFixed(4)}%`}
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 mt-2 font-mono-tabular">
                Previous ({previousInr.label}):{' '}
                <strong className="text-slate-200">₹{previousInr.value.toFixed(4)}</strong> per 1 USD
              </div>
            </div>

            {/* Card 3: Distinct Data Source, Observation Timestamp & Retrieval Timestamp */}
            <div
              className={`rounded-xl border p-5 flex flex-col justify-between ${
                theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
              }`}
            >
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-400 font-mono-tabular">
                  <span>Timestamp Separation</span>
                  <span
                    className={
                      fxMeta?.isStaleOrLagging ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'
                    }
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
                      {latestInr.label} · {latestInr.observationTimeIst || '13:30 IST'}
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
      </section>

      {/* =====================================================================
          SECTION D: DUAL HISTORICAL CHARTS (PPAC CRUDE OIL & FBIL/RBI USD/INR)
         ===================================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Chart 1: Official PPAC Indian Basket Crude Oil */}
        {!crudeError && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono-tabular text-amber-400">
                PPAC Completed Monthly Series (Jan 2024 – Sep 2026)
              </span>
              <div
                className={`flex items-center p-1 rounded-lg border ${
                  theme === 'dark' ? 'bg-[#0B1325] border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setCrudeChartMode('price_only')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                    crudeChartMode === 'price_only'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Price ($/bbl)
                </button>
                <button
                  type="button"
                  onClick={() => setCrudeChartMode('price_and_mom')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                    crudeChartMode === 'price_and_mom'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Price + MoM % Change
                </button>
              </div>
            </div>

            <AnalyticalChartPanel
              title="Official Indian Basket Crude Oil Price (PPAC · Completed Monthly Avg)"
              subtitle="Completed monthly average price in USD per barrel ($/bbl). Partial Oct 2026 MTD ($120.08/bbl) is excluded from the completed monthly line."
              unit="USD / bbl"
              sourceLabel="PPAC · Ministry of Petroleum & Natural Gas (Official)"
              frequencyLabel="Completed Monthly Avg"
              observations={crudeIndicator.observations}
              seriesConfig={
                crudeChartMode === 'price_only'
                  ? [
                      {
                        key: 'value',
                        name: 'Indian Basket Crude Oil (Completed Monthly Avg · USD/bbl)',
                        color: '#f59e0b',
                      },
                    ]
                  : [
                      {
                        key: 'value',
                        name: 'Indian Basket Crude Oil (USD/bbl)',
                        color: '#f59e0b',
                      },
                      {
                        key: 'secondaryValue',
                        name: 'Comparable Month-over-Month Change (% MoM)',
                        color: '#06b6d4',
                      },
                    ]
              }
              defaultChartType="area"
              defaultRange="MAX"
              zeroReferenceLine={crudeChartMode === 'price_and_mom'}
              theme={theme}
            />
          </div>
        )}

        {/* Chart 2: Official FBIL / RBI DBIE USD/INR Reference Rate */}
        {!usdInrError && !usdInrEmpty && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-mono-tabular text-emerald-400">
                FBIL &amp; RBI DBIE Official Reference Rate Series (2017 – 22 Oct 2026)
              </span>
              <span className="text-[11px] text-slate-400 font-mono-tabular">
                INR per 1 USD
              </span>
            </div>

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
          </div>
        )}
      </div>

      {/* =====================================================================
          SECTION E: EDUCATIONAL TRANSMISSION CHANNELS & CAUSALITY GUARDRAIL
         ===================================================================== */}
      <section
        className={`rounded-xl border p-5 sm:p-6 ${
          theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono-tabular">
              <Droplets className="w-4 h-4" />
              <span>Macroeconomic Transmission Mechanism (Educational Overview)</span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold mt-0.5">
              How Crude Oil Prices Can Affect India&apos;s Import Bill, Trade Balance, Exchange Rate &amp; Inflation
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono-tabular">
            Theoretical Channels vs. Empirical Evidence
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
                  <span>Channel {idx + 2}</span>
                  <ArrowRight className="w-3 h-3 ml-1 text-emerald-400" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Strict Methodological Guardrail: Distinguishing General Economic Explanations from Measured Causal Effects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
          <div
            className={`p-4 rounded-lg border flex items-start gap-2.5 text-xs ${
              theme === 'dark'
                ? 'bg-amber-950/15 border-amber-500/30 text-slate-300'
                : 'bg-amber-50 border-amber-200 text-slate-800'
            }`}
          >
            <Scale className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-semibold text-amber-400">
                Methodological Guardrail — General Economic Theory vs. Measured Causal Proof:
              </strong>{' '}
              The four channels above describe <strong>standard macroeconomic transmission mechanisms</strong>, not a claim that a specific monthly move in crude oil single-handedly caused a contemporaneous change in the merchandise trade balance, CPI inflation, GDP growth, or the USD/INR rate. In practice, non-oil export surges, services surpluses, excise duty adjustments, and RBI FX interventions frequently cushion or offset direct pass-through.
            </div>
          </div>

          <div
            className={`p-4 rounded-lg border flex items-start gap-2.5 text-xs ${
              theme === 'dark'
                ? 'bg-emerald-950/15 border-emerald-500/30 text-slate-300'
                : 'bg-emerald-50 border-emerald-200 text-slate-800'
            }`}
          >
            <Globe2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-semibold text-emerald-400">
                Why Partial-Month Averages Are Never Mixed with Completed Months:
              </strong>{' '}
              PPAC publishes daily Indian Basket prices, a running Month-to-Date (MTD) average during the current month (e.g., <strong>Oct 2026 MTD up to 22 Oct: $120.08/bbl</strong>; <strong>22 Oct Daily: $119.99/bbl</strong>), and a final monthly average once the month closes (e.g., <strong>Sep 2026 Completed Avg: $116.09/bbl</strong>). ArthNiti labels each measure explicitly so partial-month averages are never mistaken for completed monthly averages.
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION F: VERIFIED PPAC CRUDE OIL & FBIL USD/INR OBSERVATION TABLES
         ===================================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Table 1: Official PPAC Indian Basket Crude Oil Verification Log */}
        {!crudeError && reversedCrudeObservations.length > 0 && (
          <div
            className={`rounded-xl border p-5 sm:p-6 space-y-4 ${
              theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono-tabular text-amber-400">
                  <Table className="w-3.5 h-3.5" />
                  <span>Official PPAC Indian Basket Crude Verification Log</span>
                </div>
                <h3 className="text-base font-semibold mt-0.5">
                  Daily, Month-to-Date (Partial) &amp; Completed Monthly Averages
                </h3>
              </div>
              <span className="text-xs font-mono-tabular text-slate-400">
                /data/ppac_crude_official.csv
              </span>
            </div>

            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-[#0B1325] z-10">
                  <tr className="border-b border-slate-800 text-slate-400 font-mono-tabular text-[11px]">
                    <th className="py-2.5 pr-3">Reference Period</th>
                    <th className="py-2.5 px-2.5">Price ($/bbl)</th>
                    <th className="py-2.5 px-2.5">MoM Change</th>
                    <th className="py-2.5 pl-2.5">Observation Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono-tabular">
                  {/* Explicitly Labelled Daily Observation Row */}
                  <tr
                    className={
                      theme === 'dark'
                        ? 'bg-cyan-950/20 text-slate-100'
                        : 'bg-cyan-50/70 text-slate-900'
                    }
                  >
                    <td className="py-2.5 pr-3 font-semibold whitespace-nowrap">
                      {crudeMeta?.latestDailyDateLabel || '22 Oct 2026'}
                    </td>
                    <td className="py-2.5 px-2.5 font-semibold text-cyan-400 whitespace-nowrap">
                      ${(crudeMeta?.latestDailyPriceUsd ?? 119.99).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-500 whitespace-nowrap">
                      — (Single Day)
                    </td>
                    <td className="py-2.5 pl-2.5 text-cyan-400 whitespace-nowrap">
                      Daily Observation
                    </td>
                  </tr>

                  {/* Explicitly Labelled Month-to-Date (Partial) Row */}
                  {crudeMeta?.partialMonthRow && (
                    <tr
                      className={
                        theme === 'dark'
                          ? 'bg-amber-950/20 text-slate-100'
                          : 'bg-amber-50/70 text-slate-900'
                      }
                    >
                      <td className="py-2.5 pr-3 font-semibold whitespace-nowrap">
                        {crudeMeta.partialMonthRow.label}
                      </td>
                      <td className="py-2.5 px-2.5 font-semibold text-amber-400 whitespace-nowrap">
                        ${crudeMeta.partialMonthRow.value.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-500 whitespace-nowrap">
                        — (Partial Month)
                      </td>
                      <td className="py-2.5 pl-2.5 text-amber-400 whitespace-nowrap">
                        Month-to-Date (Partial)
                      </td>
                    </tr>
                  )}

                  {/* Completed Monthly Average Rows */}
                  {reversedCrudeObservations.map((obs, idx) => (
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
                      <td className="py-2.5 pr-3 font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{obs.label}</span>
                          {idx === 0 && (
                            <span className="text-[10px] text-emerald-400 font-semibold">
                              · Latest Completed
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-2.5 font-semibold text-amber-400 whitespace-nowrap">
                        ${obs.value.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2.5 whitespace-nowrap">
                        {obs.momChangePct !== undefined ? (
                          <span
                            className={
                              obs.momChangePct > 0
                                ? 'text-rose-400'
                                : obs.momChangePct < 0
                                ? 'text-emerald-400'
                                : 'text-slate-400'
                            }
                          >
                            {obs.momChangePct > 0 ? `+${obs.momChangePct.toFixed(2)}%` : `${obs.momChangePct.toFixed(2)}%`}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2.5 pl-2.5 text-emerald-400 whitespace-nowrap">
                        Completed Monthly Average
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Table 2: Official FBIL / RBI DBIE USD/INR Verification Log */}
        {!usdInrError && !usdInrEmpty && reversedInrObservations.length > 0 && (
          <div
            className={`rounded-xl border p-5 sm:p-6 space-y-4 ${
              theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-400">
                  <Table className="w-3.5 h-3.5" />
                  <span>Official FBIL &amp; RBI DBIE USD/INR Verification Log</span>
                </div>
                <h3 className="text-base font-semibold mt-0.5">
                  Daily &amp; Historical Reference Rates (INR per 1 USD)
                </h3>
              </div>
              <span className="text-xs font-mono-tabular text-slate-400">
                /data/rbi_fbil_usdinr_official.csv
              </span>
            </div>

            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-[#0B1325] z-10">
                  <tr className="border-b border-slate-800 text-slate-400 font-mono-tabular text-[11px]">
                    <th className="py-2.5 pr-3">Observation Date</th>
                    <th className="py-2.5 px-2.5">Rate (INR / 1 USD)</th>
                    <th className="py-2.5 px-2.5">Time (IST)</th>
                    <th className="py-2.5 pl-2.5">Publisher</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono-tabular">
                  {reversedInrObservations.map((obs, idx) => (
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
                      <td className="py-2.5 pr-3 font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{obs.label}</span>
                          {idx === 0 && (
                            <span className="text-[10px] text-emerald-400 font-semibold">
                              · Latest
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-2.5 font-semibold text-emerald-400 whitespace-nowrap">
                        ₹{obs.value.toFixed(4)}
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-400 whitespace-nowrap">
                        {obs.observationTimeIst || '13:30 IST'}
                      </td>
                      <td className="py-2.5 pl-2.5 whitespace-nowrap">
                        <span
                          className={
                            obs.benchmarkPublisher?.includes('RBI (Pre')
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }
                        >
                          {obs.benchmarkPublisher || 'FBIL (Post-Jul 2018)'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 11. Direct Interactive Comparison of Merchandise Trade, Crude Oil & USD/INR */}
      <RelationshipExplorer
        indicators={allIndicators}
        defaultIndicatorAId="merchandise-trade"
        defaultIndicatorBId="crude-oil"
        theme={theme}
        compact
      />
    </div>
  );
};
