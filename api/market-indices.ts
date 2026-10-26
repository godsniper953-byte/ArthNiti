/**
 * Server-side Indian Stock Market Indices Proxy & Normalization Handler
 * Compatible with both:
 *   1. Vercel Serverless Functions (/api/market-indices)
 *   2. Express + Vite development/production server (server.ts)
 *
 * Fetches real market data for:
 *   - NIFTY 50 (^NSEI)
 *   - BSE SENSEX (^BSESN)
 *   - BANK NIFTY (^NSEBANK)
 *   - NIFTY IT (^CNXIT)
 *   - NIFTY MIDCAP 100 (NIFTY_MIDCAP_100.NS)
 *
 * Strictly adheres to ArthNiti's data integrity rules:
 *   - Never invents or simulates live prices.
 *   - Returns per-index error/unavailable state if an upstream symbol fails.
 *   - Enforces server-side caching to prevent upstream rate limiting.
 */

export interface IntradayPricePoint {
  timestamp: number;
  timeLabelIst: string;
  price: number;
  open: number | null;
  high: number | null;
  low: number | null;
}

export type MarketSessionState = 'OPEN' | 'PRE_OPEN' | 'CLOSED';

export interface IndianMarketIndexQuote {
  id: string;
  name: string;
  shortName: string;
  symbol: string;
  exchange: 'NSE' | 'BSE';
  fullExchangeName: string;
  constituentsCount: number;
  methodologyNote: string;
  status: 'ok' | 'unavailable';
  errorMessage?: string;
  currentValue: number | null;
  previousClose: number | null;
  pointChange: number | null;
  percentChange: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  marketStatus: MarketSessionState;
  marketStatusLabel: string;
  exchangeTimestampMs: number | null;
  exchangeTimeIst: string | null;
  lastUpdatedIst: string;
  dataSource: string;
  dataDelayDisclosure: string;
  isRealtime: boolean;
  intradayPoints: IntradayPricePoint[];
}

export interface IndianMarketIndicesResponse {
  ok: boolean;
  fetchedAtMs: number;
  fetchedAtIst: string;
  marketStatus: MarketSessionState;
  marketStatusLabel: string;
  tradingHoursNoteIst: string;
  providerName: string;
  dataDelayDisclosure: string;
  cacheStatus: 'MISS' | 'HIT' | 'STALE_FALLBACK';
  cacheAgeSeconds: number;
  recommendedPollIntervalSeconds: number;
  indices: IndianMarketIndexQuote[];
}

interface IndexConfig {
  id: string;
  name: string;
  shortName: string;
  yahooSymbol: string;
  exchange: 'NSE' | 'BSE';
  fullExchangeName: string;
  constituentsCount: number;
  methodologyNote: string;
}

export const INDIAN_MARKET_INDICES_CONFIG: IndexConfig[] = [
  {
    id: 'nifty-50',
    name: 'NIFTY 50',
    shortName: 'NIFTY 50',
    yahooSymbol: '^NSEI',
    exchange: 'NSE',
    fullExchangeName: 'National Stock Exchange of India (NSE)',
    constituentsCount: 50,
    methodologyNote:
      'Flagship free-float market-cap weighted benchmark of 50 large-cap Indian companies across 14 sectors on NSE (Base: Nov 3, 1995 = 1000).',
  },
  {
    id: 'bse-sensex',
    name: 'BSE SENSEX',
    shortName: 'SENSEX',
    yahooSymbol: '^BSESN',
    exchange: 'BSE',
    fullExchangeName: 'BSE Ltd (formerly Bombay Stock Exchange)',
    constituentsCount: 30,
    methodologyNote:
      'India’s oldest benchmark index tracking 30 financially sound, blue-chip companies listed on BSE (Base: 1978–79 = 100).',
  },
  {
    id: 'bank-nifty',
    name: 'BANK NIFTY',
    shortName: 'BANK NIFTY',
    yahooSymbol: '^NSEBANK',
    exchange: 'NSE',
    fullExchangeName: 'National Stock Exchange of India (NSE)',
    constituentsCount: 12,
    methodologyNote:
      'Sectoral benchmark tracking the 12 most liquid and large capitalized Indian banking stocks traded on NSE (Base: Jan 1, 2000 = 1000).',
  },
  {
    id: 'nifty-it',
    name: 'NIFTY IT',
    shortName: 'NIFTY IT',
    yahooSymbol: '^CNXIT',
    exchange: 'NSE',
    fullExchangeName: 'National Stock Exchange of India (NSE)',
    constituentsCount: 10,
    methodologyNote:
      'Tracks 10 leading Indian Information Technology & software services exporters listed on NSE.',
  },
  {
    id: 'nifty-midcap-100',
    name: 'NIFTY MIDCAP 100',
    shortName: 'MIDCAP 100',
    yahooSymbol: 'NIFTY_MIDCAP_100.NS',
    exchange: 'NSE',
    fullExchangeName: 'National Stock Exchange of India (NSE)',
    constituentsCount: 100,
    methodologyNote:
      'Broad mid-capitalization benchmark representing 100 midcap companies from the NIFTY Midcap 150 universe on NSE.',
  },
];

