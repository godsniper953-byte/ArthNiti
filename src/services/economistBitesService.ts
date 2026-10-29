/**
 * Client-side Economists' Latest Bites Service
 * Communicates with the server-side /api/economist-bites endpoint.
 *
 * Features:
 *   - Out-of-order response guard so overlapping manual/auto refreshes never overwrite newer state.
 *   - Bounded exponential backoff for transient network/5xx errors.
 *   - Client-side memory & localStorage stale-cache fallback with explicit provenance notice.
 *   - Zero client-side SDK or secret imports (uses type-only imports from server module).
 */

import type {
  BiteContentStatus,
  BiteDetailedAnalysis,
  BiteKeyFigure,
  BiteLinkedIndicator,
  BiteProvenanceMode,
  BiteSourceFeedStatus,
  BiteVerificationStatus,
  EconomistBite,
  EconomistBiteTopicId,
  EconomistBitesResponse,
  EconomistGeography,
  EconomistProfile,
} from '../../api/economist-bites';
import {
  computeBackoffDelayMs,
  createOutOfOrderResponseGuard,
  isRetryableHttpStatus,
} from './indianMarketService';

export type {
  BiteContentStatus,
  BiteDetailedAnalysis,
  BiteKeyFigure,
  BiteLinkedIndicator,
  BiteProvenanceMode,
  BiteSourceFeedStatus,
  BiteVerificationStatus,
  EconomistBite,
  EconomistBiteTopicId,
  EconomistBitesResponse,
  EconomistGeography,
  EconomistProfile,
};

export const ECONOMIST_BITE_TOPICS_META: Record<
  EconomistBiteTopicId,
  { label: string; shortLabel: string; description: string }
> = {
  'gdp-growth-development': {
    label: 'GDP Growth, Productivity & Economic Development',
    shortLabel: 'GDP & Growth',
    description:
      'National output trajectories, potential growth, structural transformation, and recession risks.',
  },
  'inflation-cost-of-living': {
    label: 'Inflation, Food Prices & Cost of Living',
    shortLabel: 'Inflation & Prices',
    description:
      'Headline vs core CPI dynamics, food supply shocks, energy pass-through, and household purchasing power.',
  },
  'monetary-policy-interest-rates': {
    label: 'RBI, Federal Reserve & Global Monetary Policy',
    shortLabel: 'Monetary Policy',
    description:
      'Central bank interest rate paths, liquidity corridors, inflation targeting, and neutral real rates.',
  },
  'employment-labour-markets': {
    label: 'Employment, Job Creation & Labour Markets',
    shortLabel: 'Jobs & Labour',
    description:
      'Youth employment, female labour force participation, formalisation, and skill-biased technical change.',
  },
  'fiscal-policy-debt-taxation': {
    label: 'Fiscal Policy, Sovereign Debt & Public Capex',
    shortLabel: 'Fiscal & Debt',
    description:
      'Union Budget priorities, fiscal consolidation, sovereign debt sustainability, and tax architecture.',
  },
  'currency-fx-capital-flows': {
    label: 'Indian Rupee, FX Reserves & Capital Flows',
    shortLabel: 'Rupee & FX Flows',
    description:
      'Exchange rate management, sovereign bond index inclusion, FX reserves adequacy, and BoP stability.',
  },
  'trade-tariffs-supply-chains': {
    label: 'International Trade, Tariffs & Supply Chains',
    shortLabel: 'Trade & Tariffs',
    description:
      'Export competitiveness, industrial tariffs, China+1 supply chain realignment, and WTO fragmentation.',
  },
  'manufacturing-infra-investment': {
    label: 'Manufacturing, Infrastructure & Private Capex',
    shortLabel: 'Mfg & Investment',
    description:
      'Public infrastructure multipliers, private corporate investment cycles, and industrial policy.',
  },
  'poverty-inequality-consumption': {
    label: 'Poverty, Inequality & Household Consumption',
    shortLabel: 'Consumption & Equity',
    description:
      'Rural-urban demand divergence, social safety nets, human capital, and inclusive welfare delivery.',
  },
  'ai-technology-productivity': {
    label: 'AI, Digital Public Infrastructure & Productivity',
    shortLabel: 'AI & Technology',
    description:
      'Artificial intelligence macroeconomic impact, automation vs task creation, and India Stack DPI.',
  },
  'agriculture-climate-sustainable': {
    label: 'Agriculture, Rural Economy & Climate Transition',
    shortLabel: 'Agri & Climate',
    description:
      'Monsoon resilience, agricultural terms of trade, green energy financing, and carbon transition costs.',
  },
  'banking-financial-stability': {
    label: 'Banking, Macro-Financial Stability & Capital Markets',
    shortLabel: 'Banking & Markets',
    description:
      'Bank balance sheets, unsecured credit risk weights, sovereign yields, and global financial conditions.',
  },
};

