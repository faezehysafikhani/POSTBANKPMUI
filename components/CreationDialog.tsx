import React, { useEffect, useId, useRef } from 'react';
import { OutputButtons } from './OutputButtons';

type CreationKind = 'waterfall' | 'agile' | 'action';
const content = {
  waterfall: { title: 'ایجاد پروژه آبشاری', description: 'تعریف منشور، ساختار شکست کار و برنامه زمان‌بندی پروژه' },
  agile: { title: 'ایجاد پروژه چابک', description: 'تعریف منشور، اسپرینت‌ها و برنامه همکاری تیم پروژه' },
  action: { title: 'تعریف اقدام جدید', description: 'ثبت اطلاعات اقدام، مسئول اجرا و مسیر تأیید' },
};

export function CreationDialog({ kind, onClose, children }: { kind: CreationKind; onClose: () => void; children: (actions: React.ReactNode) => React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId(); const descriptionId = useId();
  const details = content[kind];
  useEffect(() => {
    const element = dialog.current!;
    const oldFocus = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    element.showModal(); document.body.style.overflow = 'hidden';
    return () => {
      element.close(); document.body.style.overflow = oldOverflow;
      requestAnimationFrame(() => {
        if (oldFocus?.isConnected) oldFocus.focus();
        else document.querySelector<HTMLButtonElement>(`[data-create-kind="${kind}"]`)?.focus();
      });
    };
  }, []);
  return <dialog ref={dialog} className="creation-dialog" dir="rtl" aria-labelledby={titleId} aria-describedby={descriptionId}
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="creation-dialog-shell">
      <h2 id={titleId} className="creation-dialog-sr-title">{details.title}</h2>
      <p id={descriptionId} className="creation-dialog-sr-title">{details.description}</p>
      <div className="creation-dialog-form">{children(<>
        <button type="button" className="creation-dialog-close" onClick={onClose} aria-label="بستن فرم" autoFocus><span className="material-symbols-outlined" aria-hidden="true">close</span></button>
        <OutputButtons compact fileBase={kind === 'action' ? 'action-form' : `${kind}-project-form`}
          target={() => dialog.current?.querySelector<HTMLElement>('.creation-dialog-form') ?? null}
          title={() => dialog.current?.querySelector('.creation-dialog-form .page-header h2')?.textContent?.trim() || details.title}
          kind={() => { const tab = dialog.current?.querySelector('.tabs-nav .tab-item.active, [role="tab"][aria-selected="true"]')?.textContent?.trim(); return tab ? `بخش: ${tab}` : ''; }} />
      </>)}</div>
    </div>
    <div data-creation-modal-root />
  </dialog>;
}
