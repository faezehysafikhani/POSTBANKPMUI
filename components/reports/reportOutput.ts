// Print and PDF of a report. Both put the same sheet together: the Post Bank logo and title on top, the date,
// time and IP address of the computer making the output, the active filters, the report itself, and a very faint
// logo behind it. Print uses the browser's print (the faint logo and the header line repeat on every page);
// PDF is a real file made with html2canvas + jsPDF, so Persian text keeps the app's own font and shaping.
// Nothing is fetched from the internet: the logo is served by the app and the IP comes from the app's own server.
import './report-output.css';

const LOGO = '/post-bank-iran-logo.png';
/** filters: shown as a «فیلترها» line (reports); leave it out for a form. */
export interface OutputMeta { title: string; filters?: string[]; kind: string }
interface Stamp { date: string; time: string; ip: string }

async function clientIp(): Promise<string> {
  try {
    const response = await fetch('/__client-info', { cache: 'no-store' });
    if (!response.ok) return 'نامشخص';
    const { ip } = await response.json();
    return ip || 'نامشخص';
  } catch { return 'نامشخص'; }
}
async function stamp(): Promise<Stamp> {
  const now = new Date();
  const date = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'Asia/Tehran', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(now);
  const time = new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(now);
  return { date, time, ip: await clientIp() };
}
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/** The sheet: header, meta line, filters and a clean copy of the report (controls removed, scroll areas opened). */
function buildSheet(content: HTMLElement, meta: OutputMeta, s: Stamp, forPdf: boolean): HTMLElement {
  const sheet = document.createElement('div');
  sheet.className = `rp-sheet${forPdf ? ' rp-for-pdf' : ''}`;
  sheet.dir = 'rtl';
  sheet.innerHTML = `
    <div class="rp-watermark" aria-hidden="true"><img src="${LOGO}" alt=""></div>
    <div class="rp-head">
      <img class="rp-logo" src="${LOGO}" alt="پست بانک ایران">
      <div class="rp-title"><h1>${esc(meta.title)}</h1><small>${esc(meta.kind)}</small></div>
      <dl class="rp-meta">
        <div><dt>تاریخ</dt><dd>${esc(s.date)}</dd></div>
        <div><dt>ساعت</dt><dd dir="ltr">${esc(s.time)}</dd></div>
        <div><dt>IP سیستم</dt><dd dir="ltr">${esc(s.ip)}</dd></div>
      </dl>
    </div>
    ${meta.filters ? `<p class="rp-filters"><b>فیلترها:</b> ${meta.filters.length ? meta.filters.map(esc).join(' · ') : 'بدون فیلتر (همه موارد)'}</p>` : ''}
    <div class="rp-body par"></div>
    <div class="rp-foot">تهیه‌شده در ${esc(s.date)} ساعت <span dir="ltr">${esc(s.time)}</span> · IP: <span dir="ltr">${esc(s.ip)}</span></div>`;
  const copy = content.cloneNode(true) as HTMLElement;
  freezeFields(content, copy);
  copy.querySelectorAll('.no-print, .par-hint, .par-popover, .page-header-actions, .page-header, .creation-dialog-close, .pb-output-buttons, .shamsi-datepicker-popover, .shamsi-datepicker-icon').forEach(el => el.remove());
  copy.querySelectorAll<HTMLElement>('.par-table-wrap').forEach(el => { el.style.maxHeight = 'none'; el.style.overflow = 'visible'; });
  sheet.querySelector('.rp-body')!.appendChild(copy);
  return sheet;
}

/**
 * A copied form loses what was typed (cloneNode keeps attributes, not live values). Each field of the copy is
 * replaced by its current value as plain text, which also reads better on paper than empty-looking controls.
 */
