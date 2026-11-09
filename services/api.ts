/**
 * The only door to the backend. The UI holds no business rules: it sends what the user typed and shows what the
 * backend answers. Requests go to this app's own origin; server.ts forwards /api to the .NET backend.
 *
 * Errors: the backend answers failures as RFC 7807 problem details (`title` is the error code such as "conflict",
 * `detail` the message). They are returned as `ApiError` so screens can show the backend's own message.
 */

import { takeActivityFlag } from '../tmpb/utils/sessionActivity';

export interface ApiError {
  status: number;
  /** Error code from the backend (validation.error, not_found, conflict, forbidden, unauthorized.captcha_required, ...). */
  code: string;
  message: string;
}

export interface ApiResult<T> {
  ok: boolean;
  value?: T;
  error?: ApiError;
}

/** Older builds kept tokens in storage (the access token, and before the cookie the refresh token); they are only ever removed. */
const LEGACY_KEYS = ['pms_access_token', 'pms_refresh_token'];
const dropLegacyTokens = () => { try { LEGACY_KEYS.forEach(key => localStorage.removeItem(key)); } catch { /* storage unavailable */ } };
dropLegacyTokens();

/** The refresh token, kept in the page only in "body" mode (see usesBodyToken); in cookie mode it is the backend's HttpOnly cookie. */
const REFRESH_KEY = 'pms_session_refresh';

/** The API's address from config/runtime-config.json: empty means this page's own origin (the default). */
export const apiBaseUrl = (): string => String((window as any).__TMPB_RUNTIME_CONFIG__?.apiBaseUrl || '');
/** Absolute address of an /api path: the page's origin, or the API site named in the runtime config. */
export const apiUrl = (url: string): string => (url.startsWith('/api/') || url === '/api' ? apiBaseUrl() + url : url);

/**
 * How the refresh token travels. The HttpOnly cookie is Secure outside development, so it only works over https on the
 * API's own origin. On plain http (or with the API on another site) the backend hands the token over in the response body
 * (Identity:Session:ReturnRefreshTokenInBody) and it is kept here. Once the site is on https this switches back by itself.
 */
export const usesBodyToken = (): boolean =>
  !!apiBaseUrl() || (window.location.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname));

/**
 * The short-lived access token lives in memory only, never in localStorage / sessionStorage. A reload starts without it and
 * renews it through the refresh token (the HttpOnly cookie, or on plain http the stored one).
 */
let accessToken: string | null = null;
export const tokenStore = {
  get access(): string | null {
    return accessToken;
  },
  get refresh(): string | null {
    try { return usesBodyToken() ? localStorage.getItem(REFRESH_KEY) : null; } catch { return null; }
  },
  set(access: string, refresh?: string | null) {
    lastEndReason = null; // a session was opened: whatever ended the previous one is old news
    accessToken = access;
    dropLegacyTokens();
    try {
      if (refresh && usesBodyToken()) localStorage.setItem(REFRESH_KEY, refresh);
      else if (!usesBodyToken()) localStorage.removeItem(REFRESH_KEY);
    } catch { /* storage unavailable: the session just will not survive a reload */ }
  },
  clear() {
    accessToken = null;
    dropLegacyTokens();
    try { localStorage.removeItem(REFRESH_KEY); } catch { /* ignore */ }
  }
};

/**
 * What the backend's session endpoints expect from a browser: the refresh token travels as a cookie (X-Nexus-Session) and
 * the request must carry X-Requested-With, a header a cross-site form cannot send.
 */
const sessionHeaders = (): Record<string, string> =>
  usesBodyToken() ? { 'X-Requested-With': 'XMLHttpRequest' } : { 'X-Nexus-Session': 'cookie', 'X-Requested-With': 'XMLHttpRequest' };
const isAuthUrl = (url: string) => url.startsWith('/api/identity/auth/');
/** The calls that carry no access token of their own: a 401 from them is an answer, not a reason to refresh and retry. */
const isSessionOpeningUrl = (url: string) =>
  ['/api/identity/auth/login', '/api/identity/auth/refresh', '/api/identity/auth/logout', '/api/identity/auth/captcha'].some(prefix => url.startsWith(prefix));

/** Why a session ended, as the backend names it (session.idle_expired, session.revoked, ...). */
export const SESSION_REASON_HEADER = 'X-Nexus-Session-Reason';

let refreshing: Promise<boolean> | null = null;

/** One refresh at a time, however many requests found the token expired together. */
export async function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const stored = tokenStore.refresh;
      const response = await fetch(apiUrl('/api/identity/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...sessionHeaders() },
        body: JSON.stringify(stored ? { refreshToken: stored } : {})
      });
      if (!response.ok) {
        lastEndReason = await endReasonOf(response);
        return false;
      }
      const data = await response.json();
      if (!data.accessToken) return false;
      tokenStore.set(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => { refreshing = null; }, 0);
    }
  })();
  return refreshing;
}

