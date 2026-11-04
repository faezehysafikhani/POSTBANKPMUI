import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { LocalizationContext } from '../context';
import { keepSessionAlive, sessionStatus } from '../services/backend/auth';
import type { SessionLimit } from '../services/backend/auth';
import { useAuth } from '../directory/AuthContext';

/**
 * Sessions belong to the backend: it counts them, decides the limit and the idle timeout, and ends a session. These two
 * screens only show what it says and send the user's choice back.
 */

/** A sign-in that reached the limit of open sessions: choose which to close, or close the oldest, then sign in. */
export const SessionLimitModal = ({ limit, onChoose, onCancel }: {
  limit: SessionLimit;
  onChoose: (choice: { closeSessionIds?: string[]; closeOldest?: boolean }) => Promise<{ ok: boolean; message?: string }>;
  onCancel: () => void;
}): ReactElement => {
  const { language } = useContext(LocalizationContext);
  const fa = language === 'fa';
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  const submit = async (choice: { closeSessionIds?: string[]; closeOldest?: boolean }) => {
    setBusy(true);
    const outcome = await onChoose(choice);
    setBusy(false);
    if (!outcome.ok) setMessage(outcome.message ?? null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px' }} role="dialog" aria-modal="true" id="session-limit-dialog">
        <div className="modal-header">
          <h3>{fa ? 'تعداد نشست‌های باز به حد مجاز رسیده است' : 'You have reached the limit of open sessions'}</h3>
        </div>
        <div className="modal-body">
          <p>
            {fa
              ? `حداکثر ${limit.maxConcurrent} نشست هم‌زمان مجاز است. برای ورود، دست‌کم ${limit.mustClose} نشست را ببندید.`
              : `At most ${limit.maxConcurrent} sessions may be open at once. Close at least ${limit.mustClose} to sign in.`}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {limit.sessions.map(item => (
              <label key={item.id} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} />
                <span>{item.deviceLabel || item.userAgent || (fa ? 'دستگاه ناشناس' : 'Unknown device')}</span>
                <span style={{ opacity: 0.7 }}>{item.lastIp ?? ''}</span>
                <span style={{ opacity: 0.7 }}>{new Date(item.lastActivityAtUtc).toLocaleString(fa ? 'fa-IR' : 'en-US')}</span>
              </label>
            ))}
          </div>
          {message && <p style={{ color: 'var(--danger-color, #c0392b)' }}>{message}</p>}
        </div>
        <div className="modal-footer" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button className="action-button secondary" disabled={busy} onClick={onCancel}>{fa ? 'انصراف' : 'Cancel'}</button>
          <button className="action-button secondary" disabled={busy} onClick={() => void submit({ closeOldest: true })}>
            {fa ? 'بستن قدیمی‌ترین نشست‌ها' : 'Close the oldest'}
          </button>
          <button className="action-button" disabled={busy || selected.length < limit.mustClose} onClick={() => void submit({ closeSessionIds: selected })}>
            {fa ? 'بستن موارد انتخاب‌شده و ورود' : 'Close selected and sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Warns before the session ends from inactivity. The countdown comes from the backend (its call never counts as
 * activity); "stay signed in" is real activity, which restarts the backend's idle clock.
 */
export const SessionWatcher = (): ReactElement | null => {
  const { language } = useContext(LocalizationContext);
  const auth = useAuth();
  const fa = language === 'fa';
  const [remaining, setRemaining] = useState<number | null>(null);
  const warnAt = useRef(120);
  const signedIn = !!auth.session;

  const poll = useCallback(async () => {
    const status = await sessionStatus();
    if (!status) return;
    warnAt.current = status.idleWarningSeconds;
    setRemaining(status.idleRemainingSeconds <= status.idleWarningSeconds ? status.idleRemainingSeconds : null);
  }, []);

  useEffect(() => {
    if (!signedIn) { setRemaining(null); return; }
    void poll();
    const timer = setInterval(() => void poll(), 15000);
    return () => clearInterval(timer);
  }, [signedIn, poll]);

  // Between polls the visible count goes down by itself; the next poll corrects it from the backend.
  useEffect(() => {
    if (remaining === null) return;
    const tick = setTimeout(() => setRemaining(current => (current === null ? null : Math.max(0, current - 1))), 1000);
    return () => clearTimeout(tick);
  }, [remaining]);

  if (!signedIn || remaining === null) return null;

  const stay = async () => {
    if (await keepSessionAlive()) setRemaining(null);
    void poll();
  };
  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, '0');

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-content" style={{ maxWidth: '460px' }} role="alertdialog" aria-modal="true" id="session-idle-warning">
        <div className="modal-header"><h3>{fa ? 'آیا هنوز پشت سیستم هستید؟' : 'Are you still there?'}</h3></div>
        <div className="modal-body">
          <p>
            {fa
              ? `به دلیل عدم فعالیت، نشست شما تا ${minutes}:${seconds} دیگر بسته می‌شود.`
              : `Your session will end for inactivity in ${minutes}:${seconds}.`}
          </p>
        </div>
        <div className="modal-footer" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button className="action-button" onClick={() => void stay()}>{fa ? 'ادامه می‌دهم' : 'Stay signed in'}</button>
        </div>
      </div>
    </div>
  );
};
