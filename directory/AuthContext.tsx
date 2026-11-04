import * as React from 'react';
import { completeLogin, endReason, endReasonText, login as apiLogin, loadSession, logout as apiLogout, requestCaptcha } from '../services/backend/auth';
import type { Captcha, LoginOutcome, Session, SessionLimit } from '../services/backend/auth';
import { sessionEvents } from '../services/api';

/**
 * Who is signed in. The backend decides everything about a session (tokens, permissions, CAPTCHA after a failed
 * attempt); this only keeps the answer and offers `can()` for showing or hiding controls - never for enforcing anything.
 */
interface AuthState {
  session: Session | null;
  /** True until the stored session (if any) has been checked once. */
  restoring: boolean;
  captcha: Captcha | null;
  /** Set when a sign-in reached the limit of open sessions: the user must choose what to close (see `completeSignIn`). */
  sessionLimit: SessionLimit | null;
  /** Why the last session ended (from the backend), to tell the user on the sign-in page. */
  endMessage: string | null;
  signIn: (identifier: string, password: string, captchaAnswer?: string) => Promise<{ ok: boolean; message?: string }>;
  completeSignIn: (choice: { closeSessionIds?: string[]; closeOldest?: boolean }) => Promise<{ ok: boolean; message?: string }>;
  cancelSessionLimit: () => void;
  signOut: () => Promise<void>;
  refreshCaptcha: () => Promise<void>;
  can: (permission: string) => boolean;
}

const AuthContext = React.createContext<AuthState>(null as unknown as AuthState);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = React.useState<Session | null>(null);
  const [restoring, setRestoring] = React.useState(true);
  const [captcha, setCaptcha] = React.useState<Captcha | null>(null);
  const [sessionLimit, setSessionLimit] = React.useState<SessionLimit | null>(null);
  const [endMessage, setEndMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    loadSession().then(restored => {
      if (!cancelled) {
        // A stored session that the backend has ended says why (idle timeout, closed by an administrator, ...).
        if (!restored) setEndMessage(current => endReasonText(endReason()) ?? current);
        setSession(restored);
        setRestoring(false);
      }
    });
    const expired = () => {
      setEndMessage(current => endReasonText(endReason()) ?? current);
      setSession(null);
    };
    sessionEvents.addEventListener('expired', expired);
    return () => {
      cancelled = true;
      sessionEvents.removeEventListener('expired', expired);
    };
  }, []);

  const refreshCaptcha = React.useCallback(async () => setCaptcha(await requestCaptcha()), []);

  /** What to do with the backend's answer to a sign-in (or to its second step). */
  const settle = React.useCallback((outcome: LoginOutcome): { ok: boolean; message?: string } => {
    if (outcome.kind === 'ok') {
      setCaptcha(null);
      setSessionLimit(null);
      setEndMessage(null);
      setSession(outcome.session);
      return { ok: true };
    }
    if (outcome.kind === 'limit') {
      setSessionLimit(outcome.limit);
      return { ok: false };
    }
    return { ok: false, message: outcome.message };
  }, []);

  const signIn = React.useCallback(async (identifier: string, password: string, captchaAnswer?: string) => {
    const outcome = await apiLogin(identifier, password, captcha && captchaAnswer ? { id: captcha.captchaId, answer: captchaAnswer } : undefined);
    const settled = settle(outcome);
    // After a failed attempt the backend wants a solved CAPTCHA for the next one (and a fresh image each time).
    if (!settled.ok && outcome.kind !== 'limit' && (outcome.kind === 'captcha' || captcha)) await refreshCaptcha();
    return settled;
  }, [captcha, refreshCaptcha, settle]);

  const completeSignIn = React.useCallback(async (choice: { closeSessionIds?: string[]; closeOldest?: boolean }) => {
    if (!sessionLimit) return { ok: false };
    const outcome = await completeLogin(sessionLimit.ticket, choice);
    if (outcome.kind === 'failed') setSessionLimit(null); // the ticket is single-use and short: start the sign-in again
    return settle(outcome);
  }, [sessionLimit, settle]);

  const cancelSessionLimit = React.useCallback(() => setSessionLimit(null), []);

  const signOut = React.useCallback(async () => {
    await apiLogout();
    setSession(null);
    setCaptcha(null);
    setEndMessage(null);
  }, []);

  const can = React.useCallback((permission: string) => !!session?.permissions.includes(permission), [session]);

  const value = React.useMemo(
    () => ({ session, restoring, captcha, sessionLimit, endMessage, signIn, completeSignIn, cancelSessionLimit, signOut, refreshCaptcha, can }),
    [session, restoring, captcha, sessionLimit, endMessage, signIn, completeSignIn, cancelSessionLimit, signOut, refreshCaptcha, can]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => React.useContext(AuthContext);