function freezeFields(source: HTMLElement, copy: HTMLElement) {
  const live = Array.from(source.querySelectorAll<HTMLElement>('input, select, textarea'));
  const copied = Array.from(copy.querySelectorAll<HTMLElement>('input, select, textarea'));
  live.forEach((field, i) => {
    const target = copied[i]; if (!target) return;
    let text = '';
    if (field instanceof HTMLSelectElement) text = field.multiple ? Array.from(field.selectedOptions).map(o => o.text).join('، ') : (field.selectedOptions[0]?.text ?? '');
    else if (field instanceof HTMLTextAreaElement) text = field.value;
    else if (field instanceof HTMLInputElement) {
      if (field.type === 'hidden' || field.type === 'file') { target.remove(); return; }
      if (field.type === 'checkbox' || field.type === 'radio') {
        const mark = document.createElement('span'); mark.className = 'rp-check'; mark.textContent = field.checked ? '☑' : '☐';
        target.replaceWith(mark); return;
      }
      text = field.value;
    }
    const box = document.createElement('div');
    box.className = `rp-field${field instanceof HTMLTextAreaElement ? ' rp-field-long' : ''}`;
    box.textContent = text.trim() || '—';
    target.replaceWith(box);
  });
}

const waitImages = (root: HTMLElement) => Promise.all(Array.from(root.querySelectorAll('img')).map(img =>
  img.complete && img.naturalWidth ? Promise.resolve() : new Promise<void>(resolve => { img.onload = img.onerror = () => resolve(); })));

