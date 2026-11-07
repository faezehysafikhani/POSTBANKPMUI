import React, { useContext, useEffect, useState } from 'react';
import { FeaturesHandbook } from './FeaturesHandbook';
import { refreshBranding } from '../tmpb/utils/branding';
import { ThemeContext } from '../context';
import { SettingsView } from '../tmpb/components/SettingsView';
import { AuthModal } from '../tmpb/components/AuthModal';
import type { AppColorPalette, AppTheme, User } from '../tmpb/types';
import { getSessionUser, updateMyPreferences, updateMyProfile } from '../tmpb/services/nexusApi';
import { ProjectSettingsPage } from '../pages/CorePages';
import referenceCss from '../tmpb/generated.css?inline';

// Keep the reference stylesheet active only while its screens are mounted.
// The original PM pages keep their own stylesheet and layout.
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

export function TmpbLogin({ onSuccess }: { onSuccess: () => void }) {
  useReferenceStyles();
  return <AuthModal isOpen canClose={false} onClose={() => {}} onSuccess={onSuccess}
    currentTheme="default" onThemeSelect={() => {}} />;
}

type Props = React.ComponentProps<typeof ProjectSettingsPage> & {
  onLogout: () => void;
  onProfileUpdated: (user: User) => void;
};

export function SettingsPage({ onLogout, onProfileUpdated, ...projectProps }: Props) {
  useReferenceStyles();
  const { theme, setTheme } = useContext(ThemeContext);
  const [user, setUser] = useState(getSessionUser);
  const [pattern, setPattern] = useState<AppTheme>(user?.theme || 'default');
  const [palette, setPalette] = useState<AppColorPalette>(user?.colorPalette || 'indigo');
  const [error, setError] = useState<string | null>(null);

  const preference = async (settings: Parameters<typeof updateMyPreferences>[0]) => {
    try {
      await updateMyPreferences(settings);
      setError(null);
      if (settings.theme) setPattern(settings.theme as AppTheme);
      if (settings.colorPalette) setPalette(settings.colorPalette as AppColorPalette);
      if (settings.themeMode) setTheme(settings.themeMode as 'light' | 'dark');
      setUser(getSessionUser());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ذخیره تنظیمات ممکن نشد.');
    }
  };

  return <div className={`content-container bg-pattern-${pattern} palette-${palette}`} dir="rtl">
    {error && <p role="alert">{error}</p>}
    <SettingsView projectHelp={<FeaturesHandbook />} themeMode={theme} setThemeMode={mode => void preference({ themeMode: mode })}
      appColorTheme={pattern} setAppColorTheme={next => void preference({ theme: next })}
      appColorPalette={palette} setAppColorPalette={next => void preference({ colorPalette: next })}
      totalTasksCount={0} currentUser={user} onLogout={onLogout} onOpenAuthModal={onLogout}
      onSaveProfile={async updates => {
        const saved = await updateMyProfile(updates);
        setUser(saved);
        onProfileUpdated(saved);
      }} />
    <details className="mt-6 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
      <summary className="cursor-pointer font-bold">تنظیمات اختصاصی مدیریت پروژه و گردش کار</summary>
      <ProjectSettingsPage {...projectProps} />
    </details>
  </div>;
}
