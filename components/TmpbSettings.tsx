import React, { useContext, useEffect, useState } from 'react';
import { FeaturesHandbook } from './FeaturesHandbook';
import { refreshBranding } from '../tmpb/utils/branding';
import { ThemeContext } from '../context';
import { SettingsView } from '../tmpb/components/SettingsView';
import { AuthModal } from '../tmpb/components/AuthModal';
import type { AppColorPalette, AppTheme, User } from '../tmpb/types';
import { getSessionUser, updateMyPreferences, updateMyProfile } from '../tmpb/services/nexusApi';
import { ProjectSettingsTabs } from './ProjectSettingsTabs';
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

type ProjectTabsProps = React.ComponentProps<typeof ProjectSettingsTabs>;

type Props = {
  onLogout: () => void;
  onProfileUpdated: (user: User) => void;
  /** Whether the signed-in person may see the project-management settings tab. */
  canManageProject: boolean;
  project: ProjectTabsProps;
};

export function SettingsPage({ onLogout, onProfileUpdated, canManageProject, project }: Props) {
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
    <SettingsView projectHelp={<FeaturesHandbook />} projectSettings={canManageProject ? <ProjectSettingsTabs {...project} /> : undefined} themeMode={theme} setThemeMode={mode => void preference({ themeMode: mode })}
      appColorTheme={pattern} setAppColorTheme={next => void preference({ theme: next })}
      appColorPalette={palette} setAppColorPalette={next => void preference({ colorPalette: next })}
      totalTasksCount={0} currentUser={user} onLogout={onLogout} onOpenAuthModal={onLogout}
      onSaveProfile={async updates => {
        const saved = await updateMyProfile(updates);
        setUser(saved);
        onProfileUpdated(saved);
      }} />
  </div>;
}
