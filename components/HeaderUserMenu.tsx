import React, { useEffect, useRef, useState } from 'react';
import { requestProfileTab } from '../tmpb/utils/profileEvents';

/** The signed-in user's button in the header; its menu opens the personal-information and password tabs. */
export function HeaderUserMenu({ name, onNavigate }: { name: string; onNavigate?: (page: string) => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close); };
  }, [open]);
  const go = (tab: 'avatar' | 'password') => { setOpen(false); requestProfileTab(tab); onNavigate?.('settings_profile'); };
  return <div className="pb-user-menu" ref={box}>
    <button type="button" className="pb-user-button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(value => !value)}>
      <span className="pb-user-avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
      <span className="pb-user-name">{name}</span>
      <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>
    </button>
    {open && <div className="pb-user-popover" role="menu">
      <button type="button" role="menuitem" autoFocus onClick={() => go('avatar')}><span className="material-symbols-outlined" aria-hidden="true">person</span>اطلاعات شخصی</button>
      <button type="button" role="menuitem" onClick={() => go('password')}><span className="material-symbols-outlined" aria-hidden="true">lock</span>تغییر رمز عبور</button>
    </div>}
  </div>;
}
