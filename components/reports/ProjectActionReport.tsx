import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ActionItem, Project, User, WorkStatus } from '../../types';
import { ShamsiDatePicker } from '../ShamsiDatePicker';
import { toPersianDigits } from '../../utils';
import { pdfReport, printReport } from './reportOutput';
import { buildXlsx, jalaliStamp, saveBlob } from '../../tmpb/utils/reportExport';
import {
  APPROVAL_LABEL, APPROVALS, DATE_BASIS_LABEL, DUE_SOON_DAYS, EMPTY_FILTERS, GROUP_LABEL, KIND_LABEL, KINDS, PERSON_ROLE_LABEL,
  PRESET_LABEL, SOURCE_LABEL, SOURCES, STATUS_LABEL, STATUSES, TIMING_LABEL, TIMINGS,
  activeFilterCount, applyFilters, buildRows, countBy, formatDate, groupKey, monthlyTrend, personName, presetRange, previousRange, summarize, todayIso,
  type Approval, type DateBasis, type DatePreset, type GroupBy, type PersonRole, type ReportFilters, type ReportRow, type RowKind, type Source, type Summary, type Timing,
} from './reportModel';
import './project-action-report.css';

const fa = (n: number | string) => toPersianDigits(String(n));
const money = (n: number) => toPersianDigits(Math.round(n).toLocaleString('en-US'));
/** Short money for cards and charts: میلیارد / میلیون ریال. */
const shortMoney = (n: number) => n >= 1e9 ? `${fa((n / 1e9).toFixed(n >= 1e11 ? 0 : 1))} میلیارد` : n >= 1e6 ? `${fa((n / 1e6).toFixed(n >= 1e8 ? 0 : 1))} میلیون` : money(n);
const STATUS_COLOR: Record<WorkStatus, string> = { 'In Progress': 'var(--pb-chart-main, #35bb6d)', 'Planning': '#e9b16b', 'Completed': '#5b9bd5', 'On Hold': '#db7f8e' };
const KIND_COLOR: Record<RowKind, string> = { waterfall: 'var(--pb-chart-main, #35bb6d)', agile: '#8b6fd6', action: '#e3a34f' };
const APPROVAL_COLOR: Record<Approval, string> = { Approved: '#4caf7a', Pending: '#e9b16b', Draft: '#9aa5b1', Rejected: '#db7f8e' };

// Per-browser conveniences: last filters, list columns and saved views. They live only in this browser.
const store = {
  get<T>(key: string, fallback: T): T { try { const v = localStorage.getItem(key); return v ? { ...fallback, ...JSON.parse(v) } : fallback; } catch { return fallback; } },
  getList<T>(key: string): T[] { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : []; } catch { return []; } },
  set(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } },
};

// ======================================================================= small controls
function useOutside(open: boolean, close: () => void) {
  const box = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !box.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', handler); document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', handler); };
  }, [open, close]);
  return box;
}

function MultiSelect<T extends string>({ label, icon, options, value, onChange, searchable, extra }: {
  label: string; icon: string; options: { value: T; label: string }[]; value: T[]; onChange: (v: T[]) => void; searchable?: boolean; extra?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false); const [q, setQ] = useState('');
  const box = useOutside(open, () => setOpen(false));
  const shown = q ? options.filter(o => o.label.includes(q)) : options;
  const summary = value.length === 0 ? 'همه' : value.length === 1 ? (options.find(o => o.value === value[0])?.label ?? '۱ مورد') : `${fa(value.length)} مورد`;
  return <div className="par-field par-multi" ref={box}>
    <span className="par-label"><span className="material-symbols-outlined" aria-hidden="true">{icon}</span>{label}{extra}</span>
    <button type="button" className={`par-select ${value.length ? 'has-value' : ''}`} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(o => !o)}>
      <span>{summary}</span><span className="material-symbols-outlined" aria-hidden="true">expand_more</span>
    </button>
    {open && <div className="par-popover" role="listbox" aria-multiselectable="true" aria-label={label}>
      {searchable && options.length > 6 && <input className="par-pop-search" type="search" placeholder="جستجو…" value={q} onChange={e => setQ(e.target.value)} autoFocus />}
      <div className="par-pop-actions"><button type="button" onClick={() => onChange(options.map(o => o.value))}>انتخاب همه</button><button type="button" onClick={() => onChange([])}>پاک کردن</button></div>
      <div className="par-pop-list">
        {shown.length ? shown.map(o => <label key={o.value} className="par-option">
          <input type="checkbox" checked={value.includes(o.value)} onChange={e => onChange(e.target.checked ? [...value, o.value] : value.filter(v => v !== o.value))} />
          <span>{o.label}</span>
        </label>) : <p className="par-empty">موردی نیست.</p>}
      </div>
    </div>}
  </div>;
}

