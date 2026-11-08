/**
 * Client-side Security & Cloudflare Turnstile Human Verification Manager
 *
 * Enforces real server-side Cloudflare Turnstile Siteverify validation:
 *   - First-visit human verification gate ("Verify You're Human") validates the
 *     Cloudflare Turnstile token via POST /api/turnstile-verify before granting
 *     access to the main ArthNiti dashboard.
 *   - Subsequent page navigations, browser refreshes, and new browser tabs within
 *     the configured session window validate the HMAC-signed token & HttpOnly
 *     session cookie on the server via GET /api/turnstile-verify.
 *   - Never trusts a client-side boolean flag as proof of verification; every session
 *     check is cryptographically verified by the backend.
 *   - Prevents duplicate frontend submissions of the same Turnstile token.
 */

const CLEARANCE_STORAGE_KEY = 'arthniti_security_clearance_v1';

// Official Cloudflare Turnstile interactive widget sitekey fallback when custom env key is not set
const CLOUDFLARE_DEFAULT_WIDGET_SITEKEY = '1x00000000000000000000AA';

interface StoredClearance {
  clearanceToken: string;
  expiresAtMs: number;
}

export interface TurnstileChallengeState {
  isOpen: boolean;
  reason: string;
  onVerifiedCallback?: () => void;
}

export interface TurnstileVerifyServerResponse {
  ok: boolean;
  error?: string;
  errorCode?: string;
  serviceUnavailable?: boolean;
  expiresAtMs?: number;
  siteKey?: string;
}

type ChallengeListener = (state: TurnstileChallengeState) => void;

const listeners = new Set<ChallengeListener>();
let currentState: TurnstileChallengeState = {
  isOpen: false,
  reason: '',
};

// Synchronized sitekey from GET /api/turnstile-verify when set in server runtime env
let runtimeServerSiteKey = '';

// Client-side deduplication so the same Turnstile token is never submitted twice
const inFlightTokenVerifications = new Map<
  string,
  Promise<TurnstileVerifyServerResponse>
>();
const consumedClientTokens = new Set<string>();

export function getConfiguredTurnstileSiteKey(): string {
  const env = (import.meta as any).env || {};
  const buildConfigured = String(
    env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || env.VITE_TURNSTILE_SITE_KEY || ''
  ).trim();
  if (buildConfigured) {
    return buildConfigured;
  }
  if (runtimeServerSiteKey) {
    return runtimeServerSiteKey;
  }
  return CLOUDFLARE_DEFAULT_WIDGET_SITEKEY;
}