// In-memory server cache to protect upstream feeds and prevent rate-limiting
let cachedPayload: IndianMarketIndicesResponse | null = null;
let cachedAtMs = 0;
let inFlightPromise: Promise<IndianMarketIndicesResponse> | null = null;

export function formatTimestampIst(epochMs: number, includeDate = true): string {
  try {
    const date = new Date(epochMs);
    if (includeDate) {
      const formatted = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(date);
      return `${formatted} IST`;
    } else {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(date);
    }
  } catch {
    return new Date(epochMs).toISOString();
  }
}

function getIstCalendarDateString(epochMs: number): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(epochMs));
  } catch {
    return '';
  }
}

export function evaluateIndianMarketSession(
  nowMs: number,
  exchangeRegularMarketTimeSec?: number
): {
  status: MarketSessionState;
  label: string;
} {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date(nowMs));

    const weekday = parts.find((p) => p.type === 'weekday')?.value || 'Mon';
    const hourRaw = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const hour = hourRaw === 24 ? 0 : hourRaw;
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    const totalMinutes = hour * 60 + minute;

    const isWeekend = weekday === 'Sat' || weekday === 'Sun';
    if (isWeekend) {
      return {
        status: 'CLOSED',
        label: 'Market Closed (Weekend) — Last Close Displayed',
      };
    }

    // Pre-open session: 09:00 IST (540m) to 09:15 IST (555m)
    if (totalMinutes >= 540 && totalMinutes < 555) {
      return {
        status: 'PRE_OPEN',
        label: 'Pre-Open Session (09:00–09:15 IST)',
      };
    }

    // Regular trading session: 09:15 IST (555m) to 15:30 IST (930m)
    if (totalMinutes >= 555 && totalMinutes < 930) {
      // Check if today is a market holiday by comparing the exchange quote date in IST with today's IST date
      if (exchangeRegularMarketTimeSec) {
        const quoteDateIst = getIstCalendarDateString(exchangeRegularMarketTimeSec * 1000);
        const nowDateIst = getIstCalendarDateString(nowMs);
        // If we are more than 20 minutes into the session and the quote date is from an earlier day, it is a market holiday
        if (quoteDateIst && nowDateIst && quoteDateIst !== nowDateIst && totalMinutes >= 575) {
          return {
            status: 'CLOSED',
            label: 'Market Closed (Holiday) — Last Close Displayed',
          };
        }
      }
      return {
        status: 'OPEN',
        label: 'Market Open (09:15–15:30 IST)',
      };
    }

    return {
      status: 'CLOSED',
      label: 'Market Closed — Last Close Displayed',
    };
  } catch {
    return {
      status: 'CLOSED',
      label: 'Market Closed — Last Close Displayed',
    };
  }
}

