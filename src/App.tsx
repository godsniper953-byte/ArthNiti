/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Compass, X } from 'lucide-react';
import {
  getDataSourcesSync,
  getIndicatorsSync,
  getLatestReleasesSync,
  getSectorGvaSync,
  resolvePageFromLocation,
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
import {
  clearUserUploadedPlfsCsv,
  loadOfficialPlfsData,
  saveUserUploadedPlfsCsv,
} from './services/plfsDataService';
import {
  clearUserUploadedUsdInrCsv,
  loadOfficialUsdInrData,
  saveUserUploadedUsdInrCsv,
} from './services/usdInrDataService';
import {
  clearUserUploadedCrudeCsv,
  loadOfficialCrudeOilData,
  saveUserUploadedCrudeCsv,
} from './services/crudeOilDataService';
import {
  clearUserUploadedTradeCsv,
  loadOfficialMerchandiseTradeData,
  saveUserUploadedTradeCsv,
} from './services/tradeBalanceDataService';
import {
  fetchIndianMarketIndices,
  IndianMarketIndicesResponse,
} from './services/indianMarketService';
import {
  EconomicNewsResponse,
  fetchEconomicNews,
} from './services/economicNewsService';
import {
  EconomistBitesResponse,
  fetchEconomistBites,
} from './services/economistBitesService';
import { EconomicIndicator, PageId } from './types/economy';
import { Sidebar } from './components/navigation/Sidebar';
import { TopBar } from './components/navigation/TopBar';
import { LiveMarketTickerStrip } from './components/visualizations/LiveMarketTickerStrip';
import { OverviewPage } from './pages/OverviewPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const GdpGrowthPage = React.lazy(() =>
  import('./pages/GdpGrowthPage').then((m) => ({ default: m.GdpGrowthPage }))
);
const InflationPage = React.lazy(() =>
  import('./pages/InflationPage').then((m) => ({ default: m.InflationPage }))
);
const LabourMarketPage = React.lazy(() =>
  import('./pages/LabourMarketPage').then((m) => ({ default: m.LabourMarketPage }))
);
const CurrencyOilPage = React.lazy(() =>
  import('./pages/CurrencyOilPage').then((m) => ({ default: m.CurrencyOilPage }))
);
const FinancialMarketsPage = React.lazy(() =>
  import('./pages/FinancialMarketsPage').then((m) => ({ default: m.FinancialMarketsPage }))
);
const EconomicNewsPage = React.lazy(() =>
  import('./pages/EconomicNewsPage').then((m) => ({ default: m.EconomicNewsPage }))
);
const EconomistBitesPage = React.lazy(() =>
  import('./pages/EconomistBitesPage').then((m) => ({ default: m.EconomistBitesPage }))
);
const ComparisonsPage = React.lazy(() =>
  import('./pages/ComparisonsPage').then((m) => ({ default: m.ComparisonsPage }))
);
const DataSourcesPage = React.lazy(() =>
  import('./pages/DataSourcesPage').then((m) => ({ default: m.DataSourcesPage }))
);
const AboutPage = React.lazy(() =>
  import('./pages/AboutPage').then((m) => ({ default: m.AboutPage }))
);