function readClearanceFromStorage(storage: Storage | undefined): StoredClearance | null {
  try {
    if (!storage) return null;
    const raw = storage.getItem(CLEARANCE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredClearance;
    if (
      parsed &&
      typeof parsed.clearanceToken === 'string' &&
      parsed.clearanceToken.split('.').length === 3 &&
      typeof parsed.expiresAtMs === 'number' &&
      Date.now() < parsed.expiresAtMs
    ) {
      return parsed;
    }
    storage.removeItem(CLEARANCE_STORAGE_KEY);
    return null;
  } catch {
    return null;
  }
}

export function getStoredClearanceToken(): string | null {
  if (typeof window === 'undefined') return null;
  const fromSession = readClearanceFromStorage(window.sessionStorage);
  if (fromSession) return fromSession.clearanceToken;

  // Read signed token from localStorage for new tabs (always validated on the server via GET /api/turnstile-verify)
  const fromLocal = readClearanceFromStorage(window.localStorage);
  if (fromLocal) {
    try {
      window.sessionStorage?.setItem(CLEARANCE_STORAGE_KEY, JSON.stringify(fromLocal));
    } catch {
      // Ignore storage errors
    }
    return fromLocal.clearanceToken;
  }
  return null;
}

export function getStoredClearanceExpiryMs(): number | null {
  if (typeof window === 'undefined') return null;
  const fromSession = readClearanceFromStorage(window.sessionStorage);
  if (fromSession) return fromSession.expiresAtMs;
  const fromLocal = readClearanceFromStorage(window.localStorage);
  return fromLocal ? fromLocal.expiresAtMs : null;
}

export function saveClearanceToken(clearanceToken: string, expiresAtMs: number): void {
  if (typeof window === 'undefined') return;
  const record: StoredClearance = { clearanceToken, expiresAtMs };
  const serialized = JSON.stringify(record);
  try {
    window.sessionStorage?.setItem(CLEARANCE_STORAGE_KEY, serialized);
  } catch {
    // Ignore storage errors
  }
  try {
    window.localStorage?.setItem(CLEARANCE_STORAGE_KEY, serialized);
  } catch {
    // Ignore storage errors
  }
}

export function clearStoredClearanceToken(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage?.removeItem(CLEARANCE_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
  try {
    window.localStorage?.removeItem(CLEARANCE_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function getSecurityRequestHeaders(
  extraHeaders?: Record<string, string>
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...extraHeaders,
  };
  const clearance = getStoredClearanceToken();
  if (clearance) {
    headers['X-Arthniti-Clearance'] = clearance;
  }
  return headers;
}

export function requestTurnstileChallenge(
  reason = 'Automated or high-frequency traffic pattern detected. Please verify you are human to continue.',
  onVerifiedCallback?: () => void
): void {
  currentState = {
    isOpen: true,
    reason,
    onVerifiedCallback,
  };
  for (const listener of listeners) {
    listener(currentState);
  }
}

export function closeTurnstileChallenge(): void {
  currentState = {
    isOpen: false,
    reason: '',
    onVerifiedCallback: undefined,
  };
  for (const listener of listeners) {
    listener(currentState);
  }
}

export function subscribeTurnstileChallenge(
  listener: ChallengeListener
): () => void {
  listeners.add(listener);
  listener(currentState);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Checks with the backend (/api/turnstile-verify GET) whether the current visitor
 * holds a valid, unexpired server-signed human verification session (via HttpOnly cookie or signed header).
 */
export async function validateHumanSessionWithServer(): Promise<{
  verified: boolean;
  expiresAtMs?: number;
  sessionTtlSeconds?: number;
  siteKey?: string;
  serviceUnavailable?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch('/api/turnstile-verify', {
      method: 'GET',
      headers: getSecurityRequestHeaders(),
      credentials: 'same-origin',
      cache: 'no-store',
    });

    if (res.status >= 500) {
      return {
        verified: false,
        serviceUnavailable: true,
        error:
          'Human verification service is temporarily unavailable. Please click Retry in a moment.',
      };
    }

    const data = await res.json().catch(() => ({}));
    if (typeof data?.siteKey === 'string' && data.siteKey.trim()) {
      runtimeServerSiteKey = data.siteKey.trim();
    }

    if (res.ok && data?.ok && data?.verified === true && data?.clearanceToken) {
      const expiresAtMs = Number(data.expiresAtMs) || Date.now() + 60 * 60 * 1000;
      saveClearanceToken(data.clearanceToken, expiresAtMs);
      return {
        verified: true,
        expiresAtMs,
        sessionTtlSeconds: Number(data.sessionTtlSeconds) || 3600,
        siteKey: runtimeServerSiteKey || getConfiguredTurnstileSiteKey(),
        serviceUnavailable: false,
      };
    }

    clearStoredClearanceToken();
    return {
      verified: false,
      sessionTtlSeconds: Number(data?.sessionTtlSeconds) || 3600,
      siteKey: runtimeServerSiteKey || getConfiguredTurnstileSiteKey(),
      serviceUnavailable: false,
    };
  } catch {
    return {
      verified: false,
      serviceUnavailable: true,
      error:
        'Unable to reach the ArthNiti verification server. Please check your network connection and click Retry.',
    };
  }
}

/**
 * Validates a Cloudflare Turnstile token on the backend via Cloudflare Siteverify.
 * Deduplicates concurrent submissions of the same token and only grants clearance
 * when the backend confirms Siteverify succeeded.
 */
export async function verifyTurnstileTokenWithServer(
  rawToken: string
): Promise<TurnstileVerifyServerResponse> {
  const token = String(rawToken || '').trim();
  if (!token) {
    return {
      ok: false,
      errorCode: 'MISSING_TOKEN',
      error: 'Verification token is missing. Please complete the challenge.',
    };
  }

  // If this exact token is already being verified right now, share the in-flight request
  const existingPromise = inFlightTokenVerifications.get(token);
  if (existingPromise) {
    return existingPromise;
  }

  // Prevent re-submitting a token that was already verified or consumed by this browser session
  if (consumedClientTokens.has(token)) {
    return {
      ok: false,
      errorCode: 'TOKEN_ALREADY_USED',
      error:
        'This verification token was already submitted. Generating a fresh challenge — please verify again.',
    };
  }

  const requestPromise = (async (): Promise<TurnstileVerifyServerResponse> => {
    try {
      const res = await fetch('/api/turnstile-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({ token }),
      });

      // Mark token as consumed once submitted to the backend
      consumedClientTokens.add(token);

      const data = await res.json().catch(() => ({}));
      if (typeof data?.siteKey === 'string' && data.siteKey.trim()) {
        runtimeServerSiteKey = data.siteKey.trim();
      }

      const errorCode: string | undefined = data?.errorCode;
      const isServiceUnavailable =
        res.status === 502 ||
        res.status === 503 ||
        errorCode === 'UPSTREAM_ERROR' ||
        errorCode === 'SECRET_NOT_CONFIGURED';

      if (!res.ok || !data?.ok || !data?.clearanceToken) {
        let friendlyError = data?.error;
        if (!friendlyError) {
          if (errorCode === 'TOKEN_EXPIRED') {
            friendlyError =
              'Your verification token expired. A fresh challenge has been generated — please check the box again.';
          } else if (errorCode === 'TOKEN_ALREADY_USED') {
            friendlyError =
              'This token was already used. A fresh challenge has been generated — please verify again.';
          } else if (errorCode === 'SECRET_NOT_CONFIGURED') {
            friendlyError =
              'Server configuration error: Cloudflare Turnstile secret key (TURNSTILE_SECRET_KEY) is not configured.';
          } else if (isServiceUnavailable) {
            friendlyError =
              'Cloudflare Turnstile verification service is temporarily unavailable. Please click Retry.';
          } else {
            friendlyError =
              'Verification failed. Please complete the fresh challenge and try again.';
          }
        }

        return {
          ok: false,
          errorCode,
          serviceUnavailable: isServiceUnavailable,
          error: friendlyError,
          siteKey: runtimeServerSiteKey || undefined,
        };
      }

      const expiresAtMs = Number(data.expiresAtMs) || Date.now() + 60 * 60 * 1000;
      saveClearanceToken(data.clearanceToken, expiresAtMs);

      const callback = currentState.onVerifiedCallback;
      closeTurnstileChallenge();
      if (callback) {
        callback();
      }

      return {
        ok: true,
        expiresAtMs,
        siteKey: runtimeServerSiteKey || undefined,
      };
    } catch {
      return {
        ok: false,
        errorCode: 'UPSTREAM_ERROR',
        serviceUnavailable: true,
        error:
          'Network failure while contacting the verification server. Please check your connection and click Retry.',
      };
    }
  })();

  inFlightTokenVerifications.set(token, requestPromise);
  try {
    return await requestPromise;
  } finally {
    inFlightTokenVerifications.delete(token);
  }
}
