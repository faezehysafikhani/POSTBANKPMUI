import express from 'express';
import { createServer } from 'node:http';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const port = Number(process.env.PORT || 3000);
  app.use(express.json({ limit: '5mb' }));
  const BACKEND_TARGET = (process.env.BACKEND_URL || "http://localhost:5251").replace(/\/+$/, "");
  app.use("/api", async (req, res) => {
    const target = `${BACKEND_TARGET}/api${req.url}`;
    try {
      const headers: Record<string, string> = {};
      if (req.headers["authorization"]) headers["Authorization"] = String(req.headers["authorization"]);
      if (req.headers["content-type"]) headers["Content-Type"] = String(req.headers["content-type"]);
      if (req.headers["accept-language"]) headers["Accept-Language"] = String(req.headers["accept-language"]);
      // Sessions: the refresh token is the backend's HttpOnly cookie (scoped to /api/identity/auth); a browser asks for that mode
      // with X-Nexus-Session and proves it is not a cross-site form with X-Requested-With. The backend also decides from the
      // client address and device (kept as the browser's own user agent and, behind this server, the forwarded address).
      for (const name of ["cookie", "x-nexus-session", "x-requested-with", "user-agent"]) {
        if (req.headers[name]) headers[name] = String(req.headers[name]);
      }
      const clientAddress = req.socket.remoteAddress;
      if (clientAddress) headers["X-Forwarded-For"] = [req.headers["x-forwarded-for"], clientAddress].filter(Boolean).join(", ");
      // JSON bodies were already parsed above; anything else (a multipart document upload, for instance) is passed through byte for byte.
      let body: BodyInit | undefined;
      if (!["GET", "HEAD"].includes(req.method)) {
        if (String(req.headers["content-type"] || "").includes("application/json")) {
          if (req.body && Object.keys(req.body).length > 0) body = JSON.stringify(req.body);
        } else {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          if (chunks.length) body = Buffer.concat(chunks);
        }
      }
      const backendResponse = await fetch(target, { method: req.method, headers, body });
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
      res.status(502).json({ title: "backend.unreachable", detail: `The backend (${BACKEND_TARGET}) could not be reached: ${err?.message || err}` });
    }
  });


  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true, hmr: { server: httpServer } }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  httpServer.on('error', (error: NodeJS.ErrnoException) => {
    console.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. Stop the previous server or set PORT to another number.` : error.message);
    process.exit(1);
  });
  httpServer.listen(port, '0.0.0.0', () => console.log(`Server running on http://localhost:${port}`));
}
startServer().catch(error => { console.error(error); process.exit(1); });
