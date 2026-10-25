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
import {
  clearUserUploadedGdpCsv,
  loadOfficialGdpData,
  saveUserUploadedGdpCsv,
} from './services/gdpDataService';
import {
  clearUserUploadedRepoCsv,
  loadOfficialRepoData,
  saveUserUploadedRepoCsv,
} from './services/repoDataService';
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

  // Official MoSPI GDP Data State (kept separate from UI components via gdpDataService)
  const [officialGdpIndicator, setOfficialGdpIndicator] = useState<EconomicIndicator | null>(null);
  const [gdpLoading, setGdpLoading] = useState<boolean>(true);
  const [gdpError, setGdpError] = useState<string | null>(null);
  const [gdpLastUpdated, setGdpLastUpdated] = useState<string>('Loading...');
  const [gdpDataOrigin, setGdpDataOrigin] = useState<
    'official_mospi_csv' | 'user_uploaded_csv' | 'demonstration_fallback'
  >('official_mospi_csv');

  // Official RBI Policy Repo Rate State (kept separate from UI components via repoDataService)
  const [officialRepoIndicator, setOfficialRepoIndicator] = useState<EconomicIndicator | null>(null);
  const [repoLoading, setRepoLoading] = useState<boolean>(true);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [repoLastVerified, setRepoLastVerified] = useState<string>('Verifying...');
  const [repoDataOrigin, setRepoDataOrigin] = useState<
    'official_rbi_csv' | 'user_uploaded_csv' | 'demonstration_fallback'
  >('official_rbi_csv');

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

  const handleFetchOfficialGdp = useCallback(async (simulateError = false) => {
    setGdpLoading(true);
    setGdpError(null);
    const result = await loadOfficialGdpData({ simulateError });
    setGdpLastUpdated(result.lastUpdated);
    setGdpDataOrigin(result.dataOrigin);
    if (result.status === 'success' && result.indicator) {
      setOfficialGdpIndicator(result.indicator);
      setGdpError(null);
    } else {
      setGdpError(
        result.errorMessage || 'Failed to load official MoSPI GDP dataset.'
      );
    }
    setGdpLoading(false);
  }, []);

  const handleFetchOfficialRepo = useCallback(async (simulateError = false) => {
    setRepoLoading(true);
    setRepoError(null);
    const result = await loadOfficialRepoData({ simulateError });
    setRepoLastVerified(result.lastVerified);
    setRepoDataOrigin(result.dataOrigin);
    if (result.status === 'success' && result.indicator) {
      setOfficialRepoIndicator(result.indicator);
      setRepoError(null);
    } else {
      setRepoError(
        result.errorMessage || 'Failed to load official RBI Policy Repo Rate dataset.'
      );
    }
    setRepoLoading(false);
  }, []);

  useEffect(() => {
    handleFetchOfficialCpi(false);
    handleFetchOfficialGdp(false);
    handleFetchOfficialRepo(false);
  }, [handleFetchOfficialCpi, handleFetchOfficialGdp, handleFetchOfficialRepo]);

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

  const handleUploadCustomGdpCsv = useCallback((csvText: string) => {
    try {
      const updated = saveUserUploadedGdpCsv(csvText);
      setOfficialGdpIndicator(updated);
      setGdpError(null);
      setGdpDataOrigin('user_uploaded_csv');
      setGdpLastUpdated(
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
        error: err?.message || 'Invalid GDP CSV format.',
      };
    }
  }, []);

  const handleResetCustomGdpCsv = useCallback(() => {
    clearUserUploadedGdpCsv();
    handleFetchOfficialGdp(false);
  }, [handleFetchOfficialGdp]);

  const handleActivateGdpDemoFallback = useCallback(() => {
    const demoFallback =
      baseIndicators.find((i) => i.id === 'gdp-growth') || baseIndicators[0];
    setOfficialGdpIndicator({
      ...demoFallback,
      name: 'Real GDP Growth Rate (Labelled Demonstration Fallback)',
      shortName: 'Real GDP Growth (Demo Fallback)',
      sourceShortName: 'MoSPI (Demo Fallback)',
      isOfficialData: false,
    });
    setGdpError(null);
    setGdpDataOrigin('demonstration_fallback');
    setGdpLastUpdated(
      `${new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })} (Demo State)`
    );
  }, [baseIndicators]);

  const handleUploadCustomRepoCsv = useCallback((csvText: string) => {
    try {
      const updated = saveUserUploadedRepoCsv(csvText);
      setOfficialRepoIndicator(updated);
      setRepoError(null);
      setRepoDataOrigin('user_uploaded_csv');
      setRepoLastVerified(
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
        error: err?.message || 'Invalid RBI Repo CSV format.',
      };
    }
  }, []);

  const handleResetCustomRepoCsv = useCallback(() => {
    clearUserUploadedRepoCsv();
    handleFetchOfficialRepo(false);
  }, [handleFetchOfficialRepo]);

  const handleActivateRepoDemoFallback = useCallback(() => {
    const demoFallback =
      baseIndicators.find((i) => i.id === 'rbi-repo-rate') || baseIndicators[5];
    setOfficialRepoIndicator({
      ...demoFallback,
      name: 'RBI Policy Repo Rate (Labelled Demonstration Fallback)',
      shortName: 'RBI Repo Rate (Demo Fallback)',
      sourceShortName: 'RBI (Demo Fallback)',
      isOfficialData: false,
    });
    setRepoError(null);
    setRepoDataOrigin('demonstration_fallback');
    setRepoLastVerified(
      `${new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })} (Demo State)`
    );
  }, [baseIndicators]);

  // Merge official MoSPI GDP, CPI, and RBI Repo Rate indicators into the global indicator list
  const indicators = useMemo(() => {
    return baseIndicators.map((ind) => {
      if (ind.id === 'gdp-growth' && officialGdpIndicator) return officialGdpIndicator;
      if (ind.id === 'cpi-inflation' && officialCpiIndicator) return officialCpiIndicator;
      if (ind.id === 'rbi-repo-rate' && officialRepoIndicator) return officialRepoIndicator;
      return ind;
    });
  }, [baseIndicators, officialGdpIndicator, officialCpiIndicator, officialRepoIndicator]);

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
            gdpLoading={gdpLoading}
            gdpError={gdpError}
            onRetryGdp={() => handleFetchOfficialGdp(false)}
            repoLoading={repoLoading}
            repoError={repoError}
            onRetryRepo={() => handleFetchOfficialRepo(false)}
          />
        );
      case 'gdp-growth':
        return (
          <GdpGrowthPage
            indicator={gdpIndicator}
            sectorGva={sectorGva}
            isLoading={gdpLoading}
            errorMessage={gdpError}
            lastUpdated={gdpLastUpdated}
            dataOrigin={gdpDataOrigin}
            onRefreshOfficialGdp={(simErr) => handleFetchOfficialGdp(Boolean(simErr))}
            onUploadCustomCsv={handleUploadCustomGdpCsv}
            onResetCustomCsv={handleResetCustomGdpCsv}
            onActivateDemoFallback={handleActivateGdpDemoFallback}
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
            repoLoading={repoLoading}
            repoError={repoError}
            repoLastVerified={repoLastVerified}
            repoDataOrigin={repoDataOrigin}
            onRefreshOfficialRepo={(simErr) => handleFetchOfficialRepo(Boolean(simErr))}
            onUploadCustomRepoCsv={handleUploadCustomRepoCsv}
            onResetCustomRepoCsv={handleResetCustomRepoCsv}
            onActivateRepoDemoFallback={handleActivateRepoDemoFallback}
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
              <strong>Real GDP Growth</strong> (<code className="font-mono-tabular">Base 2022–23</code>, Q1 FY27: <strong className="font-mono-tabular text-emerald-400">7.8% YoY</strong>), <strong>CPI Inflation</strong> (<code className="font-mono-tabular">Base 2024=100</code>, Sep 2026: <strong className="font-mono-tabular text-emerald-400">5.54% YoY</strong>), &amp; <strong>RBI Repo Rate</strong> (07 Oct 2026 MPC: <strong className="font-mono-tabular text-emerald-400">5.50%</strong>) use official data.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => handleSelectPage('gdp-growth', 'gdp-growth')}
              className="text-emerald-400 hover:underline font-medium cursor-pointer whitespace-nowrap"
            >
              MoSPI GDP →
            </button>
            <button
              type="button"
              onClick={() => handleSelectPage('inflation', 'cpi-inflation')}
              className="text-amber-400 hover:underline font-medium cursor-pointer whitespace-nowrap"
            >
              MoSPI CPI →
            </button>
            <button
              type="button"
              onClick={() => handleSelectPage('financial-markets', 'rbi-repo-rate')}
              className="text-cyan-400 hover:underline font-medium cursor-pointer whitespace-nowrap"
            >
              RBI Repo →
            </button>
          </div>
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
