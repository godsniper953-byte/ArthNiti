/**
 * Client-side Economic News & Current Affairs Intelligence Service
 * Fetches live aggregated official releases & financial news from /api/economic-news.
 *
 * Features:
 *   - Client-side memory & localStorage caching so users can still read cached stories
 *     with a transparent "Stale Cache Fallback" notice if their network drops.
 *   - Never invents or fabricates headlines, links, or dates.
 */

import type {
  AffectedArthNitiIndicator,
  EconomicNewsArticle,
  EconomicNewsResponse,
  EconomicStoryIntelligence,
  ImpactDirection,
  NewsDashboardSection,
  NewsMacroCategory,
  NewsSourceStatus,
  NewsSubTopicId,
} from '../../api/economic-news';
import { NEWS_SUBTOPICS_META } from '../../api/economic-news';
import {
  computeBackoffDelayMs,
  isRetryableHttpStatus,
} from './indianMarketService';

export type {
  AffectedArthNitiIndicator,
  EconomicNewsArticle,
  EconomicNewsResponse,
  EconomicStoryIntelligence,
  ImpactDirection,
  NewsDashboardSection,
  NewsMacroCategory,
  NewsSourceStatus,
  NewsSubTopicId,
};

export { NEWS_SUBTOPICS_META, computeBackoffDelayMs, isRetryableHttpStatus };

const CLIENT_STORAGE_KEY = 'arthniti_economic_news_cache_v1';

let memoryCache: EconomicNewsResponse | null = null;

function saveClientCache(payload: EconomicNewsResponse): void {
  memoryCache = payload;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(payload));
    }
  } catch {
    // Ignore storage quota errors
  }
}

function loadClientCache(): EconomicNewsResponse | null {
  if (memoryCache) return memoryCache;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(CLIENT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as EconomicNewsResponse;
        if (parsed && Array.isArray(parsed.articles) && parsed.articles.length > 0) {
          memoryCache = parsed;
          return parsed;
        }
      }
    }
  } catch {
    // Ignore corrupted storage
  }
  return null;
}

export interface FetchEconomicNewsResult {
  status: 'success' | 'error';
  data: EconomicNewsResponse | null;
  isStaleClientCache: boolean;
  errorMessage: string | null;
}

let activeClientNewsRequest: Promise<FetchEconomicNewsResult> | null = null;

export async function fetchEconomicNews(options?: {
  forceRefresh?: boolean;
  simulateError?: boolean;
  maxRetries?: number;
}): Promise<FetchEconomicNewsResult> {
  if (
    activeClientNewsRequest &&
    !options?.forceRefresh &&
    !options?.simulateError
  ) {
    return activeClientNewsRequest;
  }

  const maxRetries = options?.simulateError ? 0 : (options?.maxRetries ?? 2);

  const requestTask = (async (): Promise<FetchEconomicNewsResult> => {
    const params = new URLSearchParams();
    if (options?.forceRefresh) {
      params.set('force', '1');
    }
    if (options?.simulateError) {
      params.set('simulateError', '1');
    }

    const queryString = params.toString();
    const url = `/api/economic-news${queryString ? `?${queryString}` : ''}`;

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
              `Server returned HTTP ${res.status} when fetching live economic news.`
          );
          if (
            options?.simulateError ||
            !isRetryableHttpStatus(res.status) ||
            attempt === maxRetries
          ) {
            throw statusErr;
          }
          lastError = statusErr;
          const waitMs = computeBackoffDelayMs(attempt);
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }

        const payload = (await res.json()) as EconomicNewsResponse;
        if (!payload.ok || !Array.isArray(payload.articles)) {
          throw new Error('Malformed response from /api/economic-news endpoint.');
        }

        saveClientCache(payload);
        return {
          status: 'success',
          data: payload,
          isStaleClientCache: payload.cacheStatus === 'STALE_FALLBACK',
          errorMessage: null,
        };
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err instanceof Error ? err : new Error(String(err));
        const isPermanentHttp =
          lastError.message.includes('HTTP 400') ||
          lastError.message.includes('HTTP 404') ||
          lastError.message.includes('HTTP 405');
        if (options?.simulateError || isPermanentHttp || attempt === maxRetries) {
          break;
        }
        const waitMs = computeBackoffDelayMs(attempt);
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }

    try {
      throw (
        lastError ||
        new Error('Unable to fetch live economic news from official and financial feeds.')
      );
    } catch (err: any) {
      // If simulating error explicitly for verification, return the error state directly
      if (options?.simulateError) {
        return {
          status: 'error',
          data: loadClientCache(),
          isStaleClientCache: true,
          errorMessage:
            err?.message ||
            'Unable to fetch live economic news from official and financial feeds.',
        };
      }

      const fallback = loadClientCache();
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
          err?.message ||
          'Failed to retrieve live economic news and current affairs intelligence.',
      };
    } finally {
      activeClientNewsRequest = null;
    }
  })();

  activeClientNewsRequest = requestTask;
  return requestTask;
}
