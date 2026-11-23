import express from 'express';
import type { Request } from 'express';
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';

/**
 * The app's own server: serves the UI. The browser talks to the .NET backend directly, at the address in
 * config/runtime-config.json (`apiBaseUrl`) - the only place the backend's address is set. This server reads the same file
 * only to let that address through its Content-Security-Policy.
 *
 * Environment variables:
 *   PORT           port of this server (default 3000)
 *   TRUST_PROXY    "1" only when this server sits behind a reverse proxy (IIS / nginx) that sets X-Forwarded-For / -Proto.
 *                  Otherwise a client-sent X-Forwarded-For is ignored, so nobody can fake their address.
 */
const isProd = process.env.NODE_ENV === 'production';
const TRUST_PROXY = /^(1|true|yes)$/i.test(process.env.TRUST_PROXY || '');

/** config/runtime-config.json as the browser gets it: public/ in development, dist/ once built. */
const RUNTIME_CONFIG_FILE = path.join(process.cwd(), isProd ? 'dist' : 'public', 'config', 'runtime-config.json');
let configCache: { mtimeMs: number; apiOrigin: string } | null = null;

/** The backend's origin from config/runtime-config.json (re-read when the file changes, so an edit needs no restart). */
function apiOrigin(): string {
  try {
    const { mtimeMs } = statSync(RUNTIME_CONFIG_FILE);
    if (configCache?.mtimeMs === mtimeMs) return configCache.apiOrigin;
    const raw = JSON.parse(readFileSync(RUNTIME_CONFIG_FILE, 'utf8'));
    let origin = '';
    try {
      const url = new URL(String(raw?.apiBaseUrl || ''));
      if (url.protocol === 'https:' || url.protocol === 'http:') origin = url.origin;
    } catch { /* empty or not an address: same origin */ }
    configCache = { mtimeMs, apiOrigin: origin };
    return origin;
  } catch {
    return '';
  }
}

/** The client's address: the proxy's word for it only when a proxy is configured, otherwise the connection's own. */
function clientAddress(req: Request): string {
  let ip = TRUST_PROXY ? String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() : '';
  ip = ip || req.socket.remoteAddress || '';
  ip = ip.replace(/^::ffff:/, '');
  return ip === '::1' ? '127.0.0.1' : ip;
}
const isHttps = (req: Request) =>
  (req.socket as { encrypted?: boolean }).encrypted === true
  || (TRUST_PROXY && String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase() === 'https');

/**
 * Content-Security-Policy. Production allows scripts from this origin only; development also allows what Vite's hot reload
 * needs (an inline preamble, eval and its websocket). Styles allow inline (React style attributes and the settings
 * stylesheet injected at run time). Images / fonts may be data: or blob: (logos, generated PDFs). The page may connect to
 * itself and to the backend of config/runtime-config.json (its REST API and its SignalR websocket); nothing else, and
 * the app may not be framed by anyone (clickjacking).
 */
function contentSecurityPolicy(): string {
  const backend = apiOrigin();
  const backendSocket = backend.replace(/^http/, 'ws');
  const backendSources = backend ? ` ${backend} ${backendSocket}` : '';
  return [
    "default-src 'self'",
    isProd ? "script-src 'self'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${backendSources ? ` ${backend}` : ''}`,
    "font-src 'self' data:",
    isProd ? `connect-src 'self'${backendSources}` : `connect-src 'self' ws: wss:${backendSources}`,
    `frame-src 'self' blob:${backendSources ? ` ${backend}` : ''}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const port = Number(process.env.PORT || 3000);
  app.disable('x-powered-by');

  // Security headers on every answer (pages, assets and the forwarded API).
  app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', contentSecurityPolicy());
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    if (isHttps(req)) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  app.get("/__client-info", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ ip: clientAddress(req) });
  });

  // The browser calls the backend itself (apiBaseUrl). A request for /api here means that address is missing.
  app.use("/api", (_req, res) => {
    console.error(`[api] apiBaseUrl is not set in ${RUNTIME_CONFIG_FILE}: the browser asked this server for /api.`);
    res.status(502).json({ title: "backend.not_configured", detail: "نشانی سرور سامانه (apiBaseUrl در config/runtime-config.json) تنظیم نشده است." });
  });

  if (!isProd) {
    const vite = await createViteServer({ server: { middlewareMode: true, hmr: { server: httpServer } }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // dist also holds this server's own bundle and its source map: never served. Nor is any other source map.
    app.use((req, res, next) => (/^\/server\.c?js/i.test(req.path) || /\.map$/i.test(req.path) ? res.status(404).end() : next()));
    app.use(express.static(distPath, { dotfiles: 'ignore', index: false }));
    app.get('*all', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  httpServer.on('error', (error: NodeJS.ErrnoException) => {
    console.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. Stop the previous server or set PORT to another number.` : error.message);
    process.exit(1);
  });
  httpServer.listen(port, '0.0.0.0', () => console.log(`Server running on http://localhost:${port}`));
}
startServer().catch(error => { console.error(error); process.exit(1); });