// ------------------------------------------------------------------ print
export async function printReport(content: HTMLElement, meta: OutputMeta): Promise<void> {
  const s = await stamp();
  const sheet = buildSheet(content, meta, s, false);
  sheet.classList.add('rp-print-root');
  document.body.appendChild(sheet);
  document.body.classList.add('rp-printing');
  await waitImages(sheet);
  if (document.fonts?.ready) await document.fonts.ready;
  let finished = false;
  const done = () => { if (finished) return; finished = true; sheet.remove(); document.body.classList.remove('rp-printing'); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  window.print();
  // print() returns when the dialog closes; a browser that sends no afterprint is cleaned up here.
  setTimeout(done, 1000);
}

// ------------------------------------------------------------------ PDF
// html2canvas cannot read colour functions newer than rgb() (color-mix(), color(srgb …), oklch()): in the copy it
// renders, every such colour becomes plain rgba, and backgrounds / shadows that contain one are dropped.
const MODERN = /(color-mix|color\(|oklch|oklab|lab\(|lch\()/i;
const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
const cache = new Map<string, string>();
function toRgba(value: string): string {
  if (!MODERN.test(value)) return value;
  const known = cache.get(value); if (known) return known;
  probe.clearRect(0, 0, 1, 1); probe.fillStyle = '#0000'; probe.fillStyle = value; probe.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
  const out = `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`; cache.set(value, out); return out;
}
const COLOR_PROPS = ['color', 'background-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'outline-color', 'fill', 'stroke', 'text-decoration-color', 'column-rule-color', 'caret-color'];
function sanitize(doc: Document) {
  const view = doc.defaultView!;
  for (const el of Array.from(doc.querySelectorAll<HTMLElement>('*'))) {
    const cs = view.getComputedStyle(el);
    if (cs.textOverflow === 'ellipsis') el.style.setProperty('text-overflow', 'clip', 'important');
    // Dates, times and plain numbers ("۱۴۰۵/۰۸/۱۷", "۱۹:۳۰:۰۵") are laid out left to right on their own,
    // otherwise html2canvas reorders their parts inside right-to-left text.
    if (!el.children.length) {
      // The browser's date/time formats carry invisible direction marks that html2canvas turns into reordering.
      const clean = (el.textContent || '').replace(/[‎‏؜⁦-⁩]/g, '');
      if (/^[s0-9۰-۹/:.,٫٬-–]+$/.test(clean) && /[0-9۰-۹]/.test(clean)) {
        el.textContent = clean.trim();
        el.style.setProperty('direction', 'ltr', 'important'); el.style.setProperty('unicode-bidi', 'isolate', 'important');
      }
    }
    // A gradient to "transparent" is drawn as a grey band; such rows and cards keep a flat colour instead.
    const bg = cs.getPropertyValue('background-image');
    if (bg && bg !== 'none' && /transparent|rgba(0, 0, 0, 0)/.test(bg)) el.style.setProperty('background-image', 'none', 'important');
    // Shadows (inner ones especially) are drawn as hard blocks by html2canvas; a printed page needs none.
    if (cs.boxShadow && cs.boxShadow !== 'none') el.style.setProperty('box-shadow', 'none', 'important');
    if (cs.textShadow && cs.textShadow !== 'none') el.style.setProperty('text-shadow', 'none', 'important');
    for (const prop of COLOR_PROPS) { const v = cs.getPropertyValue(prop); if (v && MODERN.test(v)) el.style.setProperty(prop, toRgba(v), 'important'); }
    for (const prop of ['background-image', 'box-shadow', 'text-shadow', 'filter', 'backdrop-filter']) {
      const v = cs.getPropertyValue(prop); if (v && MODERN.test(v)) el.style.setProperty(prop, 'none', 'important');
    }
  }
}
async function imageData(src: string): Promise<{ data: string; w: number; h: number }> {
  const img = new Image(); img.src = src;
  await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error('logo')); });
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
  c.getContext('2d')!.drawImage(img, 0, 0);
  return { data: c.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight };
}
/** A footer line drawn by the browser (so Persian is shaped), as a PNG for jsPDF. */
function footerImage(text: string, widthPx: number): string {
  const scale = 2, h = 26; const c = document.createElement('canvas'); c.width = widthPx * scale; c.height = h * scale;
  const ctx = c.getContext('2d')!; ctx.scale(scale, scale);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, widthPx, h);
  ctx.strokeStyle = '#d7dbe0'; ctx.beginPath(); ctx.moveTo(0, 0.5); ctx.lineTo(widthPx, 0.5); ctx.stroke();
  ctx.fillStyle = '#5b6470'; ctx.font = "500 11px 'Vazirmatn', Tahoma, sans-serif"; ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText(text, widthPx - 4, h / 2 + 1);
  return c.toDataURL('image/png');
}

/**
 * html2canvas draws text glyph by glyph and loses the ligatures icon fonts rely on (an icon would come out as a
 * box). Each icon is drawn here by the browser's own canvas, which does apply ligatures, and swapped for that image.
 */
function iconsToImages(root: HTMLElement) {
  for (const icon of Array.from(root.querySelectorAll<HTMLElement>('.material-symbols-outlined'))) {
    const cs = getComputedStyle(icon); const size = parseFloat(cs.fontSize) || 20; const name = (icon.textContent || '').trim();
    if (!name) continue;
    const scale = 3; const c = document.createElement('canvas'); c.width = Math.ceil(size * scale); c.height = Math.ceil(size * scale);
    const ctx = c.getContext('2d')!; ctx.scale(scale, scale);
    ctx.font = `400 ${size}px 'Material Symbols Outlined'`; ctx.fillStyle = toRgba(cs.color); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(name, size / 2, size / 2);
    const img = document.createElement('img'); img.src = c.toDataURL('image/png'); img.alt = '';
    img.style.cssText = `width:${size}px;height:${size}px;display:inline-block;vertical-align:middle;flex-shrink:0`;
    // Keep the tile look of icons that are themselves boxes (KPI tiles, menu icons): wrap the image in the span.
    icon.textContent = ''; icon.appendChild(img);
    icon.style.fontSize = '0';
    icon.style.setProperty('font-family', 'inherit', 'important');
  }
}

/**
 * html2canvas lays out the parts of a date or time («۱۴۰۵/۰۸/۱۷», «۱۹:۳۰:۰۵») in the wrong order. Such leaf texts are
 * drawn by the browser's canvas (correct order and shaping) and swapped for that image, at the same size and colour.
 */
function numbersToImages(root: HTMLElement) {
  const numeric = /^[s0-9۰-۹/:.,٫٬-–]+$/;
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('*'))) {
    if (el.children.length || el.closest('svg')) continue;
    const text = (el.textContent || '').replace(/[‎‏؜⁦-⁩]/g, '').trim();
    if (!text || !numeric.test(text) || !/[/:]/.test(text)) continue;
    const cs = getComputedStyle(el); const size = parseFloat(cs.fontSize) || 12;
    const font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    const scale = 3; const probeCtx = document.createElement('canvas').getContext('2d')!; probeCtx.font = font;
    const w = Math.ceil(probeCtx.measureText(text).width) + 2, h = Math.ceil(size * 1.5);
    const c = document.createElement('canvas'); c.width = w * scale; c.height = h * scale;
    const ctx = c.getContext('2d')!; ctx.scale(scale, scale); ctx.font = font; ctx.fillStyle = toRgba(cs.color);
    ctx.direction = 'ltr'; ctx.textBaseline = 'middle'; ctx.fillText(text, 1, h / 2);
    const img = document.createElement('img'); img.src = c.toDataURL('image/png'); img.alt = text;
    img.style.cssText = `width:${w}px;height:${h}px;display:inline-block;vertical-align:middle`;
    el.textContent = ''; el.appendChild(img);
  }
}

