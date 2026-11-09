import express from 'express';
import type { Request } from 'express';
import { createServer } from 'node:http';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';

/**
 * The app's own server (BFF): serves the UI and forwards /api to the .NET backend, so the browser never talks to it directly.
 *
 * Security settings (environment variables):
 *   BACKEND_URL    where the backend runs (default http://localhost:5251)
 *   TRUST_PROXY    "1" only when this server sits behind a reverse proxy (IIS / nginx) that sets X-Forwarded-For / -Proto.
 *                  Otherwise a client-sent X-Forwarded-For is ignored, so nobody can fake their address towards the backend.
 *   MAX_BODY_MB    largest request body forwarded (uploads), default 200
 */
const isProd = process.env.NODE_ENV === 'production';
const TRUST_PROXY = /^(1|true|yes)$/i.test(process.env.TRUST_PROXY || '');
const MAX_BODY_BYTES = Math.max(1, Number(process.env.MAX_BODY_MB || 200)) * 1024 * 1024;

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
 * stylesheet injected at run time). Images / fonts may be data: or blob: (logos, generated PDFs); nothing is loaded from
 * another origin, and the app may not be framed by anyone (clickjacking).
 */
const CSP = [
  "default-src 'self'",
  isProd ? "script-src 'self'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  isProd ? "connect-src 'self'" : "connect-src 'self' ws: wss:",
  "frame-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const port = Number(process.env.PORT || 3000);
  app.disable('x-powered-by');

  // Security headers on every answer (pages, assets and the forwarded API).
  app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', CSP);
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

  app.use(express.json({ limit: '5mb' }));
  const BACKEND_TARGET = (process.env.BACKEND_URL || "http://localhost:5251").replace(/\/+$/, "");

  // The address of the computer asking, for the header of printed / PDF reports (a browser cannot read its own IP).
  app.get("/__client-info", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ ip: clientAddress(req) });
  });

  app.use("/api", async (req, res) => {
    // Only paths under /api reach the backend: "..", encoded dots and backslashes could step outside it (to Swagger, health ...).
    if (/(^|[\/\\])\.\.([\/\\]|$)|%2e|%5c|\\/i.test(req.url.split('?')[0])) {
      res.status(400).json({ title: "bad_request", detail: "نشانی درخواست معتبر نیست." });
      return;
    }
    const target = `${BACKEND_TARGET}/api${req.url}`;
    try {
      const headers: Record<string, string> = {};
      if (req.headers["authorization"]) headers["Authorization"] = String(req.headers["authorization"]);
      if (req.headers["content-type"]) headers["Content-Type"] = String(req.headers["content-type"]);
      if (req.headers["accept-language"]) headers["Accept-Language"] = String(req.headers["accept-language"]);
      // Sessions: the refresh token is the backend's HttpOnly cookie (scoped to /api/identity/auth); a browser asks for that mode
      // with X-Nexus-Session and proves it is not a cross-site form with X-Requested-With. The backend also decides from the
      // client address and device (kept as the browser's own user agent and, behind this server, the forwarded address).
      for (const name of ["cookie", "x-nexus-session", "x-requested-with", "user-agent", "x-active-posts", "x-nexus-activity"]) {
        if (req.headers[name]) headers[name] = String(req.headers[name]);
      }
      // The client's address for the backend: a client-sent X-Forwarded-For is passed on only behind a configured proxy.
      const socketAddress = req.socket.remoteAddress;
      const chain = TRUST_PROXY ? [req.headers["x-forwarded-for"], socketAddress] : [socketAddress];
      const forwardedFor = chain.filter(Boolean).join(", ");
      if (forwardedFor) headers["X-Forwarded-For"] = forwardedFor;
      // JSON bodies were already parsed above; anything else (a multipart document upload, for instance) is passed through byte for byte.
      let body: BodyInit | undefined;
      if (!["GET", "HEAD"].includes(req.method)) {
        if (String(req.headers["content-type"] || "").includes("application/json")) {
          if (req.body && Object.keys(req.body).length > 0) body = JSON.stringify(req.body);
        } else {
          const chunks: Buffer[] = [];
          let size = 0;
          for await (const chunk of req) {
            size += (chunk as Buffer).length;
            if (size > MAX_BODY_BYTES) {
              res.status(413).json({ title: "payload_too_large", detail: "حجم فایل یا درخواست بیش از حد مجاز است." });
              return;
            }
            chunks.push(chunk as Buffer);
          }
          if (chunks.length) body = Buffer.concat(chunks);
        }
      }
      const backendResponse = await fetch(target, { method: req.method, headers, body, signal: AbortSignal.timeout(130_000) });
      res.status(backendResponse.status);
      const contentType = backendResponse.headers.get("content-type");
      if (contentType) res.setHeader("Content-Type", contentType);
      const disposition = backendResponse.headers.get("content-disposition");
      if (disposition) res.setHeader("Content-Disposition", disposition);
      // The cookie that carries the refresh token, why a session ended, how long to wait after "too many requests", and the
      // no-store header the identity routes use so tokens are never cached.
      const setCookies = backendResponse.headers.getSetCookie?.() ?? [];
      if (setCookies.length) res.setHeader("Set-Cookie", setCookies);
      for (const name of ["x-nexus-session-reason", "retry-after", "cache-control", "pragma"]) {
        const value = backendResponse.headers.get(name);
        if (value) res.setHeader(name, value);
      }
      res.send(Buffer.from(await backendResponse.arrayBuffer()));
    } catch (err: any) {
      // The reason is logged here; the browser gets no internals (no backend address, no error text).
      console.error(`[api] ${req.method} ${req.path} -> backend unreachable:`, err?.message || err);
      if (!res.headersSent) res.status(502).json({ title: "backend.unreachable", detail: "سرور سامانه در دسترس نیست. کمی بعد دوباره تلاش کنید." });
    }
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
