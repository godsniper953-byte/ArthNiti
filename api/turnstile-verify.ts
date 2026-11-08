/**
 * Server-side Cloudflare Turnstile Verification & Human Session Endpoint (/api/turnstile-verify)
 * Compatible with both Vercel Serverless Functions and Express (server.ts).
 *
 * - GET  /api/turnstile-verify : Validates an existing server-signed clearance token
 *                                (from X-Arthniti-Clearance header or arthniti_human_session cookie)
 * - POST /api/turnstile-verify : Verifies a Cloudflare Turnstile CAPTCHA token via
 *                                Cloudflare Siteverify and issues a signed session token + HttpOnly cookie.
 */

import { applyApiSecurityAndCorsHeaders } from './market-indices.ts';
import {
  enforceEndpointRateLimit,
  extractClearanceTokenFromRequest,
  extractTrustedClientIp,
  getClearanceTtlMs,
  getServerTurnstilePublicSiteKey,
  HUMAN_SESSION_COOKIE_NAME,
  inspectRequestForBotAndAttacks,
  issueClearanceToken,
  logSecurityEvent,
  verifyClearanceTokenDetails,
  verifyTurnstileToken,
} from './security-shield.ts';

function setHumanSessionCookie(
  req: any,
  res: any,
  clearanceToken: string,
  sessionTtlSeconds: number
): void {
  const isHttps =
    process.env.NODE_ENV === 'production' ||
    String(req?.headers?.['x-forwarded-proto'] || '').toLowerCase() === 'https';
  const cookieDirectives = [
    `${HUMAN_SESSION_COOKIE_NAME}=${encodeURIComponent(clearanceToken)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${sessionTtlSeconds}`,
  ];
  if (isHttps) {
    cookieDirectives.push('Secure');
  }
  res.setHeader('Set-Cookie', cookieDirectives.join('; '));
}

export default async function handler(req: any, res: any) {
  applyApiSecurityAndCorsHeaders(req, res, 'GET, POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    logSecurityEvent({
      eventType: 'INVALID_HTTP_METHOD',
      severity: 'WARN',
      req,
      endpoint: '/api/turnstile-verify',
      reason: `Rejected invalid HTTP method ${req.method}`,
      statusCode: 405,
    });
    return res.status(405).json({
      ok: false,
      error: `Method ${req.method} Not Allowed. Use GET or POST.`,
    });
  }

  // Enforce rate limit (15 requests/minute/IP)
  const rl = await enforceEndpointRateLimit(req, res, 'turnstile-verify');
  if (!rl.allowed) {
    return res.status(429).json({
      ok: false,
      error: 'Too many verification attempts. Please wait before trying again.',
      retryAfterSeconds: rl.retryAfterSeconds,
    });
  }

  // Inspect request for malicious injection payloads
  const botCheck = inspectRequestForBotAndAttacks(req, {
    endpoint: '/api/turnstile-verify',
    allowedQueryKeys: [],
  });
  if (botCheck.action === 'BLOCK') {
    return res.status(botCheck.statusCode || 400).json({
      ok: false,
      error: botCheck.reason,
    });
  }

  const ttlMs = getClearanceTtlMs();
  const sessionTtlSeconds = Math.floor(ttlMs / 1000);
  const siteKey = getServerTurnstilePublicSiteKey();

  // GET: Validate existing server-signed clearance token / HttpOnly session cookie
  if (req.method === 'GET') {
    const nowMs = Date.now();
    const clientIp = extractTrustedClientIp(req);
    const candidateToken = extractClearanceTokenFromRequest(req);
    const check = verifyClearanceTokenDetails(candidateToken, clientIp, nowMs);

    if (check.valid && candidateToken && check.expiresAtMs) {
      let activeToken = candidateToken;
      let activeExpiresAtMs = check.expiresAtMs;
      let renewed = false;

      // Renew session automatically if less than 50% of TTL remains
      if (check.expiresAtMs - nowMs < ttlMs * 0.5) {
        const refreshed = issueClearanceToken(clientIp, nowMs);
        activeToken = refreshed.clearanceToken;
        activeExpiresAtMs = refreshed.expiresAtMs;
        renewed = true;
      }

      setHumanSessionCookie(req, res, activeToken, sessionTtlSeconds);

      return res.status(200).json({
        ok: true,
        verified: true,
        renewed,
        clearanceToken: activeToken,
        expiresAtMs: activeExpiresAtMs,
        sessionTtlSeconds,
        siteKey,
      });
    }

    return res.status(200).json({
      ok: true,
      verified: false,
      sessionTtlSeconds,
      siteKey,
    });
  }

  // POST: Verify Cloudflare Turnstile CAPTCHA token via Cloudflare Siteverify
  const body = req?.body && typeof req.body === 'object' ? req.body : {};
  const token =
    body.token ||
    body['cf-turnstile-response'] ||
    req?.headers?.['x-turnstile-token'] ||
    '';

  const result = await verifyTurnstileToken({
    token,
    req,
  });

  if (!result.ok) {
    return res.status(result.statusCode).json({
      ok: false,
      verified: false,
      errorCode: result.errorCode,
      error: result.errorMessage,
      siteKey,
    });
  }

  setHumanSessionCookie(req, res, result.clearanceToken || '', sessionTtlSeconds);

  return res.status(200).json({
    ok: true,
    verified: true,
    clearanceToken: result.clearanceToken,
    expiresAtMs: result.expiresAtMs,
    sessionTtlSeconds,
    siteKey,
  });
}
