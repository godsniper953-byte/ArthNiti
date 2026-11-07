/**
 * ArthNiti — Production Security, Anti-Bot Detection, Distributed Rate Limiting,
 * Cloudflare Turnstile Verification & Privacy-Preserving Security Monitoring Engine
 *
 * Compatible with:
 *   1. Vercel Serverless Functions (/api/*)
 *   2. Express + Vite development/production server (server.ts)
 */

import crypto from 'crypto';

export type SecurityEventType =
  | 'RATE_LIMIT_EXCEEDED'
  | 'CAPTCHA_VERIFICATION_SUCCESS'
  | 'CAPTCHA_VERIFICATION_FAILED'
  | 'CAPTCHA_REPLAY_BLOCKED'
  | 'BOT_SIGNATURE_BLOCKED'
  | 'PROGRESSIVE_CHALLENGE_ISSUED'
  | 'INVALID_HTTP_METHOD'
  | 'MALFORMED_REQUEST_BLOCKED'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT';

export type SecuritySeverity = 'INFO' | 'WARN' | 'HIGH' | 'CRITICAL';

export interface SecurityLogEvent {
  id: string;
  timestampIso: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  endpoint: string;
  method: string;
  maskedClientIp: string;
  userAgentSummary: string;
  reason: string;
  statusCode: number;
}

export interface EndpointRateLimitPolicy {
  endpointKey: string;
  maxRequestsPerMinute: number;
  windowSeconds: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetEpochSeconds: number;
  retryAfterSeconds: number;
  currentCount: number;
  storeMode: 'distributed-kv' | 'memory-sliding-window';
}

export interface BotInspectionResult {
  action: 'ALLOW' | 'CHALLENGE' | 'BLOCK';
  statusCode?: number;
  reason: string;
  suspicionScore: number;
  isVerifiedCrawler: boolean;
  requiresTurnstile: boolean;
}

export interface TurnstileVerificationResult {
  ok: boolean;
  statusCode: number;
  errorCode?:
    | 'MISSING_TOKEN'
    | 'INVALID_TOKEN_FORMAT'
    | 'TOKEN_ALREADY_USED'
    | 'TOKEN_EXPIRED'
    | 'VERIFICATION_FAILED'
    | 'SECRET_NOT_CONFIGURED'
    | 'UPSTREAM_ERROR';
  errorMessage?: string;
  clearanceToken?: string;
  expiresAtMs?: number;
}

// Content Security Policy permitting self, Google Fonts, and official Cloudflare Turnstile widget
export const ARTHNITI_SECURE_CSP_HEADER =
  "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://arthniti-six.vercel.app https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com; worker-src 'self' blob:; frame-ancestors 'self' https://*.google.com https://*.aistudio.google.com https://*.run.app https://*.vercel.app; object-src 'none'; base-uri 'self'; form-action 'self'";

// Bounded ring buffer of sanitized security events (max 250 entries in-memory)
const MAX_SECURITY_LOG_ENTRIES = 250;
const securityEventLog: SecurityLogEvent[] = [];
const securityEventCounters: Record<SecurityEventType, number> = {
  RATE_LIMIT_EXCEEDED: 0,
  CAPTCHA_VERIFICATION_SUCCESS: 0,
  CAPTCHA_VERIFICATION_FAILED: 0,
  CAPTCHA_REPLAY_BLOCKED: 0,
  BOT_SIGNATURE_BLOCKED: 0,
  PROGRESSIVE_CHALLENGE_ISSUED: 0,
  INVALID_HTTP_METHOD: 0,
  MALFORMED_REQUEST_BLOCKED: 0,
  UNAUTHORIZED_ACCESS_ATTEMPT: 0,
};

// Sliding-window rate-limit store (fallback when Upstash/Vercel KV env vars are not configured)
const slidingWindowStore = new Map<string, number[]>();

// Rapid burst tracker (tracks timestamps in last 5 seconds per IP for anti-bot progressive challenge)
const rapidBurstStore = new Map<string, number[]>();

// Consumed Turnstile token replay cache (tokenSha256 -> expiresAtMs)
const consumedTurnstileTokens = new Map<string, number>();

// Failed CAPTCHA attempts per IP (for security monitoring & progressive lockout)
const failedCaptchaStore = new Map<string, number[]>();

const DEFAULT_CLEARANCE_TTL_MS = 15 * 60 * 1000; // Default 15 minutes for verified human session
const CONSUMED_TOKEN_TTL_MS = 15 * 60 * 1000;
export const HUMAN_SESSION_COOKIE_NAME = 'arthniti_human_session';

export function getClearanceTtlMs(): number {
  const rawSeconds = Number(process.env.HUMAN_VERIFICATION_SESSION_TTL_SECONDS);
  if (Number.isFinite(rawSeconds) && rawSeconds >= 60 && rawSeconds <= 86400) {
    return Math.floor(rawSeconds * 1000);
  }
  return DEFAULT_CLEARANCE_TTL_MS;
}