const CLIENT_BITES_STORAGE_KEY = 'arthniti_economist_bites_cache_v1';

let memoryBitesCache: EconomistBitesResponse | null = null;
const bitesResponseGuard = createOutOfOrderResponseGuard();
let latestAppliedBitesResult: FetchEconomistBitesResult | null = null;

function saveClientBitesCache(payload: EconomistBitesResponse): void {
  memoryBitesCache = payload;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(CLIENT_BITES_STORAGE_KEY, JSON.stringify(payload));
    }
  } catch {
    // Ignore storage quota errors
  }
}

function loadClientBitesCache(): EconomistBitesResponse | null {
  if (memoryBitesCache) return memoryBitesCache;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(CLIENT_BITES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as EconomistBitesResponse;
        if (parsed && Array.isArray(parsed.bites) && parsed.bites.length > 0) {
          memoryBitesCache = parsed;
          return parsed;
        }
      }
    }
  } catch {
    // Ignore corrupted storage
  }
  return null;
}

export interface FetchEconomistBitesResult {
  status: 'success' | 'error';
  data: EconomistBitesResponse | null;
  isStaleClientCache: boolean;
  errorMessage: string | null;
}

let activeClientBitesRequest: Promise<FetchEconomistBitesResult> | null = null;

export async function fetchEconomistBites(options?: {
  forceRefresh?: boolean;
  simulateError?: boolean;
  maxRetries?: number;
}): Promise<FetchEconomistBitesResult> {
  if (
    activeClientBitesRequest &&
    !options?.forceRefresh &&
    !options?.simulateError
  ) {
    return activeClientBitesRequest;
  }

  const maxRetries = options?.simulateError ? 0 : (options?.maxRetries ?? 2);
  const requestId = bitesResponseGuard.nextRequestId();

  const requestTask = (async (): Promise<FetchEconomistBitesResult> => {
    if (options?.simulateError) {
      return {
        status: 'error',
        data: loadClientBitesCache(),
        isStaleClientCache: true,
        errorMessage:
          'Simulated upstream economist ingestion failure. Displaying cached verified bites if available.',
      };
    }

    const params = new URLSearchParams();
    if (options?.forceRefresh) {
      params.set('refresh', '1');
    }

    const queryString = params.toString();
    const url = `/api/economist-bites${queryString ? `?${queryString}` : ''}`;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const res = await fetch(url, {
          headers: {
            Accept: 'application/json',
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) {
          const errBody = await res.json().catch(() => ({}));
          const statusErr = new Error(
            errBody?.error ||
              `Server returned HTTP ${res.status} when fetching Economists' Latest Bites.`
          );
          if (!isRetryableHttpStatus(res.status) || attempt === maxRetries) {
            throw statusErr;
          }
          lastError = statusErr;
          const waitMs = computeBackoffDelayMs(attempt);
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }

        const payload = (await res.json()) as EconomistBitesResponse;
        if (!payload.ok || !Array.isArray(payload.bites)) {
          throw new Error('Malformed response from /api/economist-bites endpoint.');
        }

        const freshResult: FetchEconomistBitesResult = {
          status: 'success',
          data: payload,
          isStaleClientCache: payload.cacheStatus === 'STALE_FALLBACK',
          errorMessage: null,
        };

        if (bitesResponseGuard.shouldApplyResponse(requestId)) {
          saveClientBitesCache(payload);
          latestAppliedBitesResult = freshResult;
          return freshResult;
        }

        return latestAppliedBitesResult || freshResult;
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

    const fallback = loadClientBitesCache();
    if (fallback) {
      return {
        status: 'success',
        data: {
          ...fallback,
          cacheStatus: 'STALE_FALLBACK',
        },
        isStaleClientCache: true,
        errorMessage: null,
      };
    }

    return {
      status: 'error',
      data: null,
      isStaleClientCache: false,
      errorMessage:
        lastError?.message ||
        "Failed to retrieve Economists' Latest Bites from the server.",
    };
  })().finally(() => {
    activeClientBitesRequest = null;
  });

  activeClientBitesRequest = requestTask;
  return requestTask;
}
