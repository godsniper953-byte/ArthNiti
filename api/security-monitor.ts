/**
 * Protected Internal Security Monitoring Endpoint (/api/security-monitor)
 * Compatible with both Vercel Serverless Functions and Express (server.ts).
 *
 * Requires Authorization: Bearer <SECURITY_MONITOR_TOKEN>
 * Never exposes secrets, tokens, or unmasked IP addresses.
 */

import { applyApiSecurityAndCorsHeaders } from './market-indices.ts';
import {
  enforceEndpointRateLimit,
  getSecurityMonitoringSummary,
  logSecurityEvent,
} from './security-shield.ts';

export default async function handler(req: any, res: any) {
  applyApiSecurityAndCorsHeaders(req, res, 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    logSecurityEvent({
      eventType: 'INVALID_HTTP_METHOD',
      severity: 'WARN',
      req,
      endpoint: '/api/security-monitor',
      reason: `Rejected invalid HTTP method ${req.method}`,
      statusCode: 405,
    });
    return res.status(405).json({
      ok: false,
      error: `Method ${req.method} Not Allowed. Use GET.`,
    });
  }

  const rl = await enforceEndpointRateLimit(req, res, 'security-monitor');
  if (!rl.allowed) {
    return res.status(429).json({
      ok: false,
      error: 'Too many requests to security monitor.',
      retryAfterSeconds: rl.retryAfterSeconds,
    });
  }

  const configuredToken = (
    process.env.SECURITY_MONITOR_TOKEN ||
    process.env.ECONOMIST_BITES_INGEST_SECRET ||
    ''
  ).trim();
  const authHeader = String(req?.headers?.authorization || '').trim();

  if (!configuredToken || authHeader !== `Bearer ${configuredToken}`) {
    logSecurityEvent({
      eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      severity: 'HIGH',
      req,
      endpoint: '/api/security-monitor',
      reason: 'Unauthorized access attempt to /api/security-monitor',
      statusCode: 401,
    });
    return res.status(401).json({
      ok: false,
      error: 'Unauthorized. Valid Bearer SECURITY_MONITOR_TOKEN is required.',
    });
  }

  return res.status(200).json(getSecurityMonitoringSummary());
}