function getHmacSecret(): string {
  return (
    process.env.SECURITY_CLEARANCE_SECRET ||
    process.env.TURNSTILE_SECRET_KEY ||
    process.env.SECURITY_MONITOR_TOKEN ||
    process.env.ECONOMIST_BITES_INGEST_SECRET ||
    'arthniti-default-ephemeral-hmac-key-2026'
  );
}

/**
 * Extracts the signed clearance token from either X-Arthniti-Clearance header or HttpOnly session cookie.
 */
export function extractClearanceTokenFromRequest(req: any): string | null {
  const headers = req?.headers || {};
  const headerToken = String(headers['x-arthniti-clearance'] || '').trim();
  if (headerToken) return headerToken;

  const rawCookie = String(headers.cookie || '').trim();
  if (!rawCookie) return null;

  for (const part of rawCookie.split(';')) {
    const [k, ...vParts] = part.trim().split('=');
    if (k === HUMAN_SESSION_COOKIE_NAME) {
      const rawVal = vParts.join('=').trim();
      if (rawVal) {
        try {
          return decodeURIComponent(rawVal);
        } catch {
          return rawVal;
        }
      }
    }
  }
  return null;
}

/**
 * Safely extracts the client IP from trusted proxy headers (Vercel / Cloudflare / standard proxies).
 * Never trusts arbitrary query parameters or body fields for IP identification.
 */
export function extractTrustedClientIp(req: any): string {
  const headers = req?.headers || {};

  // Priority 1: Vercel's edge-populated header or Cloudflare connecting IP
  const vercelIp = headers['x-vercel-forwarded-for'];
  const cfIp = headers['cf-connecting-ip'];
  const realIp = headers['x-real-ip'];
  const forwardedFor = headers['x-forwarded-for'];

  const rawCandidate =
    (typeof vercelIp === 'string' && vercelIp.split(',')[0]) ||
    (typeof cfIp === 'string' && cfIp.split(',')[0]) ||
    (typeof realIp === 'string' && realIp.split(',')[0]) ||
    (typeof forwardedFor === 'string' && forwardedFor.split(',')[0]) ||
    req?.socket?.remoteAddress ||
    req?.ip ||
    '127.0.0.1';

  const cleaned = String(rawCandidate).trim().replace(/^::ffff:/i, '');
  // Validate basic IPv4/IPv6 characters
  if (/^[0-9a-fA-F:.]{3,45}$/.test(cleaned)) {
    return cleaned;
  }
  return '127.0.0.1';
}

/**
 * Anonymizes an IP address for privacy-compliant logging (GDPR / DPDP Act safe).
 * Never logs the full client IP address.
 */
export function maskClientIpForLogging(ip: string): string {
  const clean = (ip || '127.0.0.1').trim();
  const hashPrefix = crypto
    .createHash('sha256')
    .update(clean + ':arthniti-salt')
    .digest('hex')
    .slice(0, 8);

  if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx#${hashPrefix}`;
    }
  }
  if (clean.includes(':')) {
    const parts = clean.split(':').filter(Boolean);
    return `${parts.slice(0, 2).join(':')}:xxxx#${hashPrefix}`;
  }
  return `masked#${hashPrefix}`;
}

/**
 * Records a sanitized security event without ever logging secrets, tokens, or full IPs.
 */
