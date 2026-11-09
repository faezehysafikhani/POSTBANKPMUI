import React, { useEffect, useState } from 'react';
import { FeaturesHandbook } from './FeaturesHandbook';
import { refreshBranding } from '../tmpb/utils/branding';
import { SettingsView } from '../tmpb/components/SettingsView';
import type { User } from '../tmpb/types';
import { adoptExternalSession, forgetExternalSession, getSessionUser, updateMyProfile } from '../tmpb/services/nexusApi';
import { refreshSession, tokenStore } from '../services/api';
import referenceCss from '../tmpb/generated.css?inline';

// The reference stylesheet is active only while its screens are mounted; the product's own pages keep their stylesheet.
function useReferenceStyles() {
  useEffect(() => {
    const style = document.createElement('style');
    style.dataset.tmpbSettings = 'true';
    style.textContent = referenceCss;
    document.head.appendChild(style);
    void refreshBranding();
    return () => style.remove();
  }, []);
}

/**
 * The reference screens talk to the backend with their own client. The product has already signed the person in, so
 * the client adopts that session once (same cookie, same backend) and is cleared when the person signs out.
 */
function useAdoptedSession(userId: string): { user: User | null; failed: boolean } {
  const [user, setUser] = useState<User | null>(() => {
    const known = getSessionUser();
    return known && known.id === userId ? known : null;
  });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (user) return;
    let cancelled = false;
    const access = tokenStore.access;
    if (!access) { setFailed(true); return; }
    void adoptExternalSession(access, async () => ((await refreshSession()) ? tokenStore.access : null)).then(adopted => {
      if (cancelled) return;
      if (adopted && adopted.id === userId) setUser(adopted); else setFailed(true);
    });
    return () => { cancelled = true; };
  }, [user, userId]);

  return { user, failed };
}

/** Call when the product signs the person out. */
export const clearReferenceSession = forgetExternalSession;

type Props = {
  /** The signed-in person's identity (a GUID), as the backend knows it. */
  userId: string;
  onLogout: () => void;
  /** The project-management product's own settings, shown as a tab. Absent: no such tab. */
  projectSettings?: React.ReactNode;
};

export function SettingsAndProfile({ userId, onLogout, projectSettings }: Props) {
  useReferenceStyles();
  const { user, failed } = useAdoptedSession(userId);
  const [current, setCurrent] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setCurrent(user);
  }, [user]);

  if (failed) return <div className="content-container" dir="rtl" role="alert">بارگذاری تنظیمات ممکن نشد. دوباره وارد شوید.</div>;
  if (!current) return <div className="content-container" dir="rtl">در حال بارگذاری…</div>;

  return <div className="tw-scope settings-profile-page" dir="rtl">
    {error && <p role="alert">{error}</p>}
    <SettingsView projectHelp={<FeaturesHandbook />} projectSettings={projectSettings}
      themeMode="light" setThemeMode={() => {}} appColorTheme="default" setAppColorTheme={() => {}}
      appColorPalette="indigo" setAppColorPalette={() => {}}
      totalTasksCount={0} currentUser={current} onLogout={onLogout} onOpenAuthModal={onLogout}
      onSaveProfile={async updates => { setCurrent(await updateMyProfile(updates)); }} />
  </div>;
}
