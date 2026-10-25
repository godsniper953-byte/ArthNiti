/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Compass, X } from 'lucide-react';
import {
  getDataSourcesSync,
  getIndicatorsSync,
  getLatestReleasesSync,
  getSectorGvaSync,
} from './services/economyService';
import {
  clearUserUploadedCpiCsv,
  loadOfficialCpiData,
  saveUserUploadedCpiCsv,
} from './services/cpiDataService';
import { EconomicIndicator, PageId } from './types/economy';
import { Sidebar } from './components/navigation/Sidebar';
import { TopBar } from './components/navigation/TopBar';
import { OverviewPage } from './pages/OverviewPage';
import { GdpGrowthPage } from './pages/GdpGrowthPage';
import { InflationPage } from './pages/InflationPage';
import { LabourMarketPage } from './pages/LabourMarketPage';
import { CurrencyOilPage } from './pages/CurrencyOilPage';
import { FinancialMarketsPage } from './pages/FinancialMarketsPage';
import { ComparisonsPage } from './pages/ComparisonsPage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { AboutPage } from './pages/AboutPage';

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('overview');
  const [focusedIndicatorId, setFocusedIndicatorId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const shouldReduceMotion = useReducedMotion();

  // Official MoSPI CPI Data State (kept separate from UI components via cpiDataService)
  const [officialCpiIndicator, setOfficialCpiIndicator] = useState<EconomicIndicator | null>(null);
  const [cpiLoading, setCpiLoading] = useState<boolean>(true);
  const [cpiError, setCpiError] = useState<string | null>(null);
  const [cpiLastUpdated, setCpiLastUpdated] = useState<string>('Loading...');
  const [cpiDataOrigin, setCpiDataOrigin] = useState<
    'official_mospi_csv' | 'user_uploaded_csv' | 'demonstration_fallback'
  >('official_mospi_csv');

  const baseIndicators = useMemo(() => getIndicatorsSync(), []);
  const sources = useMemo(() => getDataSourcesSync(), []);
  const sectorGva = useMemo(() => getSectorGvaSync(), []);
  const latestReleases = useMemo(() => getLatestReleasesSync(), []);

  const handleFetchOfficialCpi = useCallback(async (simulateError = false) => {
    setCpiLoading(true);
    setCpiError(null);
    const result = await loadOfficialCpiData({ simulateError });
    setCpiLastUpdated(result.lastUpdated);
    setCpiDataOrigin(result.dataOrigin);
    if (result.status === 'success' && result.indicator) {
      setOfficialCpiIndicator(result.indicator);
      setCpiError(null);
    } else {
      setCpiError(
        result.errorMessage || 'Failed to load official MoSPI CPI dataset.'
      );
    }
    setCpiLoading(false);
  }, []);

  useEffect(() => {
    handleFetchOfficialCpi(false);
  }, [handleFetchOfficialCpi]);

  const handleUploadCustomCsv = useCallback((csvText: string) => {
    try {
      const updated = saveUserUploadedCpiCsv(csvText);
      setOfficialCpiIndicator(updated);
      setCpiError(null);
      setCpiDataOrigin('user_uploaded_csv');
      setCpiLastUpdated(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      return { ok: true };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'Invalid CSV format.',
      };
    }
  }, []);

  const handleResetCustomCsv = useCallback(() => {
    clearUserUploadedCpiCsv();
    handleFetchOfficialCpi(false);
  }, [handleFetchOfficialCpi]);

  const handleActivateDemoFallback = useCallback(() => {
    const demoFallback =
      baseIndicators.find((i) => i.id === 'cpi-inflation') || baseIndicators[1];
    setOfficialCpiIndicator({
      ...demoFallback,
      name: 'CPI Headline Inflation (Labelled Demonstration Fallback)',
      shortName: 'CPI Inflation (Demo Fallback)',
      sourceShortName: 'MoSPI (Demo Fallback)',
      isOfficialData: false,
    });
    setCpiError(null);
    setCpiDataOrigin('demonstration_fallback');
    setCpiLastUpdated(
      `${new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })} (Demo State)`
    );
  }, [baseIndicators]);

  // Merge official MoSPI CPI indicator into the global indicator list
  const indicators = useMemo(() => {
    if (!officialCpiIndicator) return baseIndicators;
    return baseIndicators.map((ind) =>
      ind.id === 'cpi-inflation' ? officialCpiIndicator : ind
    );
  }, [baseIndicators, officialCpiIndicator]);

  useEffect(() => {
    const htmlEl = document.documentElement;
    if (theme === 'dark') {
      htmlEl.classList.add('dark');
      document.body.style.backgroundColor = '#060B16';
      document.body.style.color = '#F8FAFC';
    } else {
      htmlEl.classList.remove('dark');
      document.body.style.backgroundColor = '#F8FAFC';
      document.body.style.color = '#0F172A';
    }
  }, [theme]);

  const handleSelectPage = (pageId: PageId, indicatorId?: string) => {
    setActivePage(pageId);
    setFocusedIndicatorId(indicatorId || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const focusedIndicator = useMemo(
    () => (focusedIndicatorId ? indicators.find((i) => i.id === focusedIndicatorId) || null : null),
    [focusedIndicatorId, indicators]
  );

  const gdpIndicator = useMemo(
    () => indicators.find((i) => i.id === 'gdp-growth') || indicators[0],
    [indicators]
  );
  const cpiIndicator = useMemo(
    () => indicators.find((i) => i.id === 'cpi-inflation') || indicators[1],
    [indicators]
  );
  const labourIndicator = useMemo(
    () => indicators.find((i) => i.id === 'unemployment-rate') || indicators[2],
    [indicators]
  );
  const inrIndicator = useMemo(
    () => indicators.find((i) => i.id === 'usd-inr') || indicators[3],
    [indicators]
  );
  const crudeIndicator = useMemo(
    () => indicators.find((i) => i.id === 'crude-oil') || indicators[4],
    [indicators]
  );
  const repoIndicator = useMemo(
    () => indicators.find((i) => i.id === 'rbi-repo-rate') || indicators[5],
    [indicators]
  );
  const niftyIndicator = useMemo(
    () => indicators.find((i) => i.id === 'nifty-50') || indicators[6],
    [indicators]
  );

  const renderActivePage = () => {
    switch (activePage) {
      case 'overview':
        return (
          <OverviewPage
            indicators={indicators}
            latestReleases={latestReleases}
            sources={sources}
            onSelectPage={handleSelectPage}
            theme={theme}
            cpiLoading={cpiLoading}
            cpiError={cpiError}
            onRetryCpi={() => handleFetchOfficialCpi(false)}
          />
        );
      case 'gdp-growth':
        return (
          <GdpGrowthPage
            indicator={gdpIndicator}
            sectorGva={sectorGva}
            theme={theme}
          />
        );
      case 'inflation':
        return (
          <InflationPage
            indicator={cpiIndicator}
            isLoading={cpiLoading}
            errorMessage={cpiError}
            lastUpdated={cpiLastUpdated}
            dataOrigin={cpiDataOrigin}
            onRefreshOfficialCpi={(simErr) => handleFetchOfficialCpi(Boolean(simErr))}
            onUploadCustomCsv={handleUploadCustomCsv}
            onResetCustomCsv={handleResetCustomCsv}
            onActivateDemoFallback={handleActivateDemoFallback}
            theme={theme}
          />
        );
      case 'labour-market':
        return <LabourMarketPage indicator={labourIndicator} theme={theme} />;
      case 'currency-oil':
        return (
          <CurrencyOilPage
            inrIndicator={inrIndicator}
            crudeIndicator={crudeIndicator}
            allIndicators={indicators}
            theme={theme}
          />
        );
      case 'financial-markets':
        return (
          <FinancialMarketsPage
            marketIndicator={niftyIndicator}
            repoIndicator={repoIndicator}
            theme={theme}
          />
        );
      case 'comparisons':
        return (
          <ComparisonsPage
            indicators={indicators}
            initialIndicatorId={focusedIndicatorId}
            theme={theme}
          />
        );
      case 'data-sources':
        return <DataSourcesPage sources={sources} theme={theme} />;
      case 'about':
        return <AboutPage theme={theme} onSelectPage={handleSelectPage} />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`min-h-screen flex transition-colors ${
        theme === 'dark'
          ? 'bg-[#060B16] text-[#F8FAFC]'
          : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
    >
      {/* Collapsible Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        onSelectPage={handleSelectPage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        theme={theme}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          activePage={activePage}
          onSelectPage={handleSelectPage}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          indicators={indicators}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        />

        {/* Data Provenance & Transparency Notice Strip */}
        <div
          className={`px-4 sm:px-6 py-2 border-b text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 ${
            theme === 'dark'
              ? 'bg-[#091224] border-slate-800/80 text-slate-400'
              : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}
        >
          <div>
            <span className="font-semibold text-emerald-400">Data Provenance: </span>
            <span>
              <strong>CPI Inflation</strong> is powered by official MoSPI All-India Combined data (<code className="font-mono-tabular">Base 2024=100</code>, Sep 2026: <strong className="font-mono-tabular text-emerald-400">5.54% YoY</strong>). Other indicators display clearly labelled illustrative series.
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleSelectPage('inflation', 'cpi-inflation')}
            className="text-emerald-400 hover:underline font-medium self-start sm:self-auto cursor-pointer whitespace-nowrap shrink-0"
          >
            Inspect Official MoSPI CPI →
          </button>
        </div>

        {/* Main Content Viewport with Motion Page Transition */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Quick-Jump Indicator Spotlight Banner when navigated from Search or KPI Card */}
          {focusedIndicator && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                theme === 'dark'
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                  : 'bg-emerald-50 border-emerald-200 text-slate-800'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <Compass className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-emerald-400">
                      Focused Indicator: {focusedIndicator.name}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular font-semibold">
                      {focusedIndicator.id === 'usd-inr'
                        ? `₹${focusedIndicator.currentValue}`
                        : focusedIndicator.id === 'crude-oil'
                        ? `$${focusedIndicator.currentValue}`
                        : focusedIndicator.currentValue}{' '}
                      {focusedIndicator.unit} ({focusedIndicator.changeLabel})
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-400">{focusedIndicator.sourceShortName}</span>
                  </div>
                  <p className="text-slate-400 mt-1 leading-relaxed">
                    {focusedIndicator.economicInterpretation}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleSelectPage('comparisons', focusedIndicator.id)}
                  className="px-2.5 py-1 rounded-md border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <span>Compare Series</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setFocusedIndicatorId(null)}
                  aria-label="Dismiss indicator spotlight"
                  className="p-1 rounded-md text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {renderActivePage()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Quiet Editorial Footer */}
        <footer
          className={`mt-auto px-4 sm:px-6 lg:px-8 py-5 border-t text-xs ${
            theme === 'dark'
              ? 'border-slate-800/80 text-slate-400 bg-[#060B16]'
              : 'border-slate-200 text-slate-500 bg-white'
          }`}
        >
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-emerald-400">ARTHNITI</span>
              <span aria-hidden="true">·</span>
              <span>Understand the Economy. Discover the Data.</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => handleSelectPage('data-sources')}
                className="hover:text-emerald-400 transition-colors cursor-pointer"
              >
                Data Sources &amp; Methodology
              </button>
              <button
                type="button"
                onClick={() => handleSelectPage('comparisons')}
                className="hover:text-emerald-400 transition-colors cursor-pointer"
              >
                Comparison Engine
              </button>
              <button
                type="button"
                onClick={() => handleSelectPage('about')}
                className="hover:text-emerald-400 transition-colors cursor-pointer"
              >
                About &amp; FastAPI Setup
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