export function logSecurityEvent(params: {
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  req: any;
  endpoint: string;
  reason: string;
  statusCode: number;
}): SecurityLogEvent {
  const ip = extractTrustedClientIp(params.req);
  const maskedClientIp = maskClientIpForLogging(ip);
  const rawUa = String(params.req?.headers?.['user-agent'] || 'unknown')
    .replace(/[\r\n\t]+/g, ' ')
    .slice(0, 110);

  // Redact any accidental Bearer or token strings in reason
  const safeReason = String(params.reason || '')
    .replace(/Bearer\s+[A-Za-z0-9._\-+/=]+/gi, 'Bearer [REDACTED]')
    .replace(/token=[A-Za-z0-9._\-+/=]+/gi, 'token=[REDACTED]')
    .slice(0, 240);

  const event: SecurityLogEvent = {
    id: `sec_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    timestampIso: new Date().toISOString(),
    eventType: params.eventType,
    severity: params.severity,
    endpoint: params.endpoint,
    method: String(params.req?.method || 'GET').toUpperCase(),
    maskedClientIp,
    userAgentSummary: rawUa,
    reason: safeReason,
    statusCode: params.statusCode,
  };

  securityEventCounters[params.eventType] =
    (securityEventCounters[params.eventType] || 0) + 1;
  securityEventLog.unshift(event);
  if (securityEventLog.length > MAX_SECURITY_LOG_ENTRIES) {
    securityEventLog.pop();
  }

  // Emit structured JSON log line for Vercel Runtime Logs on HIGH/CRITICAL events
  if (
    process.env.NODE_ENV !== 'test' &&
    (params.severity === 'HIGH' || params.severity === 'CRITICAL')
  ) {
    console.warn(
      JSON.stringify({
        channel: 'ARTHNITI_SECURITY_AUDIT',
        ...event,
      })
    );
  }

  return event;
}

/**
 * Issues a signed, IP-bound, time-limited clearance token after successful Turnstile verification.
 */
export function issueClearanceToken(clientIp: string, nowMs = Date.now()): {
  clearanceToken: string;
  expiresAtMs: number;
} {
  const expiresAtMs = nowMs + getClearanceTtlMs();
  const ipHash = crypto
    .createHash('sha256')
    .update(clientIp)
    .digest('hex')
    .slice(0, 16);
  const payload = `${expiresAtMs}.${ipHash}`;
  const signature = crypto
    .createHmac('sha256', getHmacSecret())
    .update(payload)
    .digest('base64url');
  return {
    clearanceToken: `${payload}.${signature}`,
    expiresAtMs,
  };
}

/**
 * Verifies an HMAC-signed clearance token and returns both boolean validity and expiration timestamp.
 */
export function verifyClearanceTokenDetails(
  token: string | undefined | null,
  clientIp: string,
  nowMs = Date.now()
): { valid: boolean; expiresAtMs: number | null } {
  if (!token || typeof token !== 'string') {
    return { valid: false, expiresAtMs: null };
  }
  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    return { valid: false, expiresAtMs: null };
  }

  const [expiresStr, tokenIpHash, providedSig] = parts;
  const expiresAtMs = Number(expiresStr);
  if (!Number.isFinite(expiresAtMs) || nowMs > expiresAtMs) {
    return { valid: false, expiresAtMs: null };
  }

  const expectedIpHash = crypto
    .createHash('sha256')
    .update(clientIp)
    .digest('hex')
    .slice(0, 16);
  if (tokenIpHash !== expectedIpHash) {
    return { valid: false, expiresAtMs: null };
  }

  const payload = `${expiresStr}.${tokenIpHash}`;
  const expectedSig = crypto
    .createHmac('sha256', getHmacSecret())
    .update(payload)
    .digest('base64url');

  try {
    const a = Buffer.from(providedSig);
    const b = Buffer.from(expectedSig);
    const isMatch = a.length === b.length && crypto.timingSafeEqual(a, b);
    return {
      valid: isMatch,
      expiresAtMs: isMatch ? expiresAtMs : null,
    };
  } catch {
    return { valid: false, expiresAtMs: null };
  }
}

/**
 * Verifies an HMAC-signed clearance token from the X-Arthniti-Clearance header or session cookie.
 */
export function verifyClearanceToken(
  token: string | undefined | null,
  clientIp: string,
  nowMs = Date.now()
): boolean {
  return verifyClearanceTokenDetails(token, clientIp, nowMs).valid;
}

/**
 * Checks if distributed Upstash Redis / Vercel KV REST credentials are configured.
 */
function getDistributedKvConfig(): { url: string; token: string } | null {
  const url = (
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    ''
  ).trim();
  const token = (
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    ''
  ).trim();
  if (url && token && url.startsWith('https://')) {
    return { url: url.replace(/\/+$/, ''), token };
  }
  return null;
}

/**
 * Configurable Rate Limit policies per endpoint (can be overridden via environment variables).
 */
export function getEndpointRateLimitPolicy(
  endpointKey:
    | 'market-indices'
    | 'economic-news'
    | 'economist-bites'
    | 'economist-bites-post'
    | 'health'
    | 'turnstile-verify'
    | 'security-monitor'
): EndpointRateLimitPolicy {
  switch (endpointKey) {
    case 'market-indices':
      return {
        endpointKey,
        maxRequestsPerMinute: Math.max(
          5,
          parseInt(process.env.RATE_LIMIT_MARKET_INDICES_PER_MIN || '60', 10) || 60
        ),
        windowSeconds: 60,
      };
    case 'economic-news':
      return {
        endpointKey,
        maxRequestsPerMinute: Math.max(
          5,
          parseInt(process.env.RATE_LIMIT_ECONOMIC_NEWS_PER_MIN || '30', 10) || 30
        ),
        windowSeconds: 60,
      };
    case 'economist-bites':
      return {
        endpointKey,
        maxRequestsPerMinute: Math.max(
          5,
          parseInt(process.env.RATE_LIMIT_ECONOMIST_BITES_PER_MIN || '30', 10) || 30
        ),
        windowSeconds: 60,
      };
    case 'economist-bites-post':
      return {
        endpointKey,
        maxRequestsPerMinute: Math.max(
          2,
          parseInt(process.env.RATE_LIMIT_SENSITIVE_AI_PER_MIN || '10', 10) || 10
        ),
        windowSeconds: 60,
      };
    case 'health':
      return {
        endpointKey,
        maxRequestsPerMinute: Math.max(
          3,
          parseInt(process.env.RATE_LIMIT_HEALTH_PER_MIN || '10', 10) || 10
        ),
        windowSeconds: 60,
      };
    case 'turnstile-verify':
      return {
        endpointKey,
        maxRequestsPerMinute: 15,
        windowSeconds: 60,
      };
    case 'security-monitor':
      return {
        endpointKey,
        maxRequestsPerMinute: 10,
        windowSeconds: 60,
      };
  }
}

/**
 * Enforces per-IP rate limiting using Upstash Redis / Vercel KV REST API when configured,
 * falling back to a sliding-window counter store. Sets standard X-RateLimit-* and Retry-After headers.
 */
export async function enforceEndpointRateLimit(
  req: any,
  res: any,
  endpointKey:
    | 'market-indices'
    | 'economic-news'
    | 'economist-bites'
    | 'economist-bites-post'
    | 'health'
    | 'turnstile-verify'
    | 'security-monitor',
  nowMs = Date.now()
): Promise<RateLimitDecision> {
  const policy = getEndpointRateLimitPolicy(endpointKey);
  const clientIp = extractTrustedClientIp(req);
  const ipHash = crypto
    .createHash('sha256')
    .update(clientIp)
    .digest('hex')
    .slice(0, 16);
  const bucketKey = `arthniti:rl:${policy.endpointKey}:${ipHash}`;
  const windowMs = policy.windowSeconds * 1000;

  // Check if distributed KV store is configured
  const kv = getDistributedKvConfig();
  if (kv) {
    try {
      const minuteBucket = Math.floor(nowMs / windowMs);
      const redisKey = `${bucketKey}:${minuteBucket}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const pipelineRes = await fetch(`${kv.url}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kv.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', redisKey],
          ['EXPIRE', redisKey, policy.windowSeconds + 5],
        ]),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (pipelineRes.ok) {
        const data = (await pipelineRes.json()) as Array<{ result?: number }>;
        const currentCount = Number(data?.[0]?.result || 1);
        const resetEpochSeconds = (minuteBucket + 1) * policy.windowSeconds;
        const retryAfterSeconds = Math.max(
          1,
          resetEpochSeconds - Math.floor(nowMs / 1000)
        );
        const remaining = Math.max(0, policy.maxRequestsPerMinute - currentCount);
        const allowed = currentCount <= policy.maxRequestsPerMinute;

        applyRateLimitHeaders(res, {
          allowed,
          limit: policy.maxRequestsPerMinute,
          remaining,
          resetEpochSeconds,
          retryAfterSeconds,
          currentCount,
          storeMode: 'distributed-kv',
        });

        if (!allowed) {
          logSecurityEvent({
            eventType: 'RATE_LIMIT_EXCEEDED',
            severity: 'WARN',
            req,
            endpoint: `/api/${endpointKey}`,
            reason: `Exceeded distributed rate limit (${currentCount}/${policy.maxRequestsPerMinute} per ${policy.windowSeconds}s)`,
            statusCode: 429,
          });
        }

        return {
          allowed,
          limit: policy.maxRequestsPerMinute,
          remaining,
          resetEpochSeconds,
          retryAfterSeconds,
          currentCount,
          storeMode: 'distributed-kv',
        };
      }
    } catch {
      // Gracefully fall back to sliding-window store if KV is unreachable
    }
  }

  // Sliding-window rate-limit enforcement
  const cutoffMs = nowMs - windowMs;
  const existingTimestamps = (slidingWindowStore.get(bucketKey) || []).filter(
    (ts) => ts > cutoffMs
  );
  existingTimestamps.push(nowMs);
  slidingWindowStore.set(bucketKey, existingTimestamps);

  const currentCount = existingTimestamps.length;
  const oldestInWindow = existingTimestamps[0] || nowMs;
  const resetMs = oldestInWindow + windowMs;
  const resetEpochSeconds = Math.ceil(resetMs / 1000);
  const retryAfterSeconds = Math.max(1, Math.ceil((resetMs - nowMs) / 1000));
  const remaining = Math.max(0, policy.maxRequestsPerMinute - currentCount);
  const allowed = currentCount <= policy.maxRequestsPerMinute;

  const decision: RateLimitDecision = {
    allowed,
    limit: policy.maxRequestsPerMinute,
    remaining,
    resetEpochSeconds,
    retryAfterSeconds,
    currentCount,
    storeMode: 'memory-sliding-window',
  };

  applyRateLimitHeaders(res, decision);

  if (!allowed) {
    logSecurityEvent({
      eventType: 'RATE_LIMIT_EXCEEDED',
      severity: 'WARN',
      req,
      endpoint: `/api/${endpointKey}`,
      reason: `Exceeded rate limit (${currentCount}/${policy.maxRequestsPerMinute} per ${policy.windowSeconds}s)`,
      statusCode: 429,
    });
  }

  return decision;
}

function applyRateLimitHeaders(res: any, decision: RateLimitDecision): void {
  if (!res || typeof res.setHeader !== 'function') return;
  res.setHeader('X-RateLimit-Limit', String(decision.limit));
  res.setHeader('X-RateLimit-Remaining', String(decision.remaining));
  res.setHeader('X-RateLimit-Reset', String(decision.resetEpochSeconds));
  if (!decision.allowed) {
    res.setHeader('Retry-After', String(decision.retryAfterSeconds));
  }
}

// Known malicious scanner User-Agent substrings (immediate block)
const MALICIOUS_SCANNER_UA_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /acunetix/i,
  /nessus/i,
  /nuclei/i,
  /masscan/i,
  /zgrab/i,
  /dirbuster/i,
  /gobuster/i,
  /wpscan/i,
  /havij/i,
];

// Known automated scraping / headless client User-Agent substrings (progressive challenge)
const SUSPICIOUS_BOT_UA_PATTERNS = [
  /python-requests/i,
  /python-urllib/i,
  /aiohttp/i,
  /scrapy/i,
  /curl\//i,
  /wget\//i,
  /go-http-client/i,
  /java\//i,
  /libwww-perl/i,
  /headlesschrome/i,
  /phantomjs/i,
  /puppeteer/i,
  /playwright/i,
  /selenium/i,
  /mechanize/i,
];

// Legitimate search engine & social preview crawlers (allowed for standard GET reads)
const LEGITIMATE_CRAWLER_UA_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /duckduckbot/i,
  /applebot/i,
  /slurp/i,
  /linkedinbot/i,
  /twitterbot/i,
  /facebookexternalhit/i,
  /whatsapp/i,
  /discordbot/i,
];

// Malicious query/body payload injection signatures
const MALICIOUS_INPUT_PATTERNS = [
  /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/)/i, // Path traversal
  /<script\b[^>]*>/i, // Script XSS
  /javascript:/i, // JS protocol
  /(\bunion\s+select\b|\bselect\b.+\bfrom\b.+\bwhere\b|\bdrop\s+table\b)/i, // SQLi
  /(__proto__|constructor\s*\[|prototype\s*\[)/i, // Prototype pollution
  /\0|%00/, // Null byte injection
];

/**
 * Multi-layer Anti-Bot & Input Security Inspection.
 * Evaluates User-Agent, request headers, burst frequency, query/body injection patterns,
 * and Turnstile clearance tokens.
 */
export function inspectRequestForBotAndAttacks(
  req: any,
  options: {
    endpoint: string;
    isForceRefresh?: boolean;
    isSensitiveMutation?: boolean;
    allowedQueryKeys?: string[];
    nowMs?: number;
  }
): BotInspectionResult {
  const nowMs = options.nowMs ?? Date.now();
  const headers = req?.headers || {};
  const rawUa = String(headers['user-agent'] || '').trim();
  const clientIp = extractTrustedClientIp(req);

  // 1. Validate query parameters for injection patterns, prototype pollution, or excessive length
  const queryObj = req?.query || {};
  for (const [key, rawVal] of Object.entries(queryObj)) {
    if (
      options.allowedQueryKeys &&
      options.allowedQueryKeys.length > 0 &&
      !options.allowedQueryKeys.includes(key)
    ) {
      logSecurityEvent({
        eventType: 'MALFORMED_REQUEST_BLOCKED',
        severity: 'WARN',
        req,
        endpoint: options.endpoint,
        reason: `Unexpected query parameter "${key}" rejected`,
        statusCode: 400,
      });
      return {
        action: 'BLOCK',
        statusCode: 400,
        reason: `Unsupported query parameter: ${key}`,
        suspicionScore: 100,
        isVerifiedCrawler: false,
        requiresTurnstile: false,
      };
    }

    const valStr = typeof rawVal === 'string' ? rawVal : JSON.stringify(rawVal ?? '');
    if (key.length > 64 || valStr.length > 240) {
      logSecurityEvent({
        eventType: 'MALFORMED_REQUEST_BLOCKED',
        severity: 'WARN',
        req,
        endpoint: options.endpoint,
        reason: `Oversized query parameter "${key}" (${valStr.length} chars)`,
        statusCode: 400,
      });
      return {
        action: 'BLOCK',
        statusCode: 400,
        reason: `Query parameter "${key}" exceeds maximum allowed length.`,
        suspicionScore: 100,
        isVerifiedCrawler: false,
        requiresTurnstile: false,
      };
    }

    for (const pattern of MALICIOUS_INPUT_PATTERNS) {
      if (pattern.test(key) || pattern.test(valStr)) {
        logSecurityEvent({
          eventType: 'MALFORMED_REQUEST_BLOCKED',
          severity: 'HIGH',
          req,
          endpoint: options.endpoint,
          reason: `Malicious payload signature detected in query parameter "${key}"`,
          statusCode: 400,
        });
        return {
          action: 'BLOCK',
          statusCode: 400,
          reason: 'Invalid or potentially malicious characters in request parameters.',
          suspicionScore: 100,
          isVerifiedCrawler: false,
          requiresTurnstile: false,
        };
      }
    }
  }

  // 2. Validate request body size and structure if present
  if (req?.body && typeof req.body === 'object') {
    const serializedBody = JSON.stringify(req.body);
    if (serializedBody.length > 65536) {
      logSecurityEvent({
        eventType: 'MALFORMED_REQUEST_BLOCKED',
        severity: 'WARN',
        req,
        endpoint: options.endpoint,
        reason: `Oversized JSON request body (${serializedBody.length} bytes)`,
        statusCode: 413,
      });
      return {
        action: 'BLOCK',
        statusCode: 413,
        reason: 'Request payload exceeds maximum allowed size (64 KB).',
        suspicionScore: 100,
        isVerifiedCrawler: false,
        requiresTurnstile: false,
      };
    }
    for (const pattern of MALICIOUS_INPUT_PATTERNS) {
      if (pattern.test(serializedBody)) {
        logSecurityEvent({
          eventType: 'MALFORMED_REQUEST_BLOCKED',
          severity: 'HIGH',
          req,
          endpoint: options.endpoint,
          reason: 'Malicious injection signature detected in request body',
          statusCode: 400,
        });
        return {
          action: 'BLOCK',
          statusCode: 400,
          reason: 'Malformed or unsafe request body.',
          suspicionScore: 100,
          isVerifiedCrawler: false,
          requiresTurnstile: false,
        };
      }
    }
  }

  // 3. Block known vulnerability scanners immediately (HTTP 403)
  if (rawUa && MALICIOUS_SCANNER_UA_PATTERNS.some((rx) => rx.test(rawUa))) {
    logSecurityEvent({
      eventType: 'BOT_SIGNATURE_BLOCKED',
      severity: 'HIGH',
      req,
      endpoint: options.endpoint,
      reason: `Blocked vulnerability scanner User-Agent (${rawUa.slice(0, 48)})`,
      statusCode: 403,
    });
    return {
      action: 'BLOCK',
      statusCode: 403,
      reason: 'Automated security scanner traffic is prohibited.',
      suspicionScore: 100,
      isVerifiedCrawler: false,
      requiresTurnstile: false,
    };
  }

  // 4. Check if client already holds a valid signed Turnstile clearance token (header or HttpOnly cookie)
  const clearanceToken = extractClearanceTokenFromRequest(req);
  if (clearanceToken && verifyClearanceToken(clearanceToken, clientIp, nowMs)) {
    return {
      action: 'ALLOW',
      reason: 'Verified human clearance token present',
      suspicionScore: 0,
      isVerifiedCrawler: false,
      requiresTurnstile: false,
    };
  }

  // 5. Check if legitimate search engine crawler on standard GET read
  const isVerifiedCrawler =
    Boolean(rawUa) && LEGITIMATE_CRAWLER_UA_PATTERNS.some((rx) => rx.test(rawUa));
  if (isVerifiedCrawler && !options.isForceRefresh && !options.isSensitiveMutation) {
    return {
      action: 'ALLOW',
      reason: 'Legitimate search/preview crawler on public read route',
      suspicionScore: 0,
      isVerifiedCrawler: true,
      requiresTurnstile: false,
    };
  }

  // 6. Compute multi-signal suspicion score for progressive challenge
  let suspicionScore = 0;
  const reasons: string[] = [];

  if (rawUa && SUSPICIOUS_BOT_UA_PATTERNS.some((rx) => rx.test(rawUa))) {
    suspicionScore += 65;
    reasons.push('automated-client-ua');
  }

  // Track rapid burst cadence per IP for force-refresh or suspicious clients
  const burstKey = `${clientIp}:${options.endpoint}`;
  const recentBurst = (rapidBurstStore.get(burstKey) || []).filter(
    (t) => nowMs - t < 5000
  );
  recentBurst.push(nowMs);
  rapidBurstStore.set(burstKey, recentBurst);

  if (options.isForceRefresh && recentBurst.length >= 4) {
    suspicionScore += 60;
    reasons.push('rapid-force-refresh-burst');
  } else if (recentBurst.length >= 25 && rawUa) {
    suspicionScore += 55;
    reasons.push('high-velocity-request-burst');
  }

  // If suspicionScore >= 60, issue progressive Cloudflare Turnstile challenge
  if (suspicionScore >= 60) {
    logSecurityEvent({
      eventType: 'PROGRESSIVE_CHALLENGE_ISSUED',
      severity: 'WARN',
      req,
      endpoint: options.endpoint,
      reason: `Progressive Turnstile challenge issued (score=${suspicionScore}: ${reasons.join(', ')})`,
      statusCode: 403,
    });
    return {
      action: 'CHALLENGE',
      statusCode: 403,
      reason:
        'Automated or high-frequency traffic detected. Please complete Cloudflare Turnstile human verification to continue.',
      suspicionScore,
      isVerifiedCrawler: false,
      requiresTurnstile: true,
    };
  }

  return {
    action: 'ALLOW',
    reason: 'Normal request pattern',
    suspicionScore,
    isVerifiedCrawler: false,
    requiresTurnstile: false,
  };
}

/**
 * Verifies a Cloudflare Turnstile token server-side via https://challenges.cloudflare.com/turnstile/v0/siteverify.
 * Prevents token replay, expired tokens, and malformed tokens.
 */
export async function verifyTurnstileToken(params: {
  token: string | undefined | null;
  req: any;
  nowMs?: number;
}): Promise<TurnstileVerificationResult> {
  const nowMs = params.nowMs ?? Date.now();
  const clientIp = extractTrustedClientIp(params.req);
  const rawToken = String(params.token || '').trim();

  if (!rawToken) {
    logSecurityEvent({
      eventType: 'CAPTCHA_VERIFICATION_FAILED',
      severity: 'WARN',
      req: params.req,
      endpoint: '/api/turnstile-verify',
      reason: 'Missing Turnstile verification token',
      statusCode: 400,
    });
    return {
      ok: false,
      statusCode: 400,
      errorCode: 'MISSING_TOKEN',
      errorMessage: 'Cloudflare Turnstile verification token is required.',
    };
  }

  if (rawToken.length < 12 || rawToken.length > 2048 || /\s/.test(rawToken)) {
    logSecurityEvent({
      eventType: 'CAPTCHA_VERIFICATION_FAILED',
      severity: 'WARN',
      req: params.req,
      endpoint: '/api/turnstile-verify',
      reason: 'Malformed Turnstile token format',
      statusCode: 400,
    });
    return {
      ok: false,
      statusCode: 400,
      errorCode: 'INVALID_TOKEN_FORMAT',
      errorMessage: 'Invalid Cloudflare Turnstile token format.',
    };
  }

  // Prune expired consumed tokens and check for replay
  for (const [hash, exp] of consumedTurnstileTokens.entries()) {
    if (nowMs > exp) consumedTurnstileTokens.delete(hash);
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  if (consumedTurnstileTokens.has(tokenHash)) {
    logSecurityEvent({
      eventType: 'CAPTCHA_REPLAY_BLOCKED',
      severity: 'HIGH',
      req: params.req,
      endpoint: '/api/turnstile-verify',
      reason: 'Blocked reused Cloudflare Turnstile token replay attempt',
      statusCode: 403,
    });
    return {
      ok: false,
      statusCode: 403,
      errorCode: 'TOKEN_ALREADY_USED',
      errorMessage:
        'This Cloudflare Turnstile verification token has already been used. Please complete a fresh challenge.',
    };
  }

  const configuredSecret = (process.env.TURNSTILE_SECRET_KEY || '').trim();
  const strictRequired =
    process.env.TURNSTILE_STRICT_SECRET_REQUIRED === 'true' ||
    configuredSecret === 'DISABLED';
  const secretKey =
    configuredSecret && configuredSecret !== 'DISABLED'
      ? configuredSecret
      : strictRequired
      ? ''
      : '1x0000000000000000000000000000000AA';

  if (!secretKey) {
    logSecurityEvent({
      eventType: 'CAPTCHA_VERIFICATION_FAILED',
      severity: 'WARN',
      req: params.req,
      endpoint: '/api/turnstile-verify',
      reason: 'TURNSTILE_SECRET_KEY environment variable is not configured on the server',
      statusCode: 503,
    });
    return {
      ok: false,
      statusCode: 503,
      errorCode: 'SECRET_NOT_CONFIGURED',
      errorMessage:
        'Server-side TURNSTILE_SECRET_KEY is not configured. Configure TURNSTILE_SECRET_KEY in environment variables.',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const formBody = new URLSearchParams();
    formBody.set('secret', secretKey);
    formBody.set('response', rawToken);
    formBody.set('remoteip', clientIp);
    formBody.set('idempotency_key', crypto.randomUUID());

    const verifyRes = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody.toString(),
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!verifyRes.ok) {
      return {
        ok: false,
        statusCode: 502,
        errorCode: 'UPSTREAM_ERROR',
        errorMessage: 'Unable to reach Cloudflare Turnstile Siteverify service.',
      };
    }

    const outcome = (await verifyRes.json()) as {
      success?: boolean;
      challenge_ts?: string;
      hostname?: string;
      'error-codes'?: string[];
    };

    const errorCodes = Array.isArray(outcome?.['error-codes'])
      ? outcome['error-codes']
      : [];

    if (!outcome?.success) {
      // Record failed attempt for this IP
      const fails = (failedCaptchaStore.get(clientIp) || []).filter(
        (t) => nowMs - t < 600_000
      );
      fails.push(nowMs);
      failedCaptchaStore.set(clientIp, fails);

      const isExpired = errorCodes.includes('timeout-or-duplicate');
      logSecurityEvent({
        eventType: 'CAPTCHA_VERIFICATION_FAILED',
        severity: fails.length >= 3 ? 'HIGH' : 'WARN',
        req: params.req,
        endpoint: '/api/turnstile-verify',
        reason: `Turnstile Siteverify rejected token (codes=${errorCodes.join(',') || 'invalid-input-response'}, recentFails=${fails.length})`,
        statusCode: 403,
      });

      return {
        ok: false,
        statusCode: 403,
        errorCode: isExpired ? 'TOKEN_EXPIRED' : 'VERIFICATION_FAILED',
        errorMessage: isExpired
          ? 'Verification token has expired. Please solve the Turnstile challenge again.'
          : 'Cloudflare Turnstile human verification failed.',
      };
    }

    // Check challenge_ts age if provided (reject tokens older than 5 minutes)
    if (outcome.challenge_ts) {
      const challengeEpochMs = Date.parse(outcome.challenge_ts);
      if (Number.isFinite(challengeEpochMs) && nowMs - challengeEpochMs > 5 * 60 * 1000) {
        logSecurityEvent({
          eventType: 'CAPTCHA_VERIFICATION_FAILED',
          severity: 'WARN',
          req: params.req,
          endpoint: '/api/turnstile-verify',
          reason: 'Rejected stale Turnstile token (> 5 minutes old)',
          statusCode: 403,
        });
        return {
          ok: false,
          statusCode: 403,
          errorCode: 'TOKEN_EXPIRED',
          errorMessage: 'Verification token has expired. Please refresh the challenge.',
        };
      }
    }

    // Mark token as consumed so it can never be replayed
    consumedTurnstileTokens.set(tokenHash, nowMs + CONSUMED_TOKEN_TTL_MS);

    const { clearanceToken, expiresAtMs } = issueClearanceToken(clientIp, nowMs);

    logSecurityEvent({
      eventType: 'CAPTCHA_VERIFICATION_SUCCESS',
      severity: 'INFO',
      req: params.req,
      endpoint: '/api/turnstile-verify',
      reason: 'Cloudflare Turnstile verification succeeded; issued clearance token',
      statusCode: 200,
    });

    return {
      ok: true,
      statusCode: 200,
      clearanceToken,
      expiresAtMs,
    };
  } catch {
    return {
      ok: false,
      statusCode: 502,
      errorCode: 'UPSTREAM_ERROR',
      errorMessage: 'Error communicating with Cloudflare Turnstile verification service.',
    };
  }
}

/**
 * Returns sanitized security monitoring telemetry for authorized administrators.
 */
export function getSecurityMonitoringSummary() {
  const kvConfigured = Boolean(getDistributedKvConfig());
  const turnstileSecretConfigured = Boolean(
    (process.env.TURNSTILE_SECRET_KEY || '').trim()
  );
  const turnstileSiteKeyConfigured = Boolean(
    (
      process.env.VITE_TURNSTILE_SITE_KEY ||
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
      ''
    ).trim()
  );

  return {
    ok: true,
    generatedAtIso: new Date().toISOString(),
    posture: {
      turnstileSiteKeyConfigured,
      turnstileSecretConfigured,
      distributedRateLimitStoreConfigured: kvConfigured,
      rateLimitMode: kvConfigured ? 'distributed-kv' : 'memory-sliding-window',
      policiesPerMinute: {
        marketIndices: getEndpointRateLimitPolicy('market-indices').maxRequestsPerMinute,
        economicNews: getEndpointRateLimitPolicy('economic-news').maxRequestsPerMinute,
        economistBitesGet: getEndpointRateLimitPolicy('economist-bites').maxRequestsPerMinute,
        economistBitesPostAndAi: getEndpointRateLimitPolicy('economist-bites-post')
          .maxRequestsPerMinute,
        health: getEndpointRateLimitPolicy('health').maxRequestsPerMinute,
      },
    },
    counters: { ...securityEventCounters },
    recentEvents: securityEventLog.slice(0, 50),
  };
}

/**
 * Test helper to reset in-memory rate limits, replay tokens, and security logs between test runs.
 */
export function resetSecurityShieldForTest(): void {
  slidingWindowStore.clear();
  rapidBurstStore.clear();
  consumedTurnstileTokens.clear();
  failedCaptchaStore.clear();
  securityEventLog.length = 0;
  for (const key of Object.keys(securityEventCounters) as SecurityEventType[]) {
    securityEventCounters[key] = 0;
  }
}
