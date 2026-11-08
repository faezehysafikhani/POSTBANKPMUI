import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types';
import { personalEvents } from '../services/backend/events';
import { SettingsTabs, NavigationTab } from './SettingsNavigation';
import { ShamsiDatePicker } from './ShamsiDatePicker';
import { tehranDateTime } from './managementCalendar';

const tabs: NavigationTab[] = [
  { id:'details', label:'مشخصات رویداد', icon:'document' }, { id:'people', label:'افراد مرتبط', icon:'users' },
  { id:'agenda', label:'دستور جلسه', icon:'document' }, { id:'minutes', label:'صورتجلسه و اقدامات', icon:'message' },
  { id:'reminder', label:'یادآوری', icon:'message' }, { id:'tasks', label:'ارتباط با وظایف', icon:'admin' },
];
export function ManagementEventDialog({ date, user, onClose, onSaved }: { date:string; user:User; onClose:()=>void; onSaved:(date:string)=>void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState('details');
  const [title, setTitle] = useState(''); const [eventDate, setEventDate] = useState(date);
  const [start, setStart] = useState('09:00'); const [end, setEnd] = useState('10:00');
  const [description, setDescription] = useState(''); const [reminder, setReminder] = useState('15');
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  useEffect(() => {
    const element = dialog.current!; const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element.showModal(); document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (saving) return;
    setError('');
    try {
      if (!title.trim()) { setTab('details'); throw new Error('عنوان رویداد را وارد کنید.'); }
      const startAtUtc = tehranDateTime(eventDate, start); const endAtUtc = tehranDateTime(eventDate, end);
      if (endAtUtc <= startAtUtc) { setTab('details'); throw new Error('ساعت پایان باید بعد از ساعت شروع باشد.'); }
      setSaving(true);
      const result = await personalEvents.create({ title:title.trim(), description:description.trim() || null, startAtUtc, endAtUtc, reminderMinutesBefore:reminder ? Number(reminder) : null });
      if (!result.ok) throw new Error(result.error?.message || 'ذخیره رویداد انجام نشد. دوباره تلاش کنید.');
      onSaved(eventDate);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'ذخیره رویداد انجام نشد.'); }
    finally { setSaving(false); }
  }
  return <dialog ref={dialog} className="management-event-dialog" dir="rtl" aria-labelledby="management-event-title" onCancel={event => { event.preventDefault(); if (!saving) onClose(); }}>
    <form onSubmit={submit} className="management-event-form">
      <div className="management-event-header"><div><small>تقویم مدیریتی · پست بانک ایران</small><h2 id="management-event-title">رویداد جدید</h2></div><button type="button" className="mg-icon-button" onClick={onClose} disabled={saving} aria-label="بستن فرم رویداد" autoFocus><span className="material-symbols-outlined" aria-hidden="true">close</span></button></div>
      {error && <p role="alert" className="mg-error">{error}</p>}
      <div className="management-event-body"><SettingsTabs tabs={tabs} selected={tab} onSelect={setTab} label="بخش‌های رویداد">
        <fieldset disabled={saving} className="management-event-fields">
          {tab === 'details' && <>
            <label className="mg-field full">عنوان رویداد *<input type="text" value={title} onChange={e=>{setTitle(e.target.value);setError('');}} maxLength={250} placeholder="عنوان جلسه یا رویداد" /></label>
            <label className="mg-field">نوع رویداد<input type="text" value="رویداد شخصی" readOnly /></label>
            <label className="mg-field">برگزارکننده<input type="text" value={user.name || user.username} readOnly /></label>
            <div className="mg-field"><label htmlFor="management-event-date">تاریخ شمسی *</label><ShamsiDatePicker id="management-event-date" name="management-event-date" value={eventDate} onChange={setEventDate} required /></div>
            <label className="mg-field">ساعت شروع *<input type="time" value={start} onChange={e=>setStart(e.target.value)} /></label>
            <label className="mg-field">ساعت پایان *<input type="time" value={end} onChange={e=>setEnd(e.target.value)} /></label>
            <label className="mg-field full">توضیحات<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} placeholder="توضیحات یا دستور جلسه…" /></label>
          </>}
          {tab === 'people' && <div className="mg-event-placeholder full"><span className="material-symbols-outlined">person</span><h3>{user.name || user.username}</h3><p>این رویداد در تقویم شخصی شما ثبت می‌شود. دعوت همکاران در مرحله بعد اضافه می‌شود.</p></div>}
          {tab === 'agenda' && <label className="mg-field full">توضیحات و دستور جلسه<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={6} placeholder="موضوعات و یادداشت‌های رویداد را بنویسید…" /></label>}
          {tab === 'reminder' && <label className="mg-field full">زمان یادآوری<select value={reminder} onChange={e=>setReminder(e.target.value)}><option value="">بدون یادآوری</option><option value="5">۵ دقیقه قبل</option><option value="15">۱۵ دقیقه قبل</option><option value="30">۳۰ دقیقه قبل</option><option value="60">یک ساعت قبل</option><option value="1440">یک روز قبل</option></select><span className="mg-muted">یادآوری از سرویس رویدادهای سامانه ارسال می‌شود.</span></label>}
          {(tab === 'minutes' || tab === 'tasks') && <div className="mg-event-placeholder full"><span className="material-symbols-outlined">description</span><h3>{tab === 'minutes' ? 'صورتجلسه و اقدامات' : 'ارتباط با وظایف'}</h3><p>محتوای این بخش در مرحله بعد اضافه می‌شود.</p></div>}
        </fieldset>
      </SettingsTabs></div>
      <div className="management-event-footer"><button type="submit" className="save-btn" disabled={saving}><span className="material-symbols-outlined" aria-hidden="true">save</span>{saving?'در حال ذخیره…':'ذخیره رویداد'}</button><button type="button" className="cancel-btn" onClick={onClose} disabled={saving}>انصراف</button><span className="mg-muted">ساعت‌ها به وقت تهران هستند.</span></div>
    </form>
  </dialog>;
}
