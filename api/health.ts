/**
 * Server-side Health & Readiness Endpoint (/api/health)
 * Compatible with both Vercel Serverless Functions and Express (server.ts).
 */

import {
  applyApiSecurityAndCorsHeaders,
  formatTimestampIst,
} from './market-indices.ts';

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
      health: '/api/health',
    },
    officialCsvDatasetsCount: 8,
  };
}

export default async function handler(req: any, res: any) {
  applyApiSecurityAndCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method && req.method !== 'GET') {
    return res.status(405).json({
      ok: false,
      error: `Method ${req.method} Not Allowed. Use GET.`,
    });
  }

  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(200).json(getHealthCheckPayload());
}
