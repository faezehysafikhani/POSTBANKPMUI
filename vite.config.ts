import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  build: { target: 'esnext' },
  server: { port: 3000, host: '0.0.0.0' },
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(process.cwd(), '.') } },
});
