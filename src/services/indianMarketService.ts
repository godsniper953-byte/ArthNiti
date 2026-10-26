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

export function isRetryableHttpStatus(status: number): boolean {
  // Never retry permanent client errors (400, 401, 403, 404, 405, 422)
  if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
    return false;
  }
  return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

export function computeBackoffDelayMs(
  attempt: number,
  baseDelayMs = 250,
  maxDelayMs = 2500
): number {
  const safeAttempt = Math.max(0, Math.min(attempt, 5));
  const exponential = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, safeAttempt));
  const jitter = Math.floor(Math.random() * 120);
  return Math.min(maxDelayMs, exponential + jitter);
}

/**
 * Prevents out-of-order (stale) responses from overwriting newer completed responses.
 * Tracks monotonically increasing request IDs and the latest applied request ID.
 */
export function createOutOfOrderResponseGuard() {
  let issuedSeq = 0;
  let latestCompletedSeq = 0;

  return {
    nextRequestId(): number {
      issuedSeq += 1;
      return issuedSeq;
    },
    shouldApplyResponse(requestId: number): boolean {
      if (requestId >= latestCompletedSeq) {
        latestCompletedSeq = requestId;
        return true;
      }
      return false;
    },
    getLatestCompletedId(): number {
      return latestCompletedSeq;
    },
  };
}

const marketResponseGuard = createOutOfOrderResponseGuard();
let latestAppliedMarketResult: ClientMarketDataResult | null = null;

/**
 * Fetches live/delayed Indian stock market indices from the server-side proxy (/api/market-indices).
 * Deduplicates overlapping requests, applies bounded exponential backoff with jitter on retryable failures,
 * prevents out-of-order stale overwrites, and never fabricates or simulates live prices.
 */
export async function fetchIndianMarketIndices(options?: {
  forceRefresh?: boolean;
  simulateError?: boolean;
  simulateSingleIndexUnavailableId?: string | null;
  maxRetries?: number;
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

  const maxRetries = options?.maxRetries ?? 2;
  const requestId = marketResponseGuard.nextRequestId();

  const requestTask = (async (): Promise<ClientMarketDataResult> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
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
          const statusErr = new Error(
            `Server market route /api/market-indices returned HTTP ${response.status}`
          );
          if (!isRetryableHttpStatus(response.status) || attempt === maxRetries) {
            throw statusErr;
          }
          lastError = statusErr;
          const waitMs = computeBackoffDelayMs(attempt);
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
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

        const freshResult: ClientMarketDataResult = {
          status: 'success',
          data: payload,
          isStaleClientCache: payload.cacheStatus === 'STALE_FALLBACK',
          errorMessage: null,
        };

        if (marketResponseGuard.shouldApplyResponse(requestId)) {
          saveLastKnownMarketPayload(payload);
          latestAppliedMarketResult = freshResult;
          return freshResult;
        }

        return latestAppliedMarketResult || freshResult;
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err instanceof Error ? err : new Error(String(err));
        const isPermanentHttp =
          lastError.message.includes('HTTP 400') ||
          lastError.message.includes('HTTP 404') ||
          lastError.message.includes('HTTP 405');
        if (isPermanentHttp || attempt === maxRetries) {
          break;
        }
        const waitMs = computeBackoffDelayMs(attempt);
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }

    try {
      throw lastError || new Error('Unable to retrieve live Indian market indices.');
    } catch (err: any) {
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
