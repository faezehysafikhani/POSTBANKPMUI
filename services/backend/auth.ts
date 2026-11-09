import { api, refreshSession, takeSessionEndReason, tokenStore } from '../api';

export interface BackendUser {
  id: string;
  tenantId: string;
  email: string | null;
  displayName: string;
  isActive: boolean;
  lastLoginAtUtc: string | null;
  roles: string[];
  username: string | null;
  phoneNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  isSystem: boolean;
}

export interface Session {
  user: BackendUser;
  permissions: string[];
}

export interface Captcha {
  captchaId: string;
  imageDataUrl: string;
}

/** A session of the signed-in user, as the backend lists it (used when a sign-in reaches the concurrent-session limit). */
export interface BackendSession {
  id: string;
  deviceLabel: string | null;
  userAgent: string | null;
  lastIp: string | null;
  createdAtUtc: string;
  lastActivityAtUtc: string;
  isCurrent: boolean;
}

/** The sign-in stopped at the limit of open sessions: the user chooses which to close (the ticket lasts two minutes, once). */
export interface SessionLimit {
  ticket: string;
  maxConcurrent: number;
  mustClose: number;
  sessions: BackendSession[];
}

export type LoginOutcome =
  | { kind: 'ok'; session: Session }
  | { kind: 'captcha'; message: string }       // the next attempt must include a solved CAPTCHA
  | { kind: 'limit'; limit: SessionLimit }     // too many open sessions: close some, then complete the sign-in
  | { kind: 'failed'; message: string };

interface AuthBody {
  accessToken: string;
  refreshToken?: string | null;
  user: BackendUser;
  sessionLimit?: SessionLimit | null;
}

export async function requestCaptcha(): Promise<Captcha | null> {
  const result = await api.post<Captcha>('/api/identity/auth/captcha');
  return result.ok && result.value ? result.value : null;
}

async function openSession(body: AuthBody): Promise<LoginOutcome> {
  if (body.sessionLimit) return { kind: 'limit', limit: body.sessionLimit };
  tokenStore.set(body.accessToken, body.refreshToken);
  const session = await loadSession();
  return session ? { kind: 'ok', session } : { kind: 'failed', message: 'اطلاعات کاربر دریافت نشد.' };
}

export async function login(identifier: string, password: string, captcha?: { id: string; answer: string }): Promise<LoginOutcome> {
  const result = await api.post<AuthBody>('/api/identity/auth/login', {
    identifier,
    password,
    captchaId: captcha?.id,
    captchaAnswer: captcha?.answer
  });

  if (!result.ok || !result.value) {
    const error = result.error;
    return {
      kind: error?.code === 'unauthorized.captcha_required' ? 'captcha' : 'failed',
      message: error?.message || 'ورود انجام نشد.'
    };
  }
  return openSession(result.value);
}

/** Step 2 of a sign-in that stopped at the session limit: close the chosen sessions (or the oldest) and sign in. */
export async function completeLogin(ticket: string, choice: { closeSessionIds?: string[]; closeOldest?: boolean }): Promise<LoginOutcome> {
  const result = await api.post<AuthBody>('/api/identity/auth/login/complete', {
    ticket,
    closeSessionIds: choice.closeSessionIds,
    closeOldest: choice.closeOldest ?? false
  });
  if (!result.ok || !result.value) return { kind: 'failed', message: result.error?.message || 'ورود انجام نشد.' };
  return openSession(result.value);
}

/**
 * The signed-in user and what they may do, or null when there is no (valid) session. The access token is short-lived and
 * only lives in the page, so after a reload it is first renewed through the backend's refresh cookie.
 */
export async function loadSession(): Promise<Session | null> {
  if (!tokenStore.access && !(await refreshSession())) return null;
  const result = await api.get<{ user: BackendUser; permissions: string[] }>('/api/identity/auth/me');
  return result.ok && result.value ? { user: result.value.user, permissions: result.value.permissions } : null;
}

export async function logout(): Promise<void> {
  const hadSession = !!tokenStore.access;
  // The backend ends the session and removes the cookie; the token is dropped here either way.
  const refreshToken = tokenStore.refresh;
  if (hadSession) await api.post('/api/identity/auth/logout', refreshToken ? { refreshToken } : undefined);
  tokenStore.clear();
}

/** The live state of this session in seconds (it never counts as activity itself), for the "still there?" warning. */
export interface SessionStatus {
  idleTimeoutSeconds: number;
  idleRemainingSeconds: number;
  absoluteRemainingSeconds: number;
  idleWarningSeconds: number;
}

export async function sessionStatus(): Promise<SessionStatus | null> {
  const result = await api.get<SessionStatus>('/api/identity/auth/sessions/current');
  return result.ok && result.value ? result.value : null;
}

/** "Stay signed in": real activity, which restarts the idle clock. */
export async function keepSessionAlive(): Promise<boolean> {
  return (await api.post('/api/identity/auth/sessions/current/activity')).ok;
}

/** Why the last session ended (the backend's code), for the message on the sign-in page; forgotten once a new session opens. */
export const endReason = takeSessionEndReason;

export function endReasonText(code: string | null): string | null {
  switch (code) {
    case 'session.idle_expired': return 'به دلیل عدم فعالیت، نشست شما پایان یافت. دوباره وارد شوید.';
    case 'session.absolute_expired': return 'مدت مجاز نشست به پایان رسید. دوباره وارد شوید.';
    case 'session.revoked':
    case 'session.administrator': return 'نشست شما بسته شد. دوباره وارد شوید.';
    case 'session.concurrent_limit': return 'نشست شما برای باز شدن نشست دیگری بسته شد. دوباره وارد شوید.';
    case 'session.credentials_changed': return 'اطلاعات ورود شما تغییر کرد. دوباره وارد شوید.';
    case 'session.account_disabled': return 'حساب شما غیرفعال شده است.';
    case 'session.reuse_detected': return 'نشست به دلایل امنیتی بسته شد. دوباره وارد شوید.';
    default: return null;
  }
}
