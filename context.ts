
import * as React from 'react';
import { i18nStrings, type Language, type TranslationKey } from './pages';

export const LocalizationContext = React.createContext({
  language: 'en' as Language,
  setLanguage: (lang: Language) => {},
  t: (key: TranslationKey, params?: Record<string, any>): string => key as string,
});

export const LocalizationProvider = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  const [language, setLanguage] = React.useState<Language>('fa');

  React.useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
  }, [language]);

  const t = React.useCallback((key: TranslationKey, params?: Record<string, any>): string => {
    let str = i18nStrings[language][key] || i18nStrings['en'][key] || key;
    if (params) {
      Object.keys(params).forEach(pKey => {
        str = str.replace(`{{${pKey}}}`, params[pKey]);
      });
    }
    return str as string;
  }, [language]);

  const value = React.useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return React.createElement(LocalizationContext.Provider, { value: value }, children);
};

export type ColorScheme = 'teal' | 'blue' | 'emerald' | 'purple' | 'crimson';

export const ThemeContext = React.createContext({
  theme: 'light' as 'light' | 'dark',
  setTheme: (theme: 'light' | 'dark') => {},
  colorScheme: 'emerald' as ColorScheme,
  setColorScheme: (scheme: ColorScheme) => {},
});

// A fixed light identity also migrates previously saved dark preferences.
export const ThemeProvider = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.setAttribute('data-color-scheme', 'emerald');
    document.body.classList.remove('dark-theme');
    try { localStorage.setItem('pms_theme', 'light'); localStorage.setItem('pms_color_scheme', 'emerald'); } catch {}
  }, []);
  const value = React.useMemo(() => ({ theme: 'light' as 'light' | 'dark', setTheme: (_theme: 'light' | 'dark') => {}, colorScheme: 'emerald' as ColorScheme, setColorScheme: (_scheme: ColorScheme) => {} }), []);
  return React.createElement(ThemeContext.Provider, { value }, children);
};