export async function pdfReport(content: HTMLElement, meta: OutputMeta, fileName: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  const s = await stamp();
  const sheet = buildSheet(content, meta, s, true);
  const host = document.createElement('div'); host.className = 'rp-offscreen'; host.appendChild(sheet); document.body.appendChild(host);
  try {
    if (document.fonts?.ready) await document.fonts.ready;
    iconsToImages(sheet);
    numbersToImages(sheet);
    await waitImages(sheet);
    const canvas = await html2canvas(sheet, { scale: 2, backgroundColor: '#ffffff', logging: false, useCORS: true, onclone: sanitize });
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
    const pageW = 297, pageH = 210, margin = 8, footH = 7;
    const usableW = pageW - margin * 2, usableH = pageH - margin * 2 - footH;
    const pxPerMm = canvas.width / usableW; const slicePx = Math.floor(usableH * pxPerMm);
    const pages = Math.max(1, Math.ceil(canvas.height / slicePx));
    const logo = await imageData(LOGO).catch(() => null);
    const GState = (pdf as any).GState;
    for (let i = 0; i < pages; i++) {
      if (i > 0) pdf.addPage('a4', 'landscape');
      // Faint logo behind the content of every page.
      if (logo && GState) {
        const size = 120, x = (pageW - size) / 2, y = (pageH - size * logo.h / logo.w) / 2;
        pdf.setGState(new GState({ opacity: 0.05 })); pdf.addImage(logo.data, 'PNG', x, y, size, size * logo.h / logo.w, undefined, 'FAST'); pdf.setGState(new GState({ opacity: 1 }));
      }
      const part = document.createElement('canvas'); const h = Math.min(slicePx, canvas.height - i * slicePx);
      part.width = canvas.width; part.height = h;
      const pctx = part.getContext('2d')!; pctx.drawImage(canvas, 0, i * slicePx, canvas.width, h, 0, 0, canvas.width, h);
      // White parts of the slice are made transparent so the faint logo shows through.
      const imgData = pctx.getImageData(0, 0, part.width, part.height); const d = imgData.data;
      for (let p = 0; p < d.length; p += 4) if (d[p] > 248 && d[p + 1] > 248 && d[p + 2] > 248) d[p + 3] = 0;
      pctx.putImageData(imgData, 0, 0);
      pdf.addImage(part.toDataURL('image/png'), 'PNG', margin, margin, usableW, h / pxPerMm, undefined, 'FAST');
      const foot = `${meta.title} · صفحه ${(i + 1).toLocaleString('fa-IR')} از ${pages.toLocaleString('fa-IR')} · ${s.date} · ساعت ⁦${s.time}⁩ · IP: ⁦${s.ip}⁩`;
      pdf.addImage(footerImage(foot, 1000), 'PNG', margin, pageH - margin - footH + 1, usableW, footH - 1, undefined, 'FAST');
    }
    const blob = pdf.output('blob');
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = fileName;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 2000);
  } finally {
    host.remove();
  }
}
