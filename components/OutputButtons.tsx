import React, { useState } from 'react';
import { pdfReport, printReport } from './reports/reportOutput';

const stamp = () => {
  const p = new Intl.DateTimeFormat('en-US-u-ca-persian', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const get = (t: string) => p.find(x => x.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
};

/**
 * «چاپ» and «PDF» for any page or form: both use the report sheet (Post Bank letterhead, faint logo, date, time and
 * the IP of this computer). target returns the element to output; fields are written out with their current values.
 */
export function OutputButtons({ target, title, kind, fileBase, compact = false }: {
  target: () => HTMLElement | null; title: () => string; kind?: () => string; fileBase: string; compact?: boolean;
}) {
  const [busy, setBusy] = useState<'' | 'print' | 'pdf'>('');
  async function run(what: 'print' | 'pdf') {
    const el = target(); if (!el || busy) return;
    const meta = { title: title(), kind: kind?.() ?? '' };
    setBusy(what);
    try {
      if (what === 'print') await printReport(el, meta);
      else await pdfReport(el, meta, `${fileBase}-${stamp()}.pdf`);
    } catch (err) { console.error(err); window.alert('ساخت خروجی انجام نشد. دوباره تلاش کنید.'); }
    finally { setBusy(''); }
  }
  return <div className={`pb-output-buttons no-print${compact ? ' compact' : ''}`} role="group" aria-label="خروجی">
    <button type="button" className="pb-output-btn" onClick={() => run('print')} disabled={!!busy} title="چاپ با سربرگ، تاریخ، ساعت و IP" aria-label="چاپ">
      <span className="material-symbols-outlined" aria-hidden="true">print</span>{!compact && <span>{busy === 'print' ? 'آماده‌سازی…' : 'چاپ'}</span>}</button>
    <button type="button" className="pb-output-btn pdf" onClick={() => run('pdf')} disabled={!!busy} title="دریافت PDF با سربرگ، تاریخ، ساعت و IP" aria-label="PDF">
      <span className="material-symbols-outlined" aria-hidden="true">{busy === 'pdf' ? 'hourglass_top' : 'picture_as_pdf'}</span>{!compact && <span>{busy === 'pdf' ? 'در حال ساخت…' : 'PDF'}</span>}</button>
  </div>;
}
