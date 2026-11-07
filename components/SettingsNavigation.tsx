import React, { useId, useRef, useState } from 'react';

export type SettingsIconName = 'user' | 'users' | 'palette' | 'document' | 'message' | 'admin' | 'lock' | 'chevron';
const paths: Record<SettingsIconName, React.ReactNode> = {
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M17 5a3 3 0 0 1 0 6M19 15a5 5 0 0 1 3 5"/></>,
  palette: <><path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-3.7 1.5 1.5 0 0 1 .8-2.8H17a4 4 0 0 0 4-4C21 6.4 17 3 12 3Z"/><circle cx="7.5" cy="10" r=".8"/><circle cx="11" cy="6.8" r=".8"/><circle cx="15.5" cy="8" r=".8"/></>,
  document: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6M8 13h8M8 17h6"/></>,
  message: <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2ZM7 8h10M7 12h7"/>,
  admin: <><circle cx="9" cy="7" r="3"/><path d="M2 20v-2a7 7 0 0 1 10-6M17 12l5 2v3c0 3-5 5-5 5s-5-2-5-5v-3ZM15 17l1.5 1.5L19 16"/></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
  chevron: <path d="m6 9 6 6 6-6"/>,
};
export function SettingsIcon({ name }: { name: SettingsIconName }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
export interface NavigationTab { id: string; label: string; icon?: SettingsIconName }

// Horizontal RTL tabs: arrows follow the visual direction; Home/End reach the ends.
export function SettingsTabs({ tabs, selected, onSelect, label, children, secondary = false }: {
  tabs: NavigationTab[]; selected: string; onSelect: (id: string) => void;
  label: string; children: React.ReactNode; secondary?: boolean;
}) {
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  function move(event: React.KeyboardEvent, index: number) {
    let next: number;
    switch (event.key) {
      case 'ArrowLeft': next = (index + 1) % tabs.length; break;
      case 'ArrowRight': next = (index - 1 + tabs.length) % tabs.length; break;
      case 'Home': next = 0; break;
      case 'End': next = tabs.length - 1; break;
      default: return;
    }
    event.preventDefault(); onSelect(tabs[next].id); buttons.current[next]?.focus();
  }
  return <div className={secondary ? 'sp-tab-section sp-secondary' : 'sp-tab-section'}>
    <div className="sp-tab-list" role="tablist" aria-label={label} aria-orientation="horizontal">
      {tabs.map((tab, index) => <button key={tab.id} ref={element => { buttons.current[index] = element; }}
        type="button" role="tab" id={`${id}-tab-${tab.id}`} aria-selected={selected === tab.id}
        aria-controls={`${id}-panel-${tab.id}`} tabIndex={selected === tab.id ? 0 : -1}
        className={`sp-tab ${selected === tab.id ? 'is-active' : ''}`} onClick={() => onSelect(tab.id)} onKeyDown={event => move(event, index)}>
        {tab.icon && <SettingsIcon name={tab.icon}/>}<span>{tab.label}</span>
      </button>)}
    </div>
    {tabs.map(tab => <div key={tab.id} role="tabpanel" id={`${id}-panel-${tab.id}`} aria-labelledby={`${id}-tab-${tab.id}`}
      hidden={selected !== tab.id} tabIndex={0} className="sp-tab-panel">{selected === tab.id && children}</div>)}
  </div>;
}

export function SettingsAccordion({ title, icon, children }: { title: string; icon: SettingsIconName; children: React.ReactNode }) {
  const [open, setOpen] = useState(false); const id = useId();
  return <section className={`sp-accordion ${open ? 'is-open' : ''}`}>
    <h3><button type="button" id={`${id}-heading`} aria-expanded={open} aria-controls={`${id}-body`} onClick={() => setOpen(value => !value)}>
      <span className="sp-accordion-icon"><SettingsIcon name={icon}/></span><span>{title}</span><span className="sp-chevron"><SettingsIcon name="chevron"/></span>
    </button></h3>
    <div hidden={!open} id={`${id}-body`} role="region" aria-labelledby={`${id}-heading`} className="sp-accordion-body">{children}</div>
  </section>;
}
