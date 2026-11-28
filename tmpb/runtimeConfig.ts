/**
 * THE ONE PLACE that says which backend the UI talks to: `apiBaseUrl` in /config/runtime-config.json
 * (public/config in development, dist/config once built). Every API call, the SignalR hub and server.ts's
 * Content-Security-Policy take the address from there; nothing else (no .env, no VITE_* variable) names it.
 *
 * The deployment's settings (API address, tenant, timeout) come from /config/runtime-config.json,
 * a plain data file an operator edits on the server without rebuilding. It is data, not a
 * script: a script file that anyone with write access to the web folder could extend would run
 * inside the application, with the user's tokens.
 *
 * Whatever the file says is checked here before the application starts: only known settings,
 * only plain http(s) addresses (no credentials, query or fragment), and - when the build lists
 * the API origins it may talk to (VITE_ALLOWED_API_ORIGINS) - only those.
 */
export interface RuntimeConfig {
  apiBaseUrl?: string;
  tenantSlug?: string;
  requestTimeoutMs?: number;
}

declare global {
  interface Window {
    __TMPB_RUNTIME_CONFIG__?: RuntimeConfig;
  }
}

/**
 * The settings, read at call time. bootRuntimeConfig.ts fills them after an await, and a top-level await does not hold
 * back the modules imported next to it, so a value read once at module load would still be the empty default.
 */
const current = (): RuntimeConfig => (typeof window !== 'undefined' && window.__TMPB_RUNTIME_CONFIG__) || {};

/** The backend's origin, e.g. https://localhost:7443. Empty means the page's own origin. */
export const apiBaseUrl = (): string => current().apiBaseUrl || '';
/** Optional tenant slug sent with login. Empty for a single-tenant install. */
export const tenantSlug = (): string => current().tenantSlug || '';
/** How long an API request may take before this client gives up on it; 0 (the default) means it waits for the server's answer. */
export const requestTimeoutMs = (): number => current().requestTimeoutMs ?? 0;

/** Same origin as the page: the safe default. */
const SAME_ORIGIN = '';

function cleanAddress(value: unknown, allowedOrigins: string[], pageOrigin: string): string {
  if (typeof value !== 'string' || value.trim() === '') return SAME_ORIGIN;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return SAME_ORIGIN;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return SAME_ORIGIN;
  if (url.username || url.password || url.search || url.hash) return SAME_ORIGIN;
  if (url.origin !== pageOrigin && allowedOrigins.length > 0 && !allowedOrigins.includes(url.origin)) {
    return SAME_ORIGIN;
  }
  return url.href.replace(/\/+$/, '');
}

export function sanitizeRuntimeConfig(raw: unknown, allowedOrigins: string[] = [], pageOrigin = ''): RuntimeConfig {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const config: RuntimeConfig = {
    apiBaseUrl: cleanAddress(source.apiBaseUrl, allowedOrigins, pageOrigin),
  };
  if (typeof source.tenantSlug === 'string' && /^[A-Za-z0-9-]{0,80}$/.test(source.tenantSlug.trim())) {
    config.tenantSlug = source.tenantSlug.trim();
  }
  const timeout = Number(source.requestTimeoutMs);
  if (Number.isFinite(timeout) && (timeout === 0 || (timeout >= 1000 && timeout <= 120_000))) {
    config.requestTimeoutMs = Math.round(timeout);
  }
  return config;
}

export function allowedApiOrigins(): string[] {
  const listed = String(((import.meta as any).env || {}).VITE_ALLOWED_API_ORIGINS || '');
  return listed.split(',').map((origin) => origin.trim().replace(/\/+$/, '')).filter(Boolean);
}

/** Reads and checks the settings file, then hands them to the API client. A missing or broken file means same-origin defaults. */
export async function loadRuntimeConfig(): Promise<void> {
  let raw: unknown = {};
  try {
    const response = await fetch('/config/runtime-config.json', { cache: 'no-store', credentials: 'same-origin' });
    if (response.ok) raw = await response.json();
  } catch {
    // No file, or not JSON: the defaults apply.
  }
  (window as any).__TMPB_RUNTIME_CONFIG__ = sanitizeRuntimeConfig(raw, allowedApiOrigins(), window.location.origin);
}
