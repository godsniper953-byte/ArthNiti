/**
 * Client-side Security & Cloudflare Turnstile Human Verification Manager
 *
 * Enforces real server-side Cloudflare Turnstile Siteverify validation:
 *   - First-visit human verification gate ("Verify You're Human") validates the
 *     Cloudflare Turnstile token via POST /api/turnstile-verify before granting
 *     access to the main ArthNiti dashboard.
 *   - Subsequent page navigations and reloads within the configured session window
 *     validate the HMAC-signed token / HttpOnly session cookie with GET /api/turnstile-verify.
 *   - Fails closed: if verification services are unavailable, displays a clear error
 *     message and retry option rather than silently granting access.
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

type ChallengeListener = (state: TurnstileChallengeState) => void;

const listeners = new Set<ChallengeListener>();
let currentState: TurnstileChallengeState = {
  isOpen: false,
  reason: '',
};

export function getConfiguredTurnstileSiteKey(): string {
  const env = (import.meta as any).env || {};
  const configured = String(
    env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || env.VITE_TURNSTILE_SITE_KEY || ''
  ).trim();
  return configured || CLOUDFLARE_DEFAULT_WIDGET_SITEKEY;
}

export function getStoredClearanceToken(): string | null {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    const raw = window.sessionStorage.getItem(CLEARANCE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredClearance;
    if (
      parsed &&
      typeof parsed.clearanceToken === 'string' &&
      typeof parsed.expiresAtMs === 'number' &&
      Date.now() < parsed.expiresAtMs
    ) {
      return parsed.clearanceToken;
    }
    window.sessionStorage.removeItem(CLEARANCE_STORAGE_KEY);
    return null;
  } catch {
    return null;
  }
}

export function getStoredClearanceExpiryMs(): number | null {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    const raw = window.sessionStorage.getItem(CLEARANCE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredClearance;
    if (
      parsed &&
      typeof parsed.clearanceToken === 'string' &&
      typeof parsed.expiresAtMs === 'number' &&
      Date.now() < parsed.expiresAtMs
    ) {
      return parsed.expiresAtMs;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveClearanceToken(clearanceToken: string, expiresAtMs: number): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const record: StoredClearance = { clearanceToken, expiresAtMs };
      window.sessionStorage.setItem(CLEARANCE_STORAGE_KEY, JSON.stringify(record));
    }
  } catch {
    // Ignore storage errors
  }
}

export function clearStoredClearanceToken(): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(CLEARANCE_STORAGE_KEY);
    }
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
 * holds a valid, unexpired server-signed human verification session.
 */
export async function validateHumanSessionWithServer(): Promise<{
  verified: boolean;
  expiresAtMs?: number;
  serviceUnavailable?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch('/api/turnstile-verify', {
      method: 'GET',
      headers: getSecurityRequestHeaders(),
      credentials: 'same-origin',
    });

    if (res.status >= 500) {
      return {
        verified: false,
        serviceUnavailable: true,
        error:
          'Human verification service is temporarily unavailable. Please retry in a moment.',
      };
    }

    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.ok && data?.verified === true && data?.clearanceToken) {
      const expiresAtMs = Number(data.expiresAtMs) || Date.now() + 15 * 60 * 1000;
      saveClearanceToken(data.clearanceToken, expiresAtMs);
      return {
        verified: true,
        expiresAtMs,
        serviceUnavailable: false,
      };
    }

    clearStoredClearanceToken();
    return {
      verified: false,
      serviceUnavailable: false,
    };
  } catch {
    return {
      verified: false,
      serviceUnavailable: true,
      error:
        'Unable to reach the ArthNiti verification server. Please check your connection and retry.',
    };
  }
}

/**
 * Validates a Cloudflare Turnstile token on the backend via Cloudflare Siteverify.
 * Only grants clearance when the backend confirms Siteverify succeeded.
 */
export async function verifyTurnstileTokenWithServer(token: string): Promise<{
  ok: boolean;
  error?: string;
  errorCode?: string;
  serviceUnavailable?: boolean;
  expiresAtMs?: number;
}> {
  try {
    const res = await fetch('/api/turnstile-verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ token }),
    });

    const data = await res.json().catch(() => ({}));
    const isServiceUnavailable =
      res.status === 502 ||
      res.status === 503 ||
      data?.errorCode === 'UPSTREAM_ERROR' ||
      data?.errorCode === 'SECRET_NOT_CONFIGURED';

    if (!res.ok || !data?.ok || !data?.clearanceToken) {
      return {
        ok: false,
        errorCode: data?.errorCode,
        serviceUnavailable: isServiceUnavailable,
        error: isServiceUnavailable
          ? data?.error ||
            'Cloudflare Turnstile verification service is temporarily unavailable. Please retry shortly.'
          : data?.error ||
            'Human verification failed. Please complete the "I\'m not a robot" challenge again.',
      };
    }

    const expiresAtMs = Number(data.expiresAtMs) || Date.now() + 15 * 60 * 1000;
    saveClearanceToken(data.clearanceToken, expiresAtMs);

    const callback = currentState.onVerifiedCallback;
    closeTurnstileChallenge();
    if (callback) {
      callback();
    }

    return { ok: true, expiresAtMs };
  } catch {
    return {
      ok: false,
      serviceUnavailable: true,
      error:
        'Verification service is temporarily unreachable. Please check your network connection and try again.',
    };
  }
}
