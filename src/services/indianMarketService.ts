import type {
  IndianMarketIndexQuote,
  IndianMarketIndicesResponse,
  IntradayPricePoint,
  MarketSessionState,
} from '../../api/market-indices';

export type {
  IndianMarketIndexQuote,
  IndianMarketIndicesResponse,
  IntradayPricePoint,
  MarketSessionState,
};

const LAST_KNOWN_CACHE_KEY = 'arthniti_indian_markets_last_known_v1';

export interface ClientMarketDataResult {
  status: 'success' | 'error';
  data: IndianMarketIndicesResponse | null;
  isStaleClientCache: boolean;
  errorMessage: string | null;
}

let activeClientRequest: Promise<ClientMarketDataResult> | null = null;

export function formatIndianIndexNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPointChange(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  const absFormatted = Math.abs(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (value > 0) return `+${absFormatted}`;
  if (value < 0) return `-${absFormatted}`;
  return '0.00';
}

export function formatPercentChange(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  const absFormatted = Math.abs(value).toFixed(2);
  if (value > 0) return `+${absFormatted}%`;
  if (value < 0) return `-${absFormatted}%`;
  return '0.00%';
}

export function getCurrentIstClockString(): string {
  try {
    const formatted = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date());
    return `${formatted} IST`;
  } catch {
    return new Date().toISOString();
  }
}

function saveLastKnownMarketPayload(payload: IndianMarketIndicesResponse): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LAST_KNOWN_CACHE_KEY, JSON.stringify(payload));
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function getLastKnownMarketPayload(): IndianMarketIndicesResponse | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(LAST_KNOWN_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as IndianMarketIndicesResponse;
      if (parsed && Array.isArray(parsed.indices) && parsed.indices.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Fetches live/delayed Indian stock market indices from the server-side proxy (/api/market-indices).
 * Deduplicates overlapping requests and never fabricates or simulates live prices.
 */
export async function fetchIndianMarketIndices(options?: {
  forceRefresh?: boolean;
  simulateError?: boolean;
  simulateSingleIndexUnavailableId?: string | null;
}): Promise<ClientMarketDataResult> {
  if (options?.simulateError) {
    return {
      status: 'error',
      data: null,
      isStaleClientCache: false,
      errorMessage:
        'Simulated Market Data Feed Outage: Unable to reach /api/market-indices exchange feed. ArthNiti never displays fabricated or simulated prices when a market feed fails.',
    };
  }

  // Prevent overlapping concurrent requests unless forceRefresh is explicitly triggered
  if (activeClientRequest && !options?.forceRefresh && !options?.simulateSingleIndexUnavailableId) {
    return activeClientRequest;
  }

  const requestTask = (async (): Promise<ClientMarketDataResult> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const query = options?.forceRefresh ? '?refresh=true' : '';
      const response = await fetch(`/api/market-indices${query}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error(
          `Server market route /api/market-indices returned HTTP ${response.status}`
        );
      }

      const payload = (await response.json()) as IndianMarketIndicesResponse;
      if (!payload || !Array.isArray(payload.indices) || payload.indices.length === 0) {
        throw new Error('Market data provider returned an empty indices array.');
      }

      // Optional diagnostic mode: test single index unavailable card state without affecting other 4 indices
      if (options?.simulateSingleIndexUnavailableId) {
        payload.indices = payload.indices.map((ind) =>
          ind.id === options.simulateSingleIndexUnavailableId
            ? {
                ...ind,
                status: 'unavailable',
                errorMessage: `Simulated index feed outage for ${ind.name} (${ind.symbol}). Other indices remain unaffected.`,
                currentValue: null,
                previousClose: null,
                pointChange: null,
                percentChange: null,
                open: null,
                high: null,
                low: null,
                intradayPoints: [],
              }
            : ind
        );
      }

      saveLastKnownMarketPayload(payload);

      return {
        status: 'success',
        data: payload,
        isStaleClientCache: payload.cacheStatus === 'STALE_FALLBACK',
        errorMessage: null,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const cached = getLastKnownMarketPayload();
      if (cached) {
        return {
          status: 'success',
          data: {
            ...cached,
            cacheStatus: 'STALE_FALLBACK',
          },
          isStaleClientCache: true,
          errorMessage:
            err?.message ||
            'Live refresh failed — displaying last verified cached observation with explicit stale warning.',
        };
      }

      return {
        status: 'error',
        data: null,
        isStaleClientCache: false,
        errorMessage:
          err?.message ||
          'Unable to retrieve live Indian market indices from /api/market-indices.',
      };
    } finally {
      activeClientRequest = null;
    }
  })();

  activeClientRequest = requestTask;
  return requestTask;
}
