import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { execFileSync } from 'node:child_process';

/**
 * The settings screens' utility stylesheet (tmpb/reference.css) is compiled by the Tailwind CLI into tmpb/generated.css.
 * Doing it here, at every dev start and build, means the generated file can never be stale. (Not the Tailwind Vite plugin:
 * it would process every stylesheet of the product too.)
 */
function settingsStylesheet(): Plugin {
  return {
    name: 'settings-stylesheet',
    buildStart() {
      execFileSync(process.execPath, [path.resolve('node_modules/@tailwindcss/cli/dist/index.mjs'), '-i', 'tmpb/reference.css', '-o', 'tmpb/generated.css', '--minify'], { stdio: 'inherit' });
    },
  };
}

export default defineConfig({
  build: { target: 'esnext' },
  server: { port: 3000, host: '0.0.0.0' },
  plugins: [react(), settingsStylesheet()],
  resolve: { alias: { '@': path.resolve(process.cwd(), '.') } },
});