async function fetchYahooChartWithFallback(symbol: string): Promise<any> {
  const endpoints = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=5m&range=1d&includePrePost=false`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=5m&range=1d&includePrePost=false`,
  ];

  let lastError: Error | null = null;

  for (const url of endpoints) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} from ${new URL(url).hostname}`);
      }

      const json = await response.json();
      const result = json?.chart?.result?.[0];
      if (!result || !result.meta) {
        throw new Error(
          json?.chart?.error?.description || `Malformed chart payload for ${symbol}`
        );
      }

      return result;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error(`Failed to fetch market data for ${symbol}`);
}

async function fetchSingleIndexQuote(
  cfg: IndexConfig,
  nowMs: number
): Promise<IndianMarketIndexQuote> {
  const fetchedAtIst = formatTimestampIst(nowMs, true);

  try {
    const result = await fetchYahooChartWithFallback(cfg.yahooSymbol);
    const meta = result.meta;
    const timestamps: number[] = Array.isArray(result.timestamp) ? result.timestamp : [];
    const quoteObj = result.indicators?.quote?.[0] || {};
    const closes: (number | null)[] = Array.isArray(quoteObj.close) ? quoteObj.close : [];
    const opens: (number | null)[] = Array.isArray(quoteObj.open) ? quoteObj.open : [];
    const highs: (number | null)[] = Array.isArray(quoteObj.high) ? quoteObj.high : [];
    const lows: (number | null)[] = Array.isArray(quoteObj.low) ? quoteObj.low : [];

    const intradayPoints: IntradayPricePoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const rawClose = closes[i];
      if (typeof rawClose === 'number' && Number.isFinite(rawClose)) {
        const tsMs = timestamps[i] * 1000;
        intradayPoints.push({
          timestamp: tsMs,
          timeLabelIst: formatTimestampIst(tsMs, false),
          price: Number(rawClose.toFixed(2)),
          open:
            typeof opens[i] === 'number' && Number.isFinite(opens[i]!)
              ? Number(opens[i]!.toFixed(2))
              : null,
          high:
            typeof highs[i] === 'number' && Number.isFinite(highs[i]!)
              ? Number(highs[i]!.toFixed(2))
              : null,
          low:
            typeof lows[i] === 'number' && Number.isFinite(lows[i]!)
              ? Number(lows[i]!.toFixed(2))
              : null,
        });
      }
    }

    const rawCurrent =
      typeof meta.regularMarketPrice === 'number' && Number.isFinite(meta.regularMarketPrice)
        ? meta.regularMarketPrice
        : intradayPoints.length > 0
        ? intradayPoints[intradayPoints.length - 1].price
        : null;

    const rawPrevClose =
      typeof meta.chartPreviousClose === 'number' && Number.isFinite(meta.chartPreviousClose)
        ? meta.chartPreviousClose
        : typeof meta.previousClose === 'number' && Number.isFinite(meta.previousClose)
        ? meta.previousClose
        : null;

    if (rawCurrent === null || rawPrevClose === null || rawPrevClose <= 0) {
      throw new Error(`Missing valid price or previous close for ${cfg.name}`);
    }

    const currentValue = Number(rawCurrent.toFixed(2));
    const previousClose = Number(rawPrevClose.toFixed(2));
    // Mathematical consistency guaranteed: pointChange and percentChange derived directly from displayed values
    const pointChange = Number((currentValue - previousClose).toFixed(2));
    const percentChange = Number(((pointChange / previousClose) * 100).toFixed(2));

    // Today's Open: first non-null open from intraday bars or meta.regularMarketOpen
    const firstValidOpen = opens.find(
      (v): v is number => typeof v === 'number' && Number.isFinite(v)
    );
    const open =
      typeof meta.regularMarketOpen === 'number' && Number.isFinite(meta.regularMarketOpen)
        ? Number(meta.regularMarketOpen.toFixed(2))
        : firstValidOpen !== undefined
        ? Number(firstValidOpen.toFixed(2))
        : intradayPoints.length > 0 && intradayPoints[0].open !== null
        ? intradayPoints[0].open
        : null;

    // Today's High & Low
    const validHighs = intradayPoints
      .map((p) => p.high ?? p.price)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    const validLows = intradayPoints
      .map((p) => p.low ?? p.price)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

    const high =
      typeof meta.regularMarketDayHigh === 'number' && Number.isFinite(meta.regularMarketDayHigh)
        ? Number(meta.regularMarketDayHigh.toFixed(2))
        : validHighs.length > 0
        ? Number(Math.max(...validHighs, currentValue).toFixed(2))
        : null;

    const low =
      typeof meta.regularMarketDayLow === 'number' && Number.isFinite(meta.regularMarketDayLow)
        ? Number(meta.regularMarketDayLow.toFixed(2))
        : validLows.length > 0
        ? Number(Math.min(...validLows, currentValue).toFixed(2))
        : null;

    const fiftyTwoWeekHigh =
      typeof meta.fiftyTwoWeekHigh === 'number' && Number.isFinite(meta.fiftyTwoWeekHigh)
        ? Number(meta.fiftyTwoWeekHigh.toFixed(2))
        : null;

    const fiftyTwoWeekLow =
      typeof meta.fiftyTwoWeekLow === 'number' && Number.isFinite(meta.fiftyTwoWeekLow)
        ? Number(meta.fiftyTwoWeekLow.toFixed(2))
        : null;

    const exchangeTimeSec =
      typeof meta.regularMarketTime === 'number' && Number.isFinite(meta.regularMarketTime)
        ? meta.regularMarketTime
        : null;
    const exchangeTimestampMs = exchangeTimeSec ? exchangeTimeSec * 1000 : null;
    const exchangeTimeIst = exchangeTimestampMs
      ? formatTimestampIst(exchangeTimestampMs, true)
      : null;

    const sessionInfo = evaluateIndianMarketSession(nowMs, exchangeTimeSec ?? undefined);

    return {
      id: cfg.id,
      name: cfg.name,
      shortName: cfg.shortName,
      symbol: cfg.yahooSymbol,
      exchange: cfg.exchange,
      fullExchangeName: cfg.fullExchangeName,
      constituentsCount: cfg.constituentsCount,
      methodologyNote: cfg.methodologyNote,
      status: 'ok',
      currentValue,
      previousClose,
      pointChange,
      percentChange,
      open,
      high,
      low,
      fiftyTwoWeekHigh,
      fiftyTwoWeekLow,
      marketStatus: sessionInfo.status,
      marketStatusLabel: sessionInfo.label,
      exchangeTimestampMs,
      exchangeTimeIst,
      lastUpdatedIst: fetchedAtIst,
      dataSource: `Yahoo Finance v8 Exchange Feed (${cfg.exchange})`,
      dataDelayDisclosure:
        cfg.exchange === 'NSE'
          ? 'Near real-time / standard public exchange feed (5-min intraday intervals, auto-polled every 30s)'
          : 'Near real-time / standard BSE feed (5-min intraday intervals, auto-polled every 30s)',
      isRealtime: false,
      intradayPoints,
    };
  } catch (err: any) {
    const sessionInfo = evaluateIndianMarketSession(nowMs);
    return {
      id: cfg.id,
      name: cfg.name,
      shortName: cfg.shortName,
      symbol: cfg.yahooSymbol,
      exchange: cfg.exchange,
      fullExchangeName: cfg.fullExchangeName,
      constituentsCount: cfg.constituentsCount,
      methodologyNote: cfg.methodologyNote,
      status: 'unavailable',
      errorMessage:
        err?.message || `Live market quote for ${cfg.name} (${cfg.yahooSymbol}) is temporarily unavailable.`,
      currentValue: null,
      previousClose: null,
      pointChange: null,
      percentChange: null,
      open: null,
      high: null,
      low: null,
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekLow: null,
      marketStatus: sessionInfo.status,
      marketStatusLabel: sessionInfo.label,
      exchangeTimestampMs: null,
      exchangeTimeIst: null,
      lastUpdatedIst: fetchedAtIst,
      dataSource: `Yahoo Finance v8 Exchange Feed (${cfg.exchange})`,
      dataDelayDisclosure: 'Unavailable — No simulated or synthetic prices are shown on failure.',
      isRealtime: false,
      intradayPoints: [],
    };
  }
}

export async function fetchIndianMarketIndicesPayload(options?: {
  forceRefresh?: boolean;
}): Promise<IndianMarketIndicesResponse> {
  const nowMs = Date.now();
  const ttlSeconds = Math.max(
    5,
    parseInt(process.env.MARKET_DATA_CACHE_TTL_SECONDS || '15', 10) || 15
  );
  const ttlMs = ttlSeconds * 1000;

  // Return fresh cached response if within TTL and not forced
  if (!options?.forceRefresh && cachedPayload && nowMs - cachedAtMs < ttlMs) {
    return {
      ...cachedPayload,
      cacheStatus: 'HIT',
      cacheAgeSeconds: Math.round((nowMs - cachedAtMs) / 1000),
    };
  }

  // Deduplicate concurrent requests
  if (inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = (async () => {
    try {
      const fetchStartMs = Date.now();
      const quotes = await Promise.all(
        INDIAN_MARKET_INDICES_CONFIG.map((cfg) => fetchSingleIndexQuote(cfg, fetchStartMs))
      );

      const validQuotes = quotes.filter((q) => q.status === 'ok');

      // If all 5 failed and we have a previous valid cached payload, return it explicitly marked as STALE_FALLBACK
      if (validQuotes.length === 0 && cachedPayload) {
        return {
          ...cachedPayload,
          cacheStatus: 'STALE_FALLBACK' as const,
          cacheAgeSeconds: Math.round((Date.now() - cachedAtMs) / 1000),
        };
      }

      const firstExchangeTimeSec = validQuotes[0]?.exchangeTimestampMs
        ? Math.floor(validQuotes[0].exchangeTimestampMs / 1000)
        : undefined;
      const overallSession = evaluateIndianMarketSession(fetchStartMs, firstExchangeTimeSec);

      const responsePayload: IndianMarketIndicesResponse = {
        ok: validQuotes.length > 0,
        fetchedAtMs: fetchStartMs,
        fetchedAtIst: formatTimestampIst(fetchStartMs, true),
        marketStatus: overallSession.status,
        marketStatusLabel: overallSession.label,
        tradingHoursNoteIst:
          'NSE & BSE Regular Session: 09:15–15:30 IST (Mon–Fri) · Pre-Open: 09:00–09:15 IST',
        providerName: 'Yahoo Finance v8 Exchange Feed (NSE & BSE Indices)',
        dataDelayDisclosure:
          'Public exchange index feed via server-side proxy (/api/market-indices). Intraday charts reflect 5-minute exchange intervals; quotes may carry up to a 1–5 minute public dissemination delay depending on exchange feed licensing. Zero simulated ticks.',
        cacheStatus: 'MISS',
        cacheAgeSeconds: 0,
        recommendedPollIntervalSeconds: overallSession.status === 'OPEN' ? 30 : 60,
        indices: quotes,
      };

      if (validQuotes.length > 0) {
        cachedPayload = responsePayload;
        cachedAtMs = fetchStartMs;
      }

      return responsePayload;
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}

// Default export for Vercel Serverless Functions (/api/market-indices)
export default async function handler(req: any, res: any) {
  // Allow CORS for Vercel preview deployments
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const forceRefresh = req.query?.refresh === 'true' || req.query?.force === '1';
    const payload = await fetchIndianMarketIndicesPayload({ forceRefresh });

    // Set Vercel Edge / CDN Cache-Control headers (15s fresh, 30s stale-while-revalidate)
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
    res.status(200).json(payload);
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err?.message || 'Failed to retrieve Indian stock market indices.',
      fetchedAtMs: Date.now(),
      fetchedAtIst: formatTimestampIst(Date.now(), true),
      indices: [],
    });
  }
}