export default function App() {
  const initialRoute = useMemo(() => {
    if (typeof window === 'undefined') {
      return { pageId: 'overview' as PageId, indicatorId: null };
    }
    return resolvePageFromLocation(window.location.hash, window.location.search);
  }, []);

  const [activePage, setActivePage] = useState<PageId>(initialRoute.pageId);
  const [focusedIndicatorId, setFocusedIndicatorId] = useState<string | null>(
    initialRoute.indicatorId
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const shouldReduceMotion = useReducedMotion();

  // Monotonic sequence counters to prevent stale overlapping responses from overwriting newer state
  const marketRequestSeqRef = useRef<number>(0);
  const newsRequestSeqRef = useRef<number>(0);
  const bitesRequestSeqRef = useRef<number>(0);

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

  // Official MoSPI PLFS Unemployment Rate State (kept separate from UI components via plfsDataService)
  const [officialPlfsIndicator, setOfficialPlfsIndicator] = useState<EconomicIndicator | null>(null);
  const [plfsLoading, setPlfsLoading] = useState<boolean>(true);
  const [plfsError, setPlfsError] = useState<string | null>(null);
  const [plfsLastVerified, setPlfsLastVerified] = useState<string>('Verifying...');
  const [plfsDataOrigin, setPlfsDataOrigin] = useState<
    'official_mospi_csv' | 'user_uploaded_csv' | 'demonstration_fallback'
  >('official_mospi_csv');

  // Official FBIL / RBI DBIE USD/INR Reference Rate State (kept separate from UI components via usdInrDataService)
  const [officialUsdInrIndicator, setOfficialUsdInrIndicator] = useState<EconomicIndicator | null>(
    null
  );
  const [usdInrLoading, setUsdInrLoading] = useState<boolean>(true);
  const [usdInrError, setUsdInrError] = useState<string | null>(null);
  const [usdInrEmpty, setUsdInrEmpty] = useState<boolean>(false);
  const [usdInrRetrievalTimestamp, setUsdInrRetrievalTimestamp] = useState<string>('Verifying...');
  const [usdInrDataOrigin, setUsdInrDataOrigin] = useState<
    'official_rbi_fbil_csv' | 'user_uploaded_csv' | 'demonstration_fallback'
  >('official_rbi_fbil_csv');

  // Official PPAC Indian Basket Crude Oil State (kept separate from UI components via crudeOilDataService)
  const [officialCrudeIndicator, setOfficialCrudeIndicator] = useState<EconomicIndicator | null>(
    null
  );
  const [crudeLoading, setCrudeLoading] = useState<boolean>(true);
  const [crudeError, setCrudeError] = useState<string | null>(null);
  const [crudeRetrievalTimestamp, setCrudeRetrievalTimestamp] = useState<string>('Verifying...');
  const [crudeDataOrigin, setCrudeDataOrigin] = useState<
    'official_ppac_csv' | 'user_uploaded_csv' | 'demonstration_fallback'
  >('official_ppac_csv');

  // Official Ministry of Commerce & Industry Merchandise Trade Balance State (via tradeBalanceDataService)
  const [officialTradeIndicator, setOfficialTradeIndicator] = useState<EconomicIndicator | null>(
    null
  );
  const [tradeLoading, setTradeLoading] = useState<boolean>(true);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [tradeRetrievalTimestamp, setTradeRetrievalTimestamp] = useState<string>('Verifying...');
  const [tradeDataOrigin, setTradeDataOrigin] = useState<
    'official_moci_csv' | 'user_uploaded_csv' | 'demonstration_fallback'
  >('official_moci_csv');

  // Live Indian Stock Market Indices State (NIFTY 50, BSE SENSEX, BANK NIFTY, NIFTY IT, NIFTY MIDCAP 100)
  const [marketData, setMarketData] = useState<IndianMarketIndicesResponse | null>(null);
  const [marketLoading, setMarketLoading] = useState<boolean>(true);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [marketStaleCache, setMarketStaleCache] = useState<boolean>(false);
  const [marketAutoRefresh, setMarketAutoRefresh] = useState<boolean>(true);
  const [simulatedUnavailableIndexId, setSimulatedUnavailableIndexId] = useState<string | null>(
    null
  );
  const [selectedMarketIndexId, setSelectedMarketIndexId] = useState<string>('nifty-50');

  // Live Economic News & Current Affairs Intelligence State
  const [newsData, setNewsData] = useState<EconomicNewsResponse | null>(null);
  const [newsLoading, setNewsLoading] = useState<boolean>(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [newsStaleCache, setNewsStaleCache] = useState<boolean>(false);
  const [newsAutoRefresh, setNewsAutoRefresh] = useState<boolean>(true);

  // Economists' Latest Bites State
  const [bitesData, setBitesData] = useState<EconomistBitesResponse | null>(null);
  const [bitesLoading, setBitesLoading] = useState<boolean>(true);
  const [bitesError, setBitesError] = useState<string | null>(null);
  const [bitesStaleCache, setBitesStaleCache] = useState<boolean>(false);
  const [bitesAutoRefresh, setBitesAutoRefresh] = useState<boolean>(true);

  const baseIndicators = useMemo(() => getIndicatorsSync(), []);
  const sources = useMemo(() => getDataSourcesSync(), []);
  const sectorGva = useMemo(() => getSectorGvaSync(), []);
  const latestReleases = useMemo(() => getLatestReleasesSync(), []);

  const handleFetchMarketIndices = useCallback(
    async (options?: {
      forceRefresh?: boolean;
      simulateError?: boolean;
      simulateSingleIndexUnavailableId?: string | null;
    }) => {
      const reqSeq = ++marketRequestSeqRef.current;
      setMarketLoading(true);
      if (options?.simulateError === false) {
        setMarketError(null);
      }
      const singleUnavailableId =
        options?.simulateSingleIndexUnavailableId !== undefined
          ? options.simulateSingleIndexUnavailableId
          : simulatedUnavailableIndexId;

      const res = await fetchIndianMarketIndices({
        forceRefresh: options?.forceRefresh,
        simulateError: options?.simulateError,
        simulateSingleIndexUnavailableId: singleUnavailableId,
      });

      // Discard out-of-order stale response if a newer request was initiated
      if (reqSeq !== marketRequestSeqRef.current) return;

      if (res.status === 'success' && res.data) {
        setMarketData(res.data);
        setMarketStaleCache(res.isStaleClientCache);
        setMarketError(null);
      } else {
        setMarketError(
          res.errorMessage || 'Failed to retrieve live Indian stock market indices.'
        );
      }
      setMarketLoading(false);
    },
    [simulatedUnavailableIndexId]
  );

  const handleSimulateSingleIndexUnavailable = useCallback(
    (indexId: string | null) => {
      setSimulatedUnavailableIndexId(indexId);
      handleFetchMarketIndices({
        forceRefresh: false,
        simulateError: false,
        simulateSingleIndexUnavailableId: indexId,
      });
    },
    [handleFetchMarketIndices]
  );

  const handleFetchEconomicNews = useCallback(
    async (options?: { forceRefresh?: boolean; simulateError?: boolean }) => {
      const reqSeq = ++newsRequestSeqRef.current;
      setNewsLoading(true);
      if (options?.simulateError === false) {
        setNewsError(null);
      }
      const res = await fetchEconomicNews({
        forceRefresh: options?.forceRefresh,
        simulateError: options?.simulateError,
      });

      // Discard out-of-order stale response if a newer request was initiated
      if (reqSeq !== newsRequestSeqRef.current) return;

      if (res.status === 'success' && res.data) {
        setNewsData(res.data);
        setNewsStaleCache(res.isStaleClientCache);
        setNewsError(null);
      } else {
        if (res.data) {
          setNewsData(res.data);
          setNewsStaleCache(true);
        }
        setNewsError(
          res.errorMessage ||
            'Failed to retrieve live economic news and current affairs intelligence.'
        );
      }
      setNewsLoading(false);
    },
    []
  );

  const handleFetchEconomistBites = useCallback(
    async (options?: { forceRefresh?: boolean; simulateError?: boolean }) => {
      const reqSeq = ++bitesRequestSeqRef.current;
      setBitesLoading(true);
      if (options?.simulateError === false) {
        setBitesError(null);
      }
      const res = await fetchEconomistBites({
        forceRefresh: options?.forceRefresh,
        simulateError: options?.simulateError,
      });

      if (reqSeq !== bitesRequestSeqRef.current) return;

      if (res.status === 'success' && res.data) {
        setBitesData(res.data);
        setBitesStaleCache(res.isStaleClientCache);
        setBitesError(null);
      } else {
        if (res.data) {
          setBitesData(res.data);
          setBitesStaleCache(true);
        }
        setBitesError(
          res.errorMessage ||
            "Failed to retrieve source-verified Economists' Latest Bites."
        );
      }
      setBitesLoading(false);
    },
    []
  );

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

  const handleFetchOfficialPlfs = useCallback(async (simulateError = false) => {
    setPlfsLoading(true);
    setPlfsError(null);
    const result = await loadOfficialPlfsData({ simulateError });
    setPlfsLastVerified(result.lastVerified);
    setPlfsDataOrigin(result.dataOrigin);
    if (result.status === 'success' && result.indicator) {
      setOfficialPlfsIndicator(result.indicator);
      setPlfsError(null);
    } else {
      setPlfsError(
        result.errorMessage || 'Failed to load official MoSPI PLFS Unemployment dataset.'
      );
    }
    setPlfsLoading(false);
  }, []);

  const handleFetchOfficialUsdInr = useCallback(
    async (options?: { simulateError?: boolean; simulateEmpty?: boolean }) => {
      setUsdInrLoading(true);
      setUsdInrError(null);
      setUsdInrEmpty(false);
      const result = await loadOfficialUsdInrData(options);
      setUsdInrRetrievalTimestamp(result.retrievalTimestamp);
      setUsdInrDataOrigin(result.dataOrigin);
      if (result.status === 'success' && result.indicator) {
        setOfficialUsdInrIndicator(result.indicator);
        setUsdInrError(null);
        setUsdInrEmpty(false);
      } else if (result.status === 'empty') {
        setUsdInrEmpty(true);
        setUsdInrError(null);
      } else {
        setUsdInrError(
          result.errorMessage ||
            'Failed to load official RBI DBIE / FBIL USD/INR Reference Rate dataset.'
        );
      }
      setUsdInrLoading(false);
    },
    []
  );

  const handleFetchOfficialCrude = useCallback(async (simulateError = false) => {
    setCrudeLoading(true);
    setCrudeError(null);
    const result = await loadOfficialCrudeOilData({ simulateError });
    setCrudeRetrievalTimestamp(result.retrievalTimestamp);
    setCrudeDataOrigin(result.dataOrigin);
    if (result.status === 'success' && result.indicator) {
      setOfficialCrudeIndicator(result.indicator);
      setCrudeError(null);
    } else {
      setCrudeError(
        result.errorMessage ||
          'Failed to load official PPAC Indian Basket Crude Oil dataset.'
      );
    }
    setCrudeLoading(false);
  }, []);

  const handleFetchOfficialTrade = useCallback(async (simulateError = false) => {
    setTradeLoading(true);
    setTradeError(null);
    const result = await loadOfficialMerchandiseTradeData({ simulateError });
    setTradeRetrievalTimestamp(result.retrievalTimestamp);
    setTradeDataOrigin(result.dataOrigin);
    if (result.status === 'success' && result.indicator) {
      setOfficialTradeIndicator(result.indicator);
      setTradeError(null);
    } else {
      setTradeError(
        result.errorMessage ||
          'Failed to load official Ministry of Commerce Merchandise Trade dataset.'
      );
    }
    setTradeLoading(false);
  }, []);

  useEffect(() => {
    handleFetchOfficialCpi(false);
    handleFetchOfficialGdp(false);
    handleFetchOfficialRepo(false);
    handleFetchOfficialPlfs(false);
    handleFetchOfficialUsdInr({ simulateError: false, simulateEmpty: false });
    handleFetchOfficialCrude(false);
    handleFetchOfficialTrade(false);
    handleFetchMarketIndices({ forceRefresh: false, simulateError: false });
    handleFetchEconomicNews({ forceRefresh: false, simulateError: false });
    handleFetchEconomistBites({ forceRefresh: false, simulateError: false });
  }, [
    handleFetchOfficialCpi,
    handleFetchOfficialGdp,
    handleFetchOfficialRepo,
    handleFetchOfficialPlfs,
    handleFetchOfficialUsdInr,
    handleFetchOfficialCrude,
    handleFetchOfficialTrade,
    handleFetchMarketIndices,
    handleFetchEconomicNews,
    handleFetchEconomistBites,
  ]);

  // Safe automatic polling for Economists' Latest Bites (configurable via VITE_ECONOMIST_BITES_POLL_INTERVAL_MS, default 300,000ms = 5m)
  useEffect(() => {
    if (!bitesAutoRefresh || bitesError) return;
    const bitesPollMs = Math.max(
      60000,
      Number(import.meta.env.VITE_ECONOMIST_BITES_POLL_INTERVAL_MS) || 300000
    );

    const timerId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        handleFetchEconomistBites({ forceRefresh: false, simulateError: false });
      }
    }, bitesPollMs);

    const handleBitesVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const lastFetchedMs = bitesData?.fetchedAtMs || 0;
        if (Date.now() - lastFetchedMs >= bitesPollMs) {
          handleFetchEconomistBites({ forceRefresh: false, simulateError: false });
        }
      }
    };

    document.addEventListener('visibilitychange', handleBitesVisibilityChange);
    return () => {
      window.clearInterval(timerId);
      document.removeEventListener('visibilitychange', handleBitesVisibilityChange);
    };
  }, [bitesAutoRefresh, bitesError, bitesData?.fetchedAtMs, handleFetchEconomistBites]);

  // Safe automatic polling for Live Economic News (configurable via VITE_ECONOMIC_NEWS_POLL_INTERVAL_MS, default 300,000ms = 5m)
  useEffect(() => {
    if (!newsAutoRefresh || newsError) return;
    const newsPollMs = Math.max(
      60000,
      Number(import.meta.env.VITE_ECONOMIC_NEWS_POLL_INTERVAL_MS) || 300000
    );

    const timerId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        handleFetchEconomicNews({ forceRefresh: false, simulateError: false });
      }
    }, newsPollMs);

    const handleNewsVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const lastFetchedMs = newsData?.fetchedAtMs || 0;
        if (Date.now() - lastFetchedMs >= newsPollMs) {
          handleFetchEconomicNews({ forceRefresh: false, simulateError: false });
        }
      }
    };

    document.addEventListener('visibilitychange', handleNewsVisibilityChange);
    return () => {
      window.clearInterval(timerId);
      document.removeEventListener('visibilitychange', handleNewsVisibilityChange);
    };
  }, [newsAutoRefresh, newsError, newsData?.fetchedAtMs, handleFetchEconomicNews]);

  // Safe automatic polling for Live Indian Market Indices (configurable via VITE_MARKET_OPEN_POLL_INTERVAL_MS / VITE_MARKET_CLOSED_POLL_INTERVAL_MS)
  useEffect(() => {
    if (!marketAutoRefresh || marketError) return;

    const sessionState = marketData?.marketStatus || 'CLOSED';
    const openPollMs = Math.max(
      15000,
      Number(import.meta.env.VITE_MARKET_OPEN_POLL_INTERVAL_MS) || 30000
    );
    const closedPollMs = Math.max(
      60000,
      Number(import.meta.env.VITE_MARKET_CLOSED_POLL_INTERVAL_MS) || 300000
    );
    // Only poll actively when market is OPEN or PRE_OPEN (default 30s interval); when CLOSED, check once every 5 minutes in case session opens
    const intervalMs =
      sessionState === 'OPEN' || sessionState === 'PRE_OPEN' ? openPollMs : closedPollMs;

    const timerId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        handleFetchMarketIndices({ forceRefresh: false });
      }
    }, intervalMs);

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        (sessionState === 'OPEN' || sessionState === 'PRE_OPEN')
      ) {
        const lastFetchedMs = marketData?.fetchedAtMs || 0;
        if (Date.now() - lastFetchedMs >= openPollMs) {
          handleFetchMarketIndices({ forceRefresh: false });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.clearInterval(timerId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    marketAutoRefresh,
    marketError,
    marketData?.marketStatus,
    marketData?.fetchedAtMs,
    handleFetchMarketIndices,
  ]);

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

  const handleUploadCustomPlfsCsv = useCallback((csvText: string) => {
    try {
      const updated = saveUserUploadedPlfsCsv(csvText);
      setOfficialPlfsIndicator(updated);
      setPlfsError(null);
      setPlfsDataOrigin('user_uploaded_csv');
      setPlfsLastVerified(
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
        error: err?.message || 'Invalid MoSPI PLFS CSV format.',
      };
    }
  }, []);

  const handleResetCustomPlfsCsv = useCallback(() => {
    clearUserUploadedPlfsCsv();
    handleFetchOfficialPlfs(false);
  }, [handleFetchOfficialPlfs]);

  const handleActivatePlfsDemoFallback = useCallback(() => {
    const demoFallback =
      baseIndicators.find((i) => i.id === 'unemployment-rate') || baseIndicators[2];
    setOfficialPlfsIndicator({
      ...demoFallback,
      name: 'Unemployment Rate (Labelled Demonstration Fallback)',
      shortName: 'Unemployment Rate (Demo Fallback)',
      sourceShortName: 'MoSPI PLFS (Demo Fallback)',
      isOfficialData: false,
    });
    setPlfsError(null);
    setPlfsDataOrigin('demonstration_fallback');
    setPlfsLastVerified(
      `${new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })} (Demo State)`
    );
  }, [baseIndicators]);

  const handleUploadCustomUsdInrCsv = useCallback((csvText: string) => {
    try {
      const updated = saveUserUploadedUsdInrCsv(csvText);
      setOfficialUsdInrIndicator(updated);
      setUsdInrError(null);
      setUsdInrEmpty(false);
      setUsdInrDataOrigin('user_uploaded_csv');
      setUsdInrRetrievalTimestamp(
        new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      return { ok: true };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'Invalid RBI/FBIL USD/INR CSV format.',
      };
    }
  }, []);

  const handleResetCustomUsdInrCsv = useCallback(() => {
    clearUserUploadedUsdInrCsv();
    handleFetchOfficialUsdInr({ simulateError: false, simulateEmpty: false });
  }, [handleFetchOfficialUsdInr]);

  const handleActivateUsdInrDemoFallback = useCallback(() => {
    const demoFallback =
      baseIndicators.find((i) => i.id === 'usd-inr') || baseIndicators[3];
    setOfficialUsdInrIndicator({
      ...demoFallback,
      name: 'USD / INR Exchange Rate (Labelled Demonstration Fallback)',
      shortName: 'USD / INR (Demo Fallback)',
      sourceShortName: 'RBI / FBIL (Demo Fallback)',
      isOfficialData: false,
    });
    setUsdInrError(null);
    setUsdInrEmpty(false);
    setUsdInrDataOrigin('demonstration_fallback');
    setUsdInrRetrievalTimestamp(
      `${new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })} (Demo State)`
    );
  }, [baseIndicators]);

  const handleUploadCustomCrudeCsv = useCallback((csvText: string) => {
    try {
      const updated = saveUserUploadedCrudeCsv(csvText);
      setOfficialCrudeIndicator(updated);
      setCrudeError(null);
      setCrudeDataOrigin('user_uploaded_csv');
      setCrudeRetrievalTimestamp(
        new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      return { ok: true };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'Invalid PPAC Crude Oil CSV format.',
      };
    }
  }, []);

  const handleResetCustomCrudeCsv = useCallback(() => {
    clearUserUploadedCrudeCsv();
    handleFetchOfficialCrude(false);
  }, [handleFetchOfficialCrude]);

  const handleActivateCrudeDemoFallback = useCallback(() => {
    const demoFallback =
      baseIndicators.find((i) => i.id === 'crude-oil') || baseIndicators[4];
    setOfficialCrudeIndicator({
      ...demoFallback,
      name: 'Indian Basket Crude Oil Price (Labelled Demonstration Fallback)',
      shortName: 'Indian Basket Crude (Demo Fallback)',
      sourceShortName: 'PPAC (Demo Fallback)',
      isOfficialData: false,
    });
    setCrudeError(null);
    setCrudeDataOrigin('demonstration_fallback');
    setCrudeRetrievalTimestamp(
      `${new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })} (Demo State)`
    );
  }, [baseIndicators]);

  const handleUploadCustomTradeCsv = useCallback((csvText: string) => {
    try {
      const updated = saveUserUploadedTradeCsv(csvText);
      setOfficialTradeIndicator(updated);
      setTradeError(null);
      setTradeDataOrigin('user_uploaded_csv');
      setTradeRetrievalTimestamp(
        new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      return { ok: true };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'Invalid MoCI Merchandise Trade CSV format.',
      };
    }
  }, []);

  const handleResetCustomTradeCsv = useCallback(() => {
    clearUserUploadedTradeCsv();
    handleFetchOfficialTrade(false);
  }, [handleFetchOfficialTrade]);

  const handleActivateTradeDemoFallback = useCallback(() => {
    const demoFallback =
      baseIndicators.find((i) => i.id === 'merchandise-trade') ||
      baseIndicators[baseIndicators.length - 1];
    setOfficialTradeIndicator({
      ...demoFallback,
      name: 'India Merchandise Trade Balance (Labelled Demonstration Fallback)',
      shortName: 'Merchandise Trade (Demo Fallback)',
      sourceShortName: 'MoCI / DGCI&S (Demo Fallback)',
      isOfficialData: false,
    });
    setTradeError(null);
    setTradeDataOrigin('demonstration_fallback');
    setTradeRetrievalTimestamp(
      `${new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })} (Demo State)`
    );
  }, [baseIndicators]);

  // Merge official MoSPI GDP, CPI, PLFS Unemployment, FBIL/RBI USD/INR, PPAC Crude Oil, MoCI Merchandise Trade, and RBI Repo Rate indicators
  const indicators = useMemo(() => {
    return baseIndicators.map((ind) => {
      if (ind.id === 'gdp-growth' && officialGdpIndicator) return officialGdpIndicator;
      if (ind.id === 'cpi-inflation' && officialCpiIndicator) return officialCpiIndicator;
      if (ind.id === 'rbi-repo-rate' && officialRepoIndicator) return officialRepoIndicator;
      if (ind.id === 'unemployment-rate' && officialPlfsIndicator) return officialPlfsIndicator;
      if (ind.id === 'usd-inr' && officialUsdInrIndicator) return officialUsdInrIndicator;
      if (ind.id === 'crude-oil' && officialCrudeIndicator) return officialCrudeIndicator;
      if (ind.id === 'merchandise-trade' && officialTradeIndicator) return officialTradeIndicator;
      return ind;
    });
  }, [
    baseIndicators,
    officialGdpIndicator,
    officialCpiIndicator,
    officialRepoIndicator,
    officialPlfsIndicator,
    officialUsdInrIndicator,
    officialCrudeIndicator,
    officialTradeIndicator,
  ]);

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

  // Synchronize browser Back/Forward (popstate) and hashchange events with activePage & focusedIndicatorId
  useEffect(() => {
    const syncFromUrl = () => {
      const resolved = resolvePageFromLocation(
        window.location.hash,
        window.location.search
      );
      setActivePage(resolved.pageId);
      setFocusedIndicatorId(resolved.indicatorId);
    };
    window.addEventListener('popstate', syncFromUrl);
    window.addEventListener('hashchange', syncFromUrl);
    return () => {
      window.removeEventListener('popstate', syncFromUrl);
      window.removeEventListener('hashchange', syncFromUrl);
    };
  }, []);

  const handleSelectPage = useCallback((pageId: PageId, indicatorId?: string) => {
    setActivePage(pageId);
    setFocusedIndicatorId(indicatorId || null);
    if (typeof window !== 'undefined') {
      const targetHash = indicatorId
        ? `#${pageId}?indicator=${encodeURIComponent(indicatorId)}`
        : pageId === 'overview'
        ? window.location.pathname
        : `#${pageId}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState({ pageId, indicatorId: indicatorId || null }, '', targetHash);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

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
  const tradeIndicator = useMemo(
    () =>
      indicators.find((i) => i.id === 'merchandise-trade') ||
      indicators[indicators.length - 1],
    [indicators]
  );

  const handleSelectTickerIndex = useCallback(
    (indexId: string) => {
      setSelectedMarketIndexId(indexId);
      if (activePage !== 'overview' && activePage !== 'financial-markets') {
        setActivePage('overview');
      }
      setTimeout(() => {
        const el = document.getElementById('live-indian-markets-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 80);
    },
    [activePage]
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
            plfsLoading={plfsLoading}
            plfsError={plfsError}
            onRetryPlfs={() => handleFetchOfficialPlfs(false)}
            usdInrLoading={usdInrLoading}
            usdInrError={usdInrError}
            onRetryUsdInr={() =>
              handleFetchOfficialUsdInr({ simulateError: false, simulateEmpty: false })
            }
            crudeLoading={crudeLoading}
            crudeError={crudeError}
            onRetryCrude={() => handleFetchOfficialCrude(false)}
            tradeLoading={tradeLoading}
            tradeError={tradeError}
            onRetryTrade={() => handleFetchOfficialTrade(false)}
            marketData={marketData}
            marketLoading={marketLoading}
            marketError={marketError}
            marketStaleCache={marketStaleCache}
            marketAutoRefresh={marketAutoRefresh}
            onToggleMarketAutoRefresh={() => setMarketAutoRefresh((prev) => !prev)}
            onRefreshMarketNow={() =>
              handleFetchMarketIndices({ forceRefresh: true, simulateError: false })
            }
            onSimulateMarketError={(simErr) =>
              handleFetchMarketIndices({ forceRefresh: false, simulateError: simErr })
            }
            simulatedUnavailableIndexId={simulatedUnavailableIndexId}
            onSimulateSingleIndexUnavailable={handleSimulateSingleIndexUnavailable}
            selectedMarketIndexId={selectedMarketIndexId}
            onSelectMarketIndexId={setSelectedMarketIndexId}
            newsData={newsData}
            newsLoading={newsLoading}
            newsError={newsError}
            newsStaleCache={newsStaleCache}
            newsAutoRefresh={newsAutoRefresh}
            onToggleNewsAutoRefresh={() => setNewsAutoRefresh((prev) => !prev)}
            onRefreshNewsNow={() =>
              handleFetchEconomicNews({ forceRefresh: true, simulateError: false })
            }
            onSimulateNewsError={(simErr) =>
              handleFetchEconomicNews({ forceRefresh: false, simulateError: simErr })
            }
            bitesData={bitesData}
            bitesLoading={bitesLoading}
            bitesError={bitesError}
            bitesStaleCache={bitesStaleCache}
            bitesAutoRefresh={bitesAutoRefresh}
            onToggleBitesAutoRefresh={() => setBitesAutoRefresh((prev) => !prev)}
            onRefreshBitesNow={(force) =>
              handleFetchEconomistBites({ forceRefresh: Boolean(force), simulateError: false })
            }
            onSimulateBitesError={(simErr) =>
              handleFetchEconomistBites({ forceRefresh: false, simulateError: simErr })
            }
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
        return (
          <LabourMarketPage
            indicator={labourIndicator}
            isLoading={plfsLoading}
            errorMessage={plfsError}
            lastVerified={plfsLastVerified}
            dataOrigin={plfsDataOrigin}
            onRefreshOfficialPlfs={(simErr) => handleFetchOfficialPlfs(Boolean(simErr))}
            onUploadCustomCsv={handleUploadCustomPlfsCsv}
            onResetCustomCsv={handleResetCustomPlfsCsv}
            onActivateDemoFallback={handleActivatePlfsDemoFallback}
            theme={theme}
          />
        );
      case 'currency-oil':
        return (
          <CurrencyOilPage
            inrIndicator={inrIndicator}
            crudeIndicator={crudeIndicator}
            tradeIndicator={tradeIndicator}
            allIndicators={indicators}
            usdInrLoading={usdInrLoading}
            usdInrError={usdInrError}
            usdInrEmpty={usdInrEmpty}
            usdInrRetrievalTimestamp={usdInrRetrievalTimestamp}
            usdInrDataOrigin={usdInrDataOrigin}
            onRefreshOfficialUsdInr={handleFetchOfficialUsdInr}
            onUploadCustomUsdInrCsv={handleUploadCustomUsdInrCsv}
            onResetCustomUsdInrCsv={handleResetCustomUsdInrCsv}
            onActivateUsdInrDemoFallback={handleActivateUsdInrDemoFallback}
            crudeLoading={crudeLoading}
            crudeError={crudeError}
            crudeRetrievalTimestamp={crudeRetrievalTimestamp}
            crudeDataOrigin={crudeDataOrigin}
            onRefreshOfficialCrude={(simErr) => handleFetchOfficialCrude(Boolean(simErr))}
            onUploadCustomCrudeCsv={handleUploadCustomCrudeCsv}
            onResetCustomCrudeCsv={handleResetCustomCrudeCsv}
            onActivateCrudeDemoFallback={handleActivateCrudeDemoFallback}
            tradeLoading={tradeLoading}
            tradeError={tradeError}
            tradeRetrievalTimestamp={tradeRetrievalTimestamp}
            tradeDataOrigin={tradeDataOrigin}
            onRefreshOfficialTrade={(simErr) => handleFetchOfficialTrade(Boolean(simErr))}
            onUploadCustomTradeCsv={handleUploadCustomTradeCsv}
            onResetCustomTradeCsv={handleResetCustomTradeCsv}
            onActivateTradeDemoFallback={handleActivateTradeDemoFallback}
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
            marketData={marketData}
            marketLoading={marketLoading}
            marketError={marketError}
            marketStaleCache={marketStaleCache}
            marketAutoRefresh={marketAutoRefresh}
            onToggleMarketAutoRefresh={() => setMarketAutoRefresh((prev) => !prev)}
            onRefreshMarketNow={() =>
              handleFetchMarketIndices({ forceRefresh: true, simulateError: false })
            }
            onSimulateMarketError={(simErr) =>
              handleFetchMarketIndices({ forceRefresh: false, simulateError: simErr })
            }
            simulatedUnavailableIndexId={simulatedUnavailableIndexId}
            onSimulateSingleIndexUnavailable={handleSimulateSingleIndexUnavailable}
            selectedMarketIndexId={selectedMarketIndexId}
            onSelectMarketIndexId={setSelectedMarketIndexId}
          />
        );
      case 'economic-news':
        return (
          <EconomicNewsPage
            newsData={newsData}
            isLoading={newsLoading}
            errorMessage={newsError}
            isStaleCache={newsStaleCache}
            autoRefreshEnabled={newsAutoRefresh}
            onToggleAutoRefresh={() => setNewsAutoRefresh((prev) => !prev)}
            onRefreshNow={() =>
              handleFetchEconomicNews({ forceRefresh: true, simulateError: false })
            }
            onSimulateError={(simErr) =>
              handleFetchEconomicNews({ forceRefresh: false, simulateError: simErr })
            }
            onSelectPage={handleSelectPage}
            theme={theme}
          />
        );
      case 'economist-bites':
        return (
          <EconomistBitesPage
            data={bitesData}
            loading={bitesLoading}
            error={bitesError}
            isStaleCache={bitesStaleCache}
            autoRefreshEnabled={bitesAutoRefresh}
            onToggleAutoRefresh={() => setBitesAutoRefresh((prev) => !prev)}
            onRefresh={(force) =>
              handleFetchEconomistBites({ forceRefresh: Boolean(force), simulateError: false })
            }
            onSimulateError={(simErr) =>
              handleFetchEconomistBites({ forceRefresh: false, simulateError: simErr })
            }
            onNavigate={handleSelectPage}
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
      {/* WCAG 2.2 AA Skip to Main Content Keyboard Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-emerald-600 focus:text-white focus:text-xs focus:font-semibold focus:shadow-lg"
      >
        Skip to main content
      </a>

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

        {/* Compact Live Indian Market Indices Ticker at Top of Dashboard */}
        <LiveMarketTickerStrip
          marketData={marketData}
          isLoading={marketLoading}
          errorMessage={marketError}
          isStaleCache={marketStaleCache}
          onRefresh={() =>
            handleFetchMarketIndices({ forceRefresh: true, simulateError: false })
          }
          onSelectIndexCard={handleSelectTickerIndex}
          theme={theme}
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
            <span className="font-semibold text-emerald-400">Official Data (All 7 Macro Series): </span>
            <span>
              <strong>GDP</strong> (<strong className="font-mono-tabular text-emerald-400">7.8%</strong>), <strong>CPI</strong> (<strong className="font-mono-tabular text-emerald-400">5.54%</strong>), <strong>PLFS UR</strong> (<strong className="font-mono-tabular text-emerald-400">5.0%</strong>), <strong>USD/INR</strong> (<strong className="font-mono-tabular text-emerald-400">₹94.6986</strong>), <strong>PPAC Crude</strong> (<strong className="font-mono-tabular text-emerald-400">$116.09</strong>), <strong>Trade Bal</strong> (<strong className="font-mono-tabular text-emerald-400">-$30.21B</strong>), &amp; <strong>RBI Repo</strong> (<strong className="font-mono-tabular text-emerald-400">5.50%</strong>).
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
              onClick={() => handleSelectPage('labour-market', 'unemployment-rate')}
              className="text-emerald-300 hover:underline font-medium cursor-pointer whitespace-nowrap"
            >
              MoSPI PLFS →
            </button>
            <button
              type="button"
              onClick={() => handleSelectPage('currency-oil', 'merchandise-trade')}
              className="text-amber-300 hover:underline font-medium cursor-pointer whitespace-nowrap"
            >
              MoCI Trade, Crude &amp; FX →
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
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 focus:outline-none"
        >
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
                        : focusedIndicator.id === 'merchandise-trade'
                        ? `${focusedIndicator.currentValue < 0 ? '-$' : '+$'}${Math.abs(focusedIndicator.currentValue).toFixed(2)}B`
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
              <ErrorBoundary
                key={activePage}
                sectionName={`Module (${activePage})`}
                theme={theme}
              >
                <React.Suspense
                  fallback={
                    <div
                      role="status"
                      aria-live="polite"
                      className="rounded-xl border border-slate-800/80 bg-[#0D1527]/70 p-8 text-center text-sm text-slate-400"
                    >
                      Loading module…
                    </div>
                  }
                >
                  {renderActivePage()}
                </React.Suspense>
              </ErrorBoundary>
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
                onClick={() => handleSelectPage('economist-bites')}
                className="hover:text-emerald-400 transition-colors cursor-pointer"
              >
                Economists&apos; Latest Bites
              </button>
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
