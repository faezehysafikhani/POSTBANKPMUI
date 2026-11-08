import React, { useState } from 'react';

export type WorkspaceTheme = 'green' | 'purple' | 'black' | 'blue' | 'red';
const KEY = 'pb_workspace_theme';
const THEMES: { id: WorkspaceTheme; label: string }[] = [
  { id: 'green', label: 'تم سبز' },
  { id: 'purple', label: 'تم بنفش' },
  { id: 'black', label: 'تم مشکی' },
  { id: 'blue', label: 'تم آبی' },
  { id: 'red', label: 'تم قرمز' },
];
const isTheme = (value: unknown): value is WorkspaceTheme => THEMES.some(t => t.id === value);

function readTheme(): WorkspaceTheme {
  try { const saved = localStorage.getItem(KEY); if (isTheme(saved)) return saved; } catch {}
  return 'green';
}
function setTheme(theme: WorkspaceTheme) {
  document.documentElement.dataset.pbTheme = theme;
  try { localStorage.setItem(KEY, theme); } catch {}
}
export function applyStoredWorkspaceTheme() { document.documentElement.dataset.pbTheme = readTheme(); }

/** Three swatches in the header; the choice is kept per browser. */
export function WorkspaceThemeSwitch() {
  const [theme, setCurrent] = useState<WorkspaceTheme>(() => isTheme(document.documentElement.dataset.pbTheme) ? document.documentElement.dataset.pbTheme as WorkspaceTheme : readTheme());
  return <div className="pb-theme-switch" role="group" aria-label="انتخاب تم سامانه">
    {THEMES.map(item => <button key={item.id} type="button" data-theme-option={item.id} aria-pressed={theme === item.id} aria-label={item.label} title={item.label}
      onClick={() => { setTheme(item.id); setCurrent(item.id); }} />)}
  </div>;
}
