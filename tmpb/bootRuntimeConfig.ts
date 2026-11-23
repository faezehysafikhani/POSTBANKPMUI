// Imported first by index.tsx. Note: the top-level await below holds back only index.tsx's own body, not the modules
// imported next to it (App and everything under it are evaluated before the file has been read). Code that needs the
// settings must therefore read window.__TMPB_RUNTIME_CONFIG__ when it runs, never once at module load.
import { loadRuntimeConfig } from './runtimeConfig';

await loadRuntimeConfig();