/** The reason the last refused refresh / request gave for the session being over (null when it gave none). */
let lastEndReason: string | null = null;
export const takeSessionEndReason = (): string | null => lastEndReason;

async function endReasonOf(response: Response): Promise<string | null> {
  const header = response.headers.get(SESSION_REASON_HEADER);
  if (header) return header;
  try {
    const body = await response.clone().json();
    return typeof body?.title === 'string' && body.title.startsWith('session.') ? body.title : null;
  } catch { return null; }
}

async function toError(response: Response): Promise<ApiError> {
  let code = `http.${response.status}`;
  let message = `${response.status} ${response.statusText}`.trim();
  try {
    const body = await response.json();
    if (body?.title) code = String(body.title);
    if (body?.detail) message = String(body.detail);
    else if (body?.error) message = String(body.error);
  } catch { /* not JSON: keep the status text */ }
  // Too many requests (rate limiting): the backend answers 429 without a body of its own.
  if (response.status === 429 && code.startsWith('http.')) {
    code = 'rate_limited';
    message = 'تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید.';
  }
  return { status: response.status, code, message };
}

/** Raised for 401 so the app can send the user back to the sign-in page. */
export const sessionEvents = new EventTarget();

async function send<T>(method: string, url: string, body?: unknown, retry = true): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {};
  // A FormData body (a file upload) sets its own multipart content type, with the boundary.
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  const token = tokenStore.access;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (isAuthUrl(url)) Object.assign(headers, sessionHeaders());
  // The server's idle clock moves only for requests the user caused (a click, a key, a scroll), never for polling.
  if (takeActivityFlag()) headers['X-Nexus-Activity'] = '1';

  let response: Response;
  try {
    response = await fetch(apiUrl(url), { method, headers, signal: AbortSignal.timeout(isForm ? 120000 : 20000), body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body) });
  } catch (err: any) {
    return { ok: false, error: { status: 0, code: 'network', message: err?.message || 'The server could not be reached.' } };
  }

  if (response.status === 401 && retry && token && !isSessionOpeningUrl(url)) {
    lastEndReason = await endReasonOf(response);
    if (await refreshSession()) return send<T>(method, url, body, false);
    tokenStore.clear();
    sessionEvents.dispatchEvent(new Event('expired'));
  }

  if (!response.ok) return { ok: false, error: await toError(response) };
  if (response.status === 204) return { ok: true, value: undefined as T };
  try {
    const text = await response.text();
    return { ok: true, value: (text ? JSON.parse(text) : undefined) as T };
  } catch {
    return { ok: false, error: { status: response.status, code: 'invalid_response', message: 'پاسخ سرور معتبر نیست. سرور فرانت و بک‌اند را دوباره اجرا کنید.' } };
  }
}

/** Fetches a file with the session's token and hands it to the browser to save (the backend names it in Content-Disposition). */
async function download(url: string, fallbackName: string, retry = true): Promise<ApiResult<void>> {
  const token = tokenStore.access;
  let response: Response;
  try {
    response = await fetch(apiUrl(url), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  } catch (err: any) {
    return { ok: false, error: { status: 0, code: 'network', message: err?.message || 'The server could not be reached.' } };
  }
  if (response.status === 401 && retry && token) {
    lastEndReason = await endReasonOf(response);
    if (await refreshSession()) return download(url, fallbackName, false);
    tokenStore.clear();
    sessionEvents.dispatchEvent(new Event('expired'));
  }
  if (!response.ok) return { ok: false, error: await toError(response) };

  const disposition = response.headers.get('content-disposition') || '';
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  const plain = /filename="?([^";]+)"?/i.exec(disposition)?.[1];
  let name = fallbackName;
  try { name = encoded ? decodeURIComponent(encoded) : plain || fallbackName; } catch { name = plain || fallbackName; }

  const objectUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  return { ok: true, value: undefined };
}

export const api = {
  download,
  get: <T>(url: string) => send<T>('GET', url),
  post: <T>(url: string, body?: unknown) => send<T>('POST', url, body ?? {}),
  put: <T>(url: string, body?: unknown) => send<T>('PUT', url, body ?? {}),
  patch: <T>(url: string, body?: unknown) => send<T>('PATCH', url, body ?? {}),
  delete: <T>(url: string) => send<T>('DELETE', url)
};

/** Builds `?a=1&b=2`, leaving out undefined/null/empty values. */
export function query(params: Record<string, string | number | boolean | null | undefined>): string {
  const parts = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

/** Unwraps a result or throws the backend's message (for call sites that just want to show it). */
export function must<T>(result: ApiResult<T>): T {
  if (result.ok) return result.value as T;
  throw new Error(result.error?.message || 'Request failed');
}
