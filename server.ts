import express from 'express';
import { createServer } from 'node:http';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const port = Number(process.env.PORT || 3000);
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