// ======================================================================= filter bar
function FilterBar({ filters, setFilters, unitOptions, peopleOptions, projectOptions, open, setOpen }: {
  filters: ReportFilters; setFilters: (f: ReportFilters) => void;
  unitOptions: string[]; peopleOptions: { value: string; label: string }[]; projectOptions: { value: string; label: string }[];
  open: boolean; setOpen: (o: boolean) => void;
}) {
  const set = <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => setFilters({ ...filters, [key]: value });
  const preset = (p: DatePreset) => { const [from, to] = presetRange(p); setFilters({ ...filters, from, to }); };
  const count = activeFilterCount(filters);
  const chips: { label: string; clear: () => void }[] = [];
  const listChip = <K extends 'kinds' | 'statuses' | 'approvals' | 'units' | 'people' | 'sources' | 'timings'>(key: K, title: string, label: (v: string) => string) => {
    const v = filters[key] as string[]; if (v.length) chips.push({ label: `${title}: ${v.map(label).join('، ')}`, clear: () => set(key, [] as never) });
  };
  listChip('kinds', 'نوع', v => KIND_LABEL[v as RowKind]);
  if (filters.from || filters.to) chips.push({ label: `${DATE_BASIS_LABEL[filters.dateBasis]}: ${formatDate(filters.from || null)} تا ${formatDate(filters.to || null)}`, clear: () => setFilters({ ...filters, from: '', to: '' }) });
  listChip('statuses', 'وضعیت', v => STATUS_LABEL[v as WorkStatus]);
  listChip('approvals', 'تأیید', v => APPROVAL_LABEL[v as Approval]);
  listChip('timings', 'زمان', v => TIMING_LABEL[v as Timing]);
  listChip('units', 'واحد', v => v);
  listChip('people', 'افراد', v => peopleOptions.find(p => p.value === v)?.label ?? v);
  listChip('sources', 'منبع', v => SOURCE_LABEL[v as Source]);
  if (filters.projectId) chips.push({ label: `پروژه: ${projectOptions.find(p => p.value === filters.projectId)?.label ?? ''}`, clear: () => set('projectId', '') });
  if (filters.costMin || filters.costMax) chips.push({ label: `هزینه: ${filters.costMin || '۰'} تا ${filters.costMax || '∞'}`, clear: () => setFilters({ ...filters, costMin: '', costMax: '' }) });
  if (filters.search) chips.push({ label: `جستجو: ${filters.search}`, clear: () => set('search', '') });

  return <section className="par-filters no-print" aria-label="فیلترهای گزارش">
    <div className="par-filter-head">
      <button type="button" className="filter-toggle-btn" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="material-symbols-outlined" aria-hidden="true">filter_alt</span>فیلترها{count > 0 && <b className="par-count">{fa(count)}</b>}
        <span className="material-symbols-outlined" aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>expand_more</span>
      </button>
      <div className="par-search"><span className="material-symbols-outlined" aria-hidden="true">search</span>
        <input type="search" placeholder="جستجو در نام یا کد…" value={filters.search} onChange={e => set('search', e.target.value)} aria-label="جستجو در نام یا کد" /></div>
      <div className="par-chips">
        {chips.map(c => <span key={c.label} className="par-chip">{c.label}<button type="button" aria-label={`حذف فیلتر ${c.label}`} onClick={c.clear}><span className="material-symbols-outlined" aria-hidden="true">close</span></button></span>)}
        {count > 0 && <button type="button" className="par-clear" onClick={() => setFilters(EMPTY_FILTERS)}>پاک کردن همه</button>}
      </div>
    </div>
    {open && <div className="par-filter-grid">
      <MultiSelect label="نوع" icon="category" value={filters.kinds} onChange={v => set('kinds', v)} options={KINDS.map(k => ({ value: k, label: KIND_LABEL[k] }))} />
      <div className="par-field par-dates">
        <span className="par-label"><span className="material-symbols-outlined" aria-hidden="true">date_range</span>بازه زمانی
          <span className="par-presets">{(Object.keys(PRESET_LABEL) as DatePreset[]).map(p => <button key={p} type="button" onClick={() => preset(p)}>{PRESET_LABEL[p]}</button>)}</span></span>
        <div className="par-date-row">
          <ShamsiDatePicker value={filters.from} onChange={v => set('from', v)} placeholder="از تاریخ" />
          <ShamsiDatePicker value={filters.to} onChange={v => set('to', v)} placeholder="تا تاریخ" />
          <select value={filters.dateBasis} onChange={e => set('dateBasis', e.target.value as DateBasis)} aria-label="مبنای تاریخ">
            {(Object.keys(DATE_BASIS_LABEL) as DateBasis[]).map(b => <option key={b} value={b}>{DATE_BASIS_LABEL[b]}</option>)}
          </select>
        </div>
      </div>
      <MultiSelect label="وضعیت" icon="flag" value={filters.statuses} onChange={v => set('statuses', v)} options={STATUSES.map(s => ({ value: s, label: STATUS_LABEL[s] }))} />
      <MultiSelect label="وضعیت تأیید" icon="verified" value={filters.approvals} onChange={v => set('approvals', v)} options={APPROVALS.map(a => ({ value: a, label: APPROVAL_LABEL[a] }))} />
      <MultiSelect label="وضعیت زمانی" icon="schedule" value={filters.timings} onChange={v => set('timings', v)} options={TIMINGS.map(t => ({ value: t, label: t === 'dueSoon' ? `${TIMING_LABEL[t]} (${fa(DUE_SOON_DAYS)} روز)` : TIMING_LABEL[t] }))} />
      <MultiSelect label="واحد مالک" icon="corporate_fare" value={filters.units} onChange={v => set('units', v)} options={unitOptions.map(u => ({ value: u, label: u }))} searchable />
      <MultiSelect label="افراد" icon="group" value={filters.people} onChange={v => set('people', v)} options={peopleOptions} searchable
        extra={<select className="par-role" value={filters.personRole} onChange={e => set('personRole', e.target.value as PersonRole)} aria-label="نقش فرد">
          {(Object.keys(PERSON_ROLE_LABEL) as PersonRole[]).map(r => <option key={r} value={r}>{r === 'any' ? 'همه نقش‌ها' : r === 'manager' ? 'مدیر / مسئول' : 'مالک'}</option>)}
        </select>} />
      <MultiSelect label="منبع اقدام" icon="call_split" value={filters.sources} onChange={v => set('sources', v)} options={SOURCES.map(s => ({ value: s, label: SOURCE_LABEL[s] }))} />
      <label className="par-field"><span className="par-label"><span className="material-symbols-outlined" aria-hidden="true">account_tree</span>پروژه مرتبط</span>
        <select value={filters.projectId} onChange={e => set('projectId', e.target.value)}>
          <option value="">همه</option>{projectOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select></label>
      <div className="par-field"><span className="par-label"><span className="material-symbols-outlined" aria-hidden="true">payments</span>هزینه (ریال)</span>
        <div className="par-cost"><input inputMode="numeric" placeholder="از" value={filters.costMin} onChange={e => set('costMin', e.target.value)} aria-label="حداقل هزینه" />
          <input inputMode="numeric" placeholder="تا" value={filters.costMax} onChange={e => set('costMax', e.target.value)} aria-label="حداکثر هزینه" /></div></div>
    </div>}
  </section>;
}

// ======================================================================= list tab
interface Column { id: string; label: string; value: (r: ReportRow) => string | number; render?: (r: ReportRow) => React.ReactNode; sort?: (r: ReportRow) => string | number; numeric?: boolean; width: number }
function useColumns(users: User[]): Column[] {
  return useMemo(() => [
    { id: 'name', label: 'عنوان', value: r => r.name, width: 34, render: r => <span className="par-name"><i className={`par-kind-dot ${r.kind}`} aria-hidden="true" />{r.name}</span> },
    { id: 'code', label: 'کد', value: r => r.code, width: 12 },
    { id: 'kind', label: 'نوع', value: r => KIND_LABEL[r.kind], width: 14 },
    { id: 'unit', label: 'واحد مالک', value: r => r.unit || '—', width: 24 },
    { id: 'manager', label: 'مدیر / مسئول', value: r => personName(users, r.managerId), width: 20 },
    { id: 'owner', label: 'مالک', value: r => personName(users, r.ownerId), width: 18 },
    { id: 'start', label: 'شروع', value: r => formatDate(r.start), sort: r => r.start || '', width: 12 },
    { id: 'end', label: 'پایان', value: r => formatDate(r.end), sort: r => r.end || '', width: 12 },
    { id: 'status', label: 'وضعیت', value: r => STATUS_LABEL[r.status] || r.status, width: 14, render: r => <span className="par-badge" style={{ '--c': STATUS_COLOR[r.status] } as React.CSSProperties}>{STATUS_LABEL[r.status] || r.status}</span> },
    { id: 'approval', label: 'وضعیت تأیید', value: r => APPROVAL_LABEL[r.approval], width: 14, render: r => <span className="par-badge" style={{ '--c': APPROVAL_COLOR[r.approval] } as React.CSSProperties}>{APPROVAL_LABEL[r.approval]}</span> },
    { id: 'timing', label: 'وضعیت زمانی', value: r => TIMING_LABEL[r.timing], width: 14 },
    { id: 'delay', label: 'روز تأخیر', value: r => r.delayDays || '', sort: r => r.delayDays, numeric: true, width: 10, render: r => r.delayDays ? fa(r.delayDays) : '—' },
    { id: 'cost', label: 'هزینه (ریال)', value: r => r.cost ?? '', sort: r => r.cost ?? -1, numeric: true, width: 18, render: r => r.cost !== null ? money(r.cost) : '—' },
    { id: 'progress', label: 'پیشرفت', value: r => r.progress ?? '', sort: r => r.progress ?? -1, numeric: true, width: 12,
      render: r => r.progress === null ? '—' : <span className="par-progress"><span className="par-track"><i style={{ width: `${Math.min(100, r.progress)}%` }} /></span><b>{fa(r.progress)}٪</b></span> },
    { id: 'source', label: 'منبع / پروژه', value: r => r.kind === 'action' ? [r.source ? SOURCE_LABEL[r.source] : '', r.projectName].filter(Boolean).join(' · ') : '', width: 22 },
  ], [users]);
}
const DEFAULT_COLUMNS = ['name', 'kind', 'unit', 'manager', 'start', 'end', 'status', 'timing', 'progress', 'cost'];

function ListTab({ rows, users, onOpen, storageKey }: { rows: ReportRow[]; users: User[]; onOpen: (r: ReportRow) => void; storageKey: string }) {
  const columns = useColumns(users);
  const saved = store.get(storageKey, { visible: DEFAULT_COLUMNS, groupBy: 'none' as GroupBy, sortId: 'end', sortDir: 'asc' as 'asc' | 'desc' });
  const [visible, setVisible] = useState<string[]>(saved.visible);
  const [groupBy, setGroupBy] = useState<GroupBy>(saved.groupBy);
  const [sort, setSort] = useState<{ id: string; dir: 'asc' | 'desc' }>({ id: saved.sortId, dir: saved.sortDir });
  const [pickOpen, setPickOpen] = useState(false); const pickBox = useOutside(pickOpen, () => setPickOpen(false));
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  useEffect(() => { store.set(storageKey, { visible, groupBy, sortId: sort.id, sortDir: sort.dir }); }, [visible, groupBy, sort, storageKey]);

  const shown = columns.filter(c => visible.includes(c.id));
  const sorted = useMemo(() => {
    const col = columns.find(c => c.id === sort.id); if (!col) return rows;
    const key = col.sort ?? col.value; const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => { const x = key(a), y = key(b); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'fa')) * dir; });
  }, [rows, sort, columns]);
  const groups = useMemo(() => {
    if (groupBy === 'none') return [{ key: '', rows: sorted }];
    const map = new Map<string, ReportRow[]>();
    for (const r of sorted) { const k = groupKey(r, groupBy, users); map.set(k, [...(map.get(k) || []), r]); }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length).map(([key, rows]) => ({ key, rows }));
  }, [sorted, groupBy, users]);
  const total = summarize(rows);

  function exportExcel() {
    const header = shown.map(c => c.label);
    const body = sorted.map(r => shown.map(c => c.value(r)));
    const blob = buildXlsx('گزارش', header, body, shown.map(c => c.width), ['گزارش پروژه‌ها و اقدامات', `تاریخ تهیه: ${formatDate(todayIso())}`, `تعداد ردیف‌ها: ${rows.length}`]);
    saveBlob(blob, `projects-actions-report-${jalaliStamp()}.xlsx`);
  }
  const toggleSort = (id: string) => setSort(s => s.id === id ? { id, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { id, dir: 'asc' });
  const groupSummary = (list: ReportRow[]) => { const s = summarize(list); return `${fa(s.total)} مورد${s.cost ? ` · ${shortMoney(s.cost)} ریال` : ''}${s.delayed ? ` · ${fa(s.delayed)} تأخیردار` : ''}`; };

  return <div className="par-list">
    <div className="par-toolbar no-print">
      <label className="par-inline"><span className="material-symbols-outlined" aria-hidden="true">schema</span>گروه‌بندی
        <select value={groupBy} onChange={e => { setGroupBy(e.target.value as GroupBy); setCollapsed(new Set()); }}>
          {(Object.keys(GROUP_LABEL) as GroupBy[]).map(g => <option key={g} value={g}>{GROUP_LABEL[g]}</option>)}
        </select></label>
      <div className="par-multi" ref={pickBox}>
        <button type="button" className="cancel-btn" aria-expanded={pickOpen} onClick={() => setPickOpen(o => !o)}><span className="material-symbols-outlined" aria-hidden="true">view_column</span>ستون‌ها</button>
        {pickOpen && <div className="par-popover" role="group" aria-label="ستون‌های جدول">
          <div className="par-pop-actions"><button type="button" onClick={() => setVisible(columns.map(c => c.id))}>همه</button><button type="button" onClick={() => setVisible(DEFAULT_COLUMNS)}>پیش‌فرض</button></div>
          <div className="par-pop-list">{columns.map(c => <label key={c.id} className="par-option">
            <input type="checkbox" checked={visible.includes(c.id)} disabled={c.id === 'name'} onChange={e => setVisible(e.target.checked ? columns.filter(x => x.id === c.id || visible.includes(x.id)).map(x => x.id) : visible.filter(v => v !== c.id))} /><span>{c.label}</span></label>)}</div>
        </div>}
      </div>
      <span className="par-spacer" />
      <button type="button" className="export-btn" onClick={exportExcel} disabled={!rows.length}><span className="material-symbols-outlined" aria-hidden="true">table_view</span>خروجی Excel</button>
    </div>
    {rows.length === 0 ? <div className="par-nothing"><span className="material-symbols-outlined" aria-hidden="true">search_off</span>موردی با این فیلترها پیدا نشد.</div> :
      <div className="par-table-wrap">
        <table className="par-table">
          <thead><tr>{shown.map(c => <th key={c.id} className={c.numeric ? 'num' : ''} aria-sort={sort.id === c.id ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
            <button type="button" onClick={() => toggleSort(c.id)}>{c.label}<span className="material-symbols-outlined" aria-hidden="true">{sort.id === c.id ? (sort.dir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}</span></button></th>)}</tr></thead>
          {groups.map(g => {
            const isCollapsed = collapsed.has(g.key);
            return <tbody key={g.key || 'all'}>
              {groupBy !== 'none' && <tr className="par-group-row"><td colSpan={shown.length}>
                <button type="button" aria-expanded={!isCollapsed} onClick={() => setCollapsed(s => { const n = new Set(s); n.has(g.key) ? n.delete(g.key) : n.add(g.key); return n; })}>
                  <span className="material-symbols-outlined" aria-hidden="true" style={{ transform: isCollapsed ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease' }}>expand_more</span><strong>{g.key}</strong><small>{groupSummary(g.rows)}</small>
                </button></td></tr>}
              {!isCollapsed && g.rows.map(r => <tr key={r.key} className={`par-row ${r.timing}`} tabIndex={0} onClick={() => onOpen(r)} onKeyDown={e => { if (e.key === 'Enter') onOpen(r); }} title="باز کردن">
                {shown.map(c => <td key={c.id} className={c.numeric ? 'num' : ''}>{c.render ? c.render(r) : (c.value(r) === '' ? '—' : c.value(r))}</td>)}
              </tr>)}
            </tbody>;
          })}
          <tfoot><tr>{shown.map((c, i) => <td key={c.id} className={c.numeric ? 'num' : ''}>
            {i === 0 ? `جمع: ${fa(total.total)} مورد` : c.id === 'cost' ? (total.cost ? money(total.cost) : '—') : c.id === 'progress' ? (total.avgProgress !== null ? `میانگین ${fa(total.avgProgress)}٪` : '—') : c.id === 'delay' ? (total.delayed ? `${fa(total.delayed)} تأخیردار` : '—') : ''}
          </td>)}</tr></tfoot>
        </table>
      </div>}
  </div>;
}

// ======================================================================= dashboard tab
function Delta({ now, before, invert, money: isMoney }: { now: number; before: number | undefined; invert?: boolean; money?: boolean }) {
  if (before === undefined) return null;
  const diff = now - before; if (diff === 0) return <small className="par-delta same">بدون تغییر نسبت به دوره قبل</small>;
  const good = invert ? diff < 0 : diff > 0;
  return <small className={`par-delta ${good ? 'up' : 'down'}`}><span className="material-symbols-outlined" aria-hidden="true">{diff > 0 ? 'trending_up' : 'trending_down'}</span>
    {isMoney ? shortMoney(Math.abs(diff)) : fa(Math.abs(diff))} {diff > 0 ? 'بیشتر' : 'کمتر'} از دوره قبل</small>;
}

function Donut({ title, data, onPick, active }: { title: string; data: { key: string; label: string; value: number; color: string }[]; onPick: (key: string) => void; active: string[] }) {
  const total = data.reduce((s, d) => s + d.value, 0); const r = 54, c = 2 * Math.PI * r; let offset = 0;
  return <div className="par-card par-donut-card">
    <h4>{title}</h4>
    <div className="par-donut">
      <svg viewBox="0 0 140 140" role="img" aria-label={`${title}: ${data.map(d => `${d.label} ${d.value}`).join('، ')}`}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--pb-soft, #e3f4ea)" strokeWidth="20" />
        {total > 0 && data.filter(d => d.value > 0).map(d => {
          const len = (d.value / total) * c; const el = <circle key={d.key} cx="70" cy="70" r={r} fill="none" stroke={d.color} strokeWidth={active.length && !active.includes(d.key) ? 14 : 20}
            strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)" className="par-seg" onClick={() => onPick(d.key)}><title>{`${d.label}: ${d.value}`}</title></circle>;
          offset += len; return el;
        })}
        <text x="70" y="66" textAnchor="middle" className="par-donut-total">{fa(total)}</text>
        <text x="70" y="84" textAnchor="middle" className="par-donut-sub">مورد</text>
      </svg>
      <ul className="par-legend">{data.map(d => <li key={d.key}><button type="button" className={active.includes(d.key) ? 'on' : ''} onClick={() => onPick(d.key)}>
        <i style={{ background: d.color }} />{d.label}<b>{fa(d.value)}</b><small>{total ? fa(Math.round(d.value / total * 100)) : '۰'}٪</small></button></li>)}</ul>
    </div>
  </div>;
}

function Bars({ title, data, onPick, valueLabel, toolbar }: { title: string; data: { key: string; label: string; value: number; parts?: { color: string; value: number; label: string }[] }[]; onPick?: (key: string) => void; valueLabel: (v: number) => string; toolbar?: React.ReactNode }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return <div className="par-card">
    <div className="par-card-head"><h4>{title}</h4>{toolbar}</div>
    {data.length === 0 ? <p className="par-empty">داده‌ای برای نمایش نیست.</p> : <ul className="par-bars">{data.map(d => <li key={d.key}>
      <button type="button" onClick={() => onPick?.(d.key)} disabled={!onPick} title={d.label}>
        <span className="par-bar-label">{d.label}</span>
        <span className="par-bar-track"><span className="par-bar-fill" style={{ width: `${Math.max(2, d.value / max * 100)}%` }}>
          {d.parts ? d.parts.filter(p => p.value > 0).map(p => <i key={p.label} style={{ flex: p.value, background: p.color }} title={`${p.label}: ${p.value}`} />) : <i style={{ flex: 1 }} />}
        </span></span>
        <b>{valueLabel(d.value)}</b>
      </button></li>)}</ul>}
  </div>;
}

function Trend({ rows }: { rows: ReportRow[] }) {
  const data = monthlyTrend(rows, 12); const max = Math.max(1, ...data.flatMap(d => [d.started, d.finished]));
  return <div className="par-card par-trend-card">
    <div className="par-card-head"><h4>روند ماهانه (۱۲ ماه اخیر)</h4><span className="par-key"><i className="started" />شروع‌شده<i className="finished" />تکمیل‌شده</span></div>
    <div className="par-trend" role="img" aria-label={data.map(d => `${d.label}: ${d.started} شروع، ${d.finished} تکمیل`).join('؛ ')}>
      {data.map(d => <div key={d.key} className="par-trend-col">
        <div className="par-trend-bars"><span className="started" style={{ height: `${d.started / max * 100}%` }} title={`شروع‌شده: ${d.started}`}>{d.started > 0 && <em>{fa(d.started)}</em>}</span>
          <span className="finished" style={{ height: `${d.finished / max * 100}%` }} title={`تکمیل‌شده: ${d.finished}`}>{d.finished > 0 && <em>{fa(d.finished)}</em>}</span></div>
        <small>{d.label}</small>
      </div>)}
    </div>
  </div>;
}

function Gantt({ rows, onOpen, from, to }: { rows: ReportRow[]; onOpen: (r: ReportRow) => void; from: string; to: string }) {
  const items = rows.filter(r => r.start && r.end).sort((a, b) => (a.start! < b.start! ? -1 : 1)).slice(0, 15);
  if (!items.length) return <div className="par-card"><h4>نوار زمانی</h4><p className="par-empty">موردی با تاریخ شروع و پایان نیست.</p></div>;
  const lo = from || items.reduce((m, r) => (r.start! < m ? r.start! : m), items[0].start!);
  const hi = to || items.reduce((m, r) => (r.end! > m ? r.end! : m), items[0].end!);
  const span = Math.max(1, Date.parse(hi) - Date.parse(lo));
  const pos = (iso: string) => Math.min(100, Math.max(0, (Date.parse(iso) - Date.parse(lo)) / span * 100));
  const today = todayIso(); const showToday = today >= lo && today <= hi;
  return <div className="par-card par-gantt-card">
    <div className="par-card-head"><h4>نوار زمانی {rows.length > 15 ? `(۱۵ مورد اول از ${fa(rows.length)})` : ''}</h4><span className="par-key">{formatDate(lo)} تا {formatDate(hi)}</span></div>
    <div className="par-gantt">
      {showToday && <span className="par-today" style={{ right: `calc(var(--label-w) + (100% - var(--label-w)) * ${pos(today) / 100})` }} title="امروز" />}
      {items.map(r => { const s = pos(r.start!), e = pos(r.end!);
        return <button key={r.key} type="button" className="par-gantt-row" onClick={() => onOpen(r)} title={`${r.name}: ${formatDate(r.start)} تا ${formatDate(r.end)}`}>
          <span className="par-gantt-label">{r.name}</span>
          <span className="par-gantt-track"><span className={`par-gantt-bar ${r.timing}`} style={{ right: `${s}%`, width: `${Math.max(1.5, e - s)}%`, background: STATUS_COLOR[r.status] }}>
            {r.progress !== null && <i style={{ width: `${r.progress}%` }} />}</span></span>
        </button>; })}
    </div>
  </div>;
}

function DashboardTab({ rows, previous, users, filters, setFilters, onOpen }: {
  rows: ReportRow[]; previous: Summary | null; users: User[]; filters: ReportFilters; setFilters: (f: ReportFilters) => void; onOpen: (r: ReportRow) => void;
}) {
  const s = summarize(rows);
  const [unitMetric, setUnitMetric] = useState<'count' | 'cost'>('count');
  const toggle = <K extends 'statuses' | 'kinds' | 'units' | 'people' | 'approvals'>(key: K, value: string) => {
    const list = filters[key] as string[];
    setFilters({ ...filters, [key]: list.includes(value) ? list.filter(v => v !== value) : [...list, value] });
  };
  const byUnit = [...countBy(rows, r => r.unitLevel2 || 'تعیین نشده').entries()]
    .map(([key, list]) => ({ key, label: key, value: unitMetric === 'count' ? list.length : list.reduce((t, r) => t + (r.cost ?? 0), 0) }))
    .filter(d => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 10);
  const byManager = [...countBy(rows, r => r.managerId || '').entries()].filter(([k]) => k)
    .map(([key, list]) => ({ key, label: personName(users, key), value: list.length, parts: STATUSES.map(st => ({ label: STATUS_LABEL[st], color: STATUS_COLOR[st], value: list.filter(r => r.status === st).length })) }))
    .sort((a, b) => b.value - a.value).slice(0, 10);
  const delayed = rows.filter(r => r.timing === 'delayed').sort((a, b) => b.delayDays - a.delayDays).slice(0, 10);
  const approvals = APPROVALS.map(a => ({ key: a, label: APPROVAL_LABEL[a], value: rows.filter(r => r.approval === a).length, parts: [{ label: APPROVAL_LABEL[a], color: APPROVAL_COLOR[a], value: 1 }] }));
  const cards = [
    { icon: 'inventory_2', label: 'تعداد کل', value: fa(s.total), delta: <Delta now={s.total} before={previous?.total} /> },
    { icon: 'play_circle', label: 'در حال انجام', value: fa(s.active), delta: <Delta now={s.active} before={previous?.active} /> },
    { icon: 'running_with_errors', label: 'تأخیردار', value: fa(s.delayed), tone: s.delayed ? 'bad' : '', delta: <Delta now={s.delayed} before={previous?.delayed} invert />, pick: () => setFilters({ ...filters, timings: ['delayed'] }) },
    { icon: 'task_alt', label: 'تکمیل‌شده', value: fa(s.completed), delta: <Delta now={s.completed} before={previous?.completed} /> },
    { icon: 'payments', label: 'مجموع هزینه (ریال)', value: s.cost ? shortMoney(s.cost) : '—', delta: <Delta now={s.cost} before={previous?.cost} money /> },
    { icon: 'speed', label: 'میانگین پیشرفت', value: s.avgProgress !== null ? `${fa(s.avgProgress)}٪` : '—', delta: null },
  ];
  return <div className="par-dashboard">
    <div className="par-kpis">{cards.map(c => {
      const body = <><span className="par-kpi-icon material-symbols-outlined" aria-hidden="true">{c.icon}</span>
        <span className="par-kpi-text"><small>{c.label}</small><strong>{c.value}</strong>{c.delta}</span></>;
      // Only the «تأخیردار» card filters; the others are plain cards (a disabled button would look greyed out).
      return c.pick ? <button key={c.label} type="button" className={`par-kpi ${c.tone || ''}`} onClick={c.pick} title="نمایش موارد تأخیردار">{body}</button>
        : <div key={c.label} className={`par-kpi ${c.tone || ''}`}>{body}</div>;
    })}</div>
    {rows.length === 0 ? <div className="par-nothing"><span className="material-symbols-outlined" aria-hidden="true">search_off</span>موردی با این فیلترها پیدا نشد.</div> : <>
      <p className="par-hint no-print"><span className="material-symbols-outlined" aria-hidden="true">touch_app</span>روی هر بخش نمودار کلیک کنید تا گزارش به همان مورد فیلتر شود.</p>
      <div className="par-grid two">
        <Donut title="توزیع وضعیت" active={filters.statuses} onPick={k => toggle('statuses', k)}
          data={STATUSES.map(st => ({ key: st, label: STATUS_LABEL[st], value: rows.filter(r => r.status === st).length, color: STATUS_COLOR[st] }))} />
        <Donut title="توزیع نوع" active={filters.kinds} onPick={k => toggle('kinds', k)}
          data={KINDS.map(k => ({ key: k, label: KIND_LABEL[k], value: rows.filter(r => r.kind === k).length, color: KIND_COLOR[k] }))} />
      </div>
      <div className="par-grid two">
        <Bars title={unitMetric === 'count' ? 'تعداد به تفکیک واحد' : 'هزینه به تفکیک واحد (ریال)'} data={byUnit} onPick={k => toggle('units', k)}
          valueLabel={v => unitMetric === 'count' ? fa(v) : shortMoney(v)}
          toolbar={<div className="par-seg-switch no-print" role="group" aria-label="معیار"><button type="button" aria-pressed={unitMetric === 'count'} onClick={() => setUnitMetric('count')}>تعداد</button><button type="button" aria-pressed={unitMetric === 'cost'} onClick={() => setUnitMetric('cost')}>هزینه</button></div>} />
        <Bars title="وضعیت به تفکیک مدیر / مسئول" data={byManager} onPick={k => toggle('people', k)} valueLabel={v => fa(v)}
          toolbar={<span className="par-key">{STATUSES.map(st => <React.Fragment key={st}><i style={{ background: STATUS_COLOR[st] }} />{STATUS_LABEL[st]}</React.Fragment>)}</span>} />
      </div>
      <div className="par-grid two">
        <div className="par-card">
          <h4>۱۰ مورد با بیشترین تأخیر</h4>
          {delayed.length === 0 ? <p className="par-empty par-good"><span className="material-symbols-outlined" aria-hidden="true">verified</span>موردی تأخیر ندارد.</p> :
            <ol className="par-delays">{delayed.map(r => <li key={r.key}><button type="button" onClick={() => onOpen(r)}>
              <i className={`par-kind-dot ${r.kind}`} aria-hidden="true" /><span><strong>{r.name}</strong><small>{KIND_LABEL[r.kind]} · {personName(users, r.managerId)} · پایان {formatDate(r.end)}</small></span>
              <b>{fa(r.delayDays)} روز</b></button></li>)}</ol>}
        </div>
        <Bars title="قیف تأیید" data={approvals} onPick={k => toggle('approvals', k)} valueLabel={v => fa(v)} />
      </div>
      <Trend rows={rows} />
      <Gantt rows={rows} onOpen={onOpen} from={filters.from} to={filters.to} />
    </>}
  </div>;
}

// ======================================================================= page
interface SavedView { name: string; filters: ReportFilters }

export function ProjectActionReport({ projects, actions, users, owningUnits = [], currentUserId, onNavigate }: {
  projects: Project[]; actions: ActionItem[]; users: User[]; owningUnits?: string[]; currentUserId?: string; onNavigate: (page: string, context?: any) => void;
}) {
  const keyBase = `par:${currentUserId || 'me'}`;
  const [tab, setTab] = useState<'list' | 'dashboard'>(() => (store.get(`${keyBase}:ui`, { tab: 'dashboard' as 'list' | 'dashboard' })).tab);
  const [filters, setFilters] = useState<ReportFilters>(() => store.get(`${keyBase}:filters`, EMPTY_FILTERS));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [views, setViews] = useState<SavedView[]>(() => store.getList<SavedView>(`${keyBase}:views`));
  const [naming, setNaming] = useState(false); const [viewName, setViewName] = useState('');
  const content = useRef<HTMLDivElement | null>(null); const root = useRef<HTMLElement | null>(null);
  const [busy, setBusy] = useState<'' | 'pdf' | 'print'>('');
  /** Print or PDF of the shown tab, with the active filters written on top. */
  async function output(kind: 'pdf' | 'print') {
    if (!content.current || busy) return;
    const filters = Array.from(root.current?.querySelectorAll<HTMLElement>('.par-chip') ?? []).map((c: HTMLElement) => (c.textContent || '').replace(/close$/, '').trim());
    const meta = { title: 'گزارش پروژه‌ها و اقدامات', kind: tab === 'list' ? 'نمای لیستی' : 'نمای داشبوردی', filters };
    setBusy(kind);
    try {
      if (kind === 'print') await printReport(content.current, meta);
      else await pdfReport(content.current, meta, `projects-actions-report-${jalaliStamp()}.pdf`);
    } catch (err) {
      window.alert('ساخت خروجی انجام نشد. دوباره تلاش کنید.');
      console.error(err);
    } finally { setBusy(''); }
  }
  useEffect(() => { store.set(`${keyBase}:filters`, filters); }, [filters, keyBase]);
  useEffect(() => { store.set(`${keyBase}:ui`, { tab }); }, [tab, keyBase]);
  useEffect(() => { store.set(`${keyBase}:views`, views); }, [views, keyBase]);

  const allRows = useMemo(() => buildRows(projects, actions), [projects, actions]);
  const rows = useMemo(() => applyFilters(allRows, filters), [allRows, filters]);
  const previous = useMemo(() => { const p = previousRange(filters.from, filters.to); return p ? summarize(applyFilters(allRows, filters, p)) : null; }, [allRows, filters]);
  const unitOptions = useMemo(() => [...new Set<string>([...owningUnits, ...allRows.flatMap(r => [r.unitLevel2, r.unit])].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fa')), [allRows, owningUnits]);
  const peopleOptions = useMemo(() => {
    const ids = new Set<string>([...users.map(u => u.id), ...allRows.flatMap(r => [r.managerId, r.ownerId])].filter((x): x is string => !!x));
    return [...ids].map(id => ({ value: id, label: personName(users, id) })).sort((a, b) => a.label.localeCompare(b.label, 'fa'));
  }, [allRows, users]);
  const projectOptions = useMemo(() => projects.map(p => ({ value: p.id, label: p.name })).sort((a, b) => a.label.localeCompare(b.label, 'fa')), [projects]);

  const open = (r: ReportRow) => r.kind === 'action'
    ? onNavigate('define_action', { action: r.original, from: 'reports' })
    : onNavigate('project_dashboard_details', { project: r.original, from: 'reports' });
  function saveView() {
    const name = viewName.trim(); if (!name) return;
    setViews(v => [...v.filter(x => x.name !== name), { name, filters }]); setNaming(false); setViewName('');
  }

  return <section className="par" dir="rtl" aria-label="گزارش پروژه‌ها و اقدامات" ref={root}>
    <div className="par-head">
      <div className="par-tabs no-print" role="tablist" aria-label="نوع نمایش">
        <button type="button" role="tab" aria-selected={tab === 'dashboard'} className={tab === 'dashboard' ? 'on' : ''} onClick={() => setTab('dashboard')}><span className="material-symbols-outlined" aria-hidden="true">monitoring</span>داشبوردی</button>
        <button type="button" role="tab" aria-selected={tab === 'list'} className={tab === 'list' ? 'on' : ''} onClick={() => setTab('list')}><span className="material-symbols-outlined" aria-hidden="true">table_rows</span>لیستی</button>
      </div>
      <div className="par-views no-print">
        <select value="" onChange={e => { const v = views.find(x => x.name === e.target.value); if (v) setFilters({ ...EMPTY_FILTERS, ...v.filters }); }} aria-label="گزارش‌های ذخیره‌شده">
          <option value="">{views.length ? 'گزارش‌های ذخیره‌شده…' : 'گزارش ذخیره‌شده‌ای نیست'}</option>
          {views.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
        </select>
        {naming ? <span className="par-name-view"><input autoFocus value={viewName} placeholder="نام گزارش" onChange={e => setViewName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveView(); if (e.key === 'Escape') setNaming(false); }} aria-label="نام گزارش" />
          <button type="button" className="save-btn" onClick={saveView} disabled={!viewName.trim()}>ذخیره</button><button type="button" className="cancel-btn" onClick={() => setNaming(false)}>انصراف</button></span>
          : <button type="button" className="cancel-btn" onClick={() => setNaming(true)}><span className="material-symbols-outlined" aria-hidden="true">bookmark_add</span>ذخیره این نما</button>}
        {views.length > 0 && !naming && <button type="button" className="action-icon" title="حذف گزارش‌های ذخیره‌شده" aria-label="حذف گزارش‌های ذخیره‌شده" onClick={() => { if (window.confirm('همه گزارش‌های ذخیره‌شده حذف شوند؟')) setViews([]); }}><span className="material-symbols-outlined" aria-hidden="true">bookmark_remove</span></button>}
      </div>
      <p className="par-count-line">{fa(rows.length)} از {fa(allRows.length)} مورد</p>
      <div className="par-output no-print">
        <button type="button" className="cancel-btn" onClick={() => output('print')} disabled={!!busy || allRows.length === 0} title="چاپ گزارش با سربرگ، تاریخ، ساعت و IP">
          <span className="material-symbols-outlined" aria-hidden="true">print</span>{busy === 'print' ? 'آماده‌سازی…' : 'چاپ'}</button>
        <button type="button" className="save-btn" onClick={() => output('pdf')} disabled={!!busy || allRows.length === 0} title="دریافت فایل PDF با سربرگ، تاریخ، ساعت و IP">
          <span className="material-symbols-outlined" aria-hidden="true">picture_as_pdf</span>{busy === 'pdf' ? 'در حال ساخت PDF…' : 'PDF'}</button>
      </div>
    </div>
    <FilterBar filters={filters} setFilters={setFilters} unitOptions={unitOptions} peopleOptions={peopleOptions} projectOptions={projectOptions} open={filtersOpen} setOpen={setFiltersOpen} />
    <div ref={content} className="par-content">
    {allRows.length === 0 ? <div className="par-first-run"><span className="material-symbols-outlined" aria-hidden="true">query_stats</span>
      <strong>هنوز پروژه یا اقدامی ثبت نشده است.</strong>با ثبت اولین پروژه یا اقدام، گزارش و نمودارها همین‌جا ساخته می‌شوند.</div>
    : tab === 'list'
      ? <ListTab rows={rows} users={users} onOpen={open} storageKey={`${keyBase}:list`} />
      : <DashboardTab rows={rows} previous={previous} users={users} filters={filters} setFilters={setFilters} onOpen={open} />}
    </div>
  </section>;
}
