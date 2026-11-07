/**
 * Server-side Health & Readiness Endpoint (/api/health)
 * Compatible with both Vercel Serverless Functions and Express (server.ts).
 */

import {
  applyApiSecurityAndCorsHeaders,
  formatTimestampIst,
} from './market-indices.ts';
import {
  enforceEndpointRateLimit,
  inspectRequestForBotAndAttacks,
  logSecurityEvent,
} from './security-shield.ts';

export interface HealthCheckResponse {
  ok: boolean;
  service: string;
  version: string;
  status: 'healthy';
  timestampMs: number;
  timestampIst: string;
  uptimeSeconds: number;
  endpoints: {
    marketIndices: string;
    economicNews: string;
    economistBites: string;
    turnstileVerify: string;
    securityMonitor: string;
    health: string;
  };
  officialCsvDatasetsCount: number;
}

export function getHealthCheckPayload(): HealthCheckResponse {
  const nowMs = Date.now();
  return {
    ok: true,
    service: 'ArthNiti — Indian Economic Intelligence Platform',
    version: '1.0.0-production',
    status: 'healthy',
    timestampMs: nowMs,
    timestampIst: formatTimestampIst(nowMs, true),
    uptimeSeconds: Math.round(process.uptime()),
    endpoints: {
      marketIndices: '/api/market-indices',
      economicNews: '/api/economic-news',
      economistBites: '/api/economist-bites',
      turnstileVerify: '/api/turnstile-verify',
      securityMonitor: '/api/security-monitor',
      health: '/api/health',
    },
    officialCsvDatasetsCount: 8,
  };
}

export default async function handler(req: any, res: any) {
  applyApiSecurityAndCorsHeaders(req, res, 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    logSecurityEvent({
      eventType: 'INVALID_HTTP_METHOD',
      severity: 'WARN',
      req,
      endpoint: '/api/health',
      reason: `Rejected invalid HTTP method ${req.method}`,
      statusCode: 405,
    });
    return res.status(405).json({
      ok: false,
      error: `Method ${req.method} Not Allowed. Use GET.`,
    });
  }

  // Optional authorized health monitor token bypasses 10 req/min rate limit
  const monitorToken = (process.env.HEALTH_MONITOR_TOKEN || '').trim();
  const authHeader = String(req?.headers?.authorization || '').trim();
  const isAuthorizedMonitor =
    Boolean(monitorToken) && authHeader === `Bearer ${monitorToken}`;

  if (!isAuthorizedMonitor) {
    const rl = await enforceEndpointRateLimit(req, res, 'health');
    if (!rl.allowed) {
      return res.status(429).json({
        ok: false,
        error: 'Rate limit exceeded for /api/health (10 requests/minute).',
        retryAfterSeconds: rl.retryAfterSeconds,
      });
    }
  }

  const botCheck = inspectRequestForBotAndAttacks(req, {
    endpoint: '/api/health',
    allowedQueryKeys: [],
  });
  if (botCheck.action === 'BLOCK') {
    return res.status(botCheck.statusCode || 400).json({
      ok: false,
      error: botCheck.reason,
    });
  }

  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(200).json(getHealthCheckPayload());
}
