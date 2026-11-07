import React, { useEffect, useId, useRef } from 'react';

type CreationKind = 'waterfall' | 'agile' | 'action';
const content = {
  waterfall: { title: 'ایجاد پروژه آبشاری', description: 'تعریف منشور، ساختار شکست کار و برنامه زمان‌بندی پروژه', icon: 'account_tree', label: 'آبشاری', model: 'برنامه‌ریزی مرحله‌ای' },
  agile: { title: 'ایجاد پروژه چابک', description: 'تعریف منشور، اسپرینت‌ها و برنامه همکاری تیم پروژه', icon: 'sync_alt', label: 'چابک', model: 'اسپرینت و بک‌لاگ' },
  action: { title: 'تعریف اقدام جدید', description: 'ثبت اطلاعات اقدام، مسئول اجرا و مسیر تأیید', icon: 'add_task', label: 'اقدام', model: 'پیگیری اجرای اقدام' },
};

export function CreationDialog({ kind, onClose, children }: { kind: CreationKind; onClose: () => void; children: React.ReactNode }) {
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
      <div className="creation-dialog-hero">
        <div className="creation-dialog-title"><span className="creation-dialog-eyebrow">پست بانک ایران · مدیریت پروژه‌ها</span><h2 id={titleId}>{details.title}</h2><p id={descriptionId}>{details.description}</p></div>
        <span className="creation-kind-badge"><span className="material-symbols-outlined" aria-hidden="true">{details.icon}</span>{details.label}</span>
        <button type="button" className="creation-dialog-close" onClick={onClose} aria-label="بستن فرم" autoFocus><span className="material-symbols-outlined" aria-hidden="true">close</span></button>
      </div>
      <div className="creation-dialog-facts" aria-label="اطلاعات فرم">
        <div><span className="creation-fact-icon material-symbols-outlined" aria-hidden="true">edit_note</span><span><small>مرحله ثبت</small><strong>تعریف اولیه</strong></span></div>
        <div><span className="creation-fact-icon material-symbols-outlined" aria-hidden="true">calendar_month</span><span><small>مدل برنامه‌ریزی</small><strong>{details.model}</strong></span></div>
        <div><span className="creation-fact-icon material-symbols-outlined" aria-hidden="true">verified_user</span><span><small>کنترل اطلاعات</small><strong>تکمیل فیلدهای ضروری</strong></span></div>
      </div>
      <div className="creation-dialog-form">{children}</div>
    </div>
    <div data-creation-modal-root />
  </dialog>;
}
