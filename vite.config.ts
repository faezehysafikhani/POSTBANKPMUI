import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  build: { target: 'esnext' },
  server: { port: 3000, host: '0.0.0.0' },
  // Tailwind compiles tmpb/reference.css (the settings screens' utilities) on every start and build, so it can never be stale.
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(process.cwd(), '.') } },
});
