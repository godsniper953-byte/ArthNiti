import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import marketIndicesHandler, {
  ARTHNITI_CSP_HEADER,
} from './api/market-indices.ts';
import economicNewsHandler from './api/economic-news.ts';
import economistBitesHandler from './api/economist-bites.ts';
import healthHandler from './api/health.ts';
import turnstileVerifyHandler from './api/turnstile-verify.ts';
import securityMonitorHandler from './api/security-monitor.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '64kb' }));

  // Safe error handler for malformed JSON bodies or oversized payloads (prevents stack trace leakage)
  app.use((err: any, _req: any, res: any, next: any) => {
    if (err?.type === 'entity.too.large') {
      return res.status(413).json({
        ok: false,
        error: 'Request payload exceeds maximum allowed size (64 KB).',
      });
    }
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({
        ok: false,
        error: 'Malformed JSON request payload.',
      });
    }
    return next(err);
  });

  // Defensive HTTP security headers across all responses
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
    );
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
    res.setHeader('Content-Security-Policy', ARTHNITI_CSP_HEADER);
    next();
  });

  // Mount server-side Health & Readiness API route
  app.all('/api/health', async (req, res) => {
    await healthHandler(req, res);
  });

  // Mount server-side Indian Stock Market Indices API route
  app.all('/api/market-indices', async (req, res) => {
    await marketIndicesHandler(req, res);
  });

  // Mount server-side Economic News & Current Affairs Intelligence API route
  app.all('/api/economic-news', async (req, res) => {
    await economicNewsHandler(req, res);
  });

  // Mount server-side Economists' Latest Bites Discovery & Verification API route
  app.all('/api/economist-bites', async (req, res) => {
    await economistBitesHandler(req, res);
  });

  // Mount server-side Cloudflare Turnstile Verification API route
  app.all('/api/turnstile-verify', async (req, res) => {
    await turnstileVerifyHandler(req, res);
  });

  // Mount protected internal Security Monitoring API route
  app.all('/api/security-monitor', async (req, res) => {
    await securityMonitorHandler(req, res);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(
      express.static(distPath, {
        maxAge: '1h',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html') || filePath.endsWith('.csv')) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ArthNiti Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
