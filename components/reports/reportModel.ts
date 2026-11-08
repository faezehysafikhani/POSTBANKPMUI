// «گزارش پروژه‌ها و اقدامات»: the data side. Projects and actions become one kind of row, the
// filters are applied here, and the list / dashboard tabs only lay the result out.
// Everything is computed from the data the app already has; nothing is fetched.
import type { ActionItem, Project, User, WorkStatus } from '../../types';
import { enrichProjectWithProgress, getUnitLevel2, toGregorian, toJalali } from '../../utils';

export type RowKind = 'waterfall' | 'agile' | 'action';
export type Approval = 'Draft' | 'Pending' | 'Approved' | 'Rejected';
export type Timing = 'delayed' | 'dueSoon' | 'onTime' | 'done' | 'noDate';
export type Source = 'independent' | 'project' | 'risk' | 'stakeholder';

export interface ReportRow {
  key: string;
  kind: RowKind;
  id: string;
  name: string;
  code: string;
  unit: string;
  unitLevel2: string;
  managerId: string | null;
  ownerId: string | null;
  start: string | null; // YYYY-MM-DD (Gregorian)
  end: string | null;
  status: WorkStatus;
  approval: Approval;
  cost: number | null;
  progress: number | null; // 0..100
  /** The progress was calculated by the backend (not just «completed = 100»); only these count in averages. */
  measured: boolean;
  plannedProgress: number | null;
  source: Source | null;
  projectId: string | null;
  projectName: string;
  timing: Timing;
  delayDays: number; // > 0 only for delayed rows
  original: Project | ActionItem;
}

export const KIND_LABEL: Record<RowKind, string> = { waterfall: 'پروژه آبشاری', agile: 'پروژه چابک', action: 'اقدام' };
export const STATUS_LABEL: Record<WorkStatus, string> = { 'Planning': 'برنامه‌ریزی', 'In Progress': 'در حال انجام', 'On Hold': 'متوقف شده', 'Completed': 'تکمیل شده' };
export const APPROVAL_LABEL: Record<Approval, string> = { Draft: 'پیش‌نویس', Pending: 'در انتظار تأیید', Approved: 'تأییدشده', Rejected: 'ردشده' };
export const TIMING_LABEL: Record<Timing, string> = { delayed: 'تأخیردار', dueSoon: 'نزدیک سررسید', onTime: 'در موعد', done: 'تکمیل شده', noDate: 'بدون تاریخ' };
export const SOURCE_LABEL: Record<Source, string> = { independent: 'مستقل', project: 'از پروژه', risk: 'از ریسک', stakeholder: 'از ذینفع' };
export const STATUSES: WorkStatus[] = ['In Progress', 'Planning', 'On Hold', 'Completed'];
export const KINDS: RowKind[] = ['waterfall', 'agile', 'action'];
export const APPROVALS: Approval[] = ['Approved', 'Pending', 'Draft', 'Rejected'];
export const TIMINGS: Timing[] = ['delayed', 'dueSoon', 'onTime', 'done', 'noDate'];
export const SOURCES: Source[] = ['independent', 'project', 'risk', 'stakeholder'];
/** Days ahead that count as «نزدیک سررسید». */
export const DUE_SOON_DAYS = 7;

// ---------- dates ----------
const pad = (n: number) => String(n).padStart(2, '0');
export const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Today in Tehran as YYYY-MM-DD. */
export function todayIso(): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return parts.slice(0, 10);
}
const dayNumber = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d) / 86400000; };
export const daysBetween = (fromIso: string, toIso: string) => Math.round(dayNumber(toIso) - dayNumber(fromIso));
const dayOf = (value?: string | null) => (value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null);
export function jalaliIso(jy: number, jm: number, jd: number): string { const g = toGregorian(jy, jm, jd); return `${g.gy}-${pad(g.gm)}-${pad(g.gd)}`; }
export function jalaliOf(iso: string) { const [y, m, d] = iso.split('-').map(Number); return toJalali(y, m, d); }
const jalaliMonthDays = (jy: number, jm: number) => jm <= 6 ? 31 : jm <= 11 ? 30 : (daysBetween(jalaliIso(jy, 12, 1), jalaliIso(jy + 1, 1, 1)));
const dateFormat = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' });
export const formatDate = (iso: string | null) => (iso ? dateFormat.format(new Date(`${iso}T12:00:00`)) : '—');
export const PERSIAN_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

export type DatePreset = 'thisMonth' | 'thisQuarter' | 'thisYear' | 'lastYear';
export const PRESET_LABEL: Record<DatePreset, string> = { thisMonth: 'این ماه', thisQuarter: 'فصل جاری', thisYear: 'سال جاری', lastYear: 'سال قبل' };
/** A Persian calendar period as Gregorian [from, to] (both inclusive). */
export function presetRange(preset: DatePreset, today = todayIso()): [string, string] {
  const { jy, jm } = jalaliOf(today);
  if (preset === 'thisMonth') return [jalaliIso(jy, jm, 1), jalaliIso(jy, jm, jalaliMonthDays(jy, jm))];
  if (preset === 'thisQuarter') { const q = Math.floor((jm - 1) / 3) * 3 + 1; return [jalaliIso(jy, q, 1), jalaliIso(jy, q + 2, jalaliMonthDays(jy, q + 2))]; }
  const year = preset === 'thisYear' ? jy : jy - 1;
  return [jalaliIso(year, 1, 1), jalaliIso(year, 12, jalaliMonthDays(year, 12))];
}

// ---------- rows ----------
function approvalOfProject(p: Project): Approval {
  return p.approvalStatus === 'Approved' ? 'Approved' : p.approvalStatus === 'Pending Approval' ? 'Pending' : p.approvalStatus === 'Rejected' ? 'Rejected' : 'Draft';
}
function approvalOfAction(a: ActionItem): Approval {
  return a.isApproved ? 'Approved' : a.isRejected ? 'Rejected' : a.isPending ? 'Pending' : 'Draft';
}
function timingOf(status: WorkStatus, end: string | null, today: string): { timing: Timing; delayDays: number } {
  if (status === 'Completed') return { timing: 'done', delayDays: 0 };
  if (!end) return { timing: 'noDate', delayDays: 0 };
  const left = daysBetween(today, end);
  if (left < 0) return { timing: 'delayed', delayDays: -left };
  return { timing: left <= DUE_SOON_DAYS ? 'dueSoon' : 'onTime', delayDays: 0 };
}

export function buildRows(projects: Project[], actions: ActionItem[], today = todayIso()): ReportRow[] {
  const projectNames = new Map(projects.map(p => [p.id, p.name]));
  const rows: ReportRow[] = [];
  for (const raw of projects) {
    const p = enrichProjectWithProgress(raw);
    const start = dayOf(p.startDate), end = dayOf(p.endDate);
    const hasFigures = !!raw.progressFigures;
    rows.push({
      key: `p:${p.id}`, kind: p.type === 'agile' ? 'agile' : 'waterfall', id: p.id, name: p.name || '—', code: p.code || '',
      unit: p.owningUnit || '', unitLevel2: getUnitLevel2(p.owningUnit) || p.owningUnit || '',
      managerId: p.projectManagerId ?? null, ownerId: p.ownerId ?? null, start, end, status: p.status, approval: approvalOfProject(p),
      cost: typeof p.cost === 'number' ? p.cost : null,
      progress: hasFigures ? Math.round(p.actualProgress) : (p.status === 'Completed' ? 100 : null),
      plannedProgress: hasFigures ? Math.round(p.plannedProgress) : null, measured: hasFigures,
      source: null, projectId: null, projectName: '', ...timingOf(p.status, end, today), original: raw,
    });
  }
  for (const a of actions) {
    const start = dayOf(a.startDate), end = dayOf(a.endDate);
    const source: Source = a.sourceType === 'risk' ? 'risk' : a.sourceType === 'stakeholder' ? 'stakeholder' : a.projectId ? 'project' : 'independent';
    rows.push({
      key: `a:${a.id}`, kind: 'action', id: a.id, name: a.title || '—', code: '',
      unit: a.owningUnit || '', unitLevel2: getUnitLevel2(a.owningUnit) || a.owningUnit || '',
      managerId: a.responsibleUserId ?? null, ownerId: a.ownerUserId ?? null, start, end, status: a.status, approval: approvalOfAction(a),
      cost: null, progress: a.status === 'Completed' ? 100 : null, plannedProgress: null, measured: false,
      source, projectId: a.projectId ?? null, projectName: a.sourceInfo?.projectName || (a.projectId ? projectNames.get(a.projectId) || '' : ''),
      ...timingOf(a.status, end, today), original: a,
    });
  }
  return rows;
}

// ---------- filters ----------
export type DateBasis = 'active' | 'start' | 'end';
export const DATE_BASIS_LABEL: Record<DateBasis, string> = { active: 'در جریان در بازه', start: 'تاریخ شروع', end: 'تاریخ پایان' };
export type PersonRole = 'any' | 'manager' | 'owner';
export const PERSON_ROLE_LABEL: Record<PersonRole, string> = { any: 'مدیر، مسئول یا مالک', manager: 'مدیر پروژه / مسئول اقدام', owner: 'مالک' };

export interface ReportFilters {
  kinds: RowKind[];
  from: string; to: string; dateBasis: DateBasis;
  statuses: WorkStatus[];
  approvals: Approval[];
  units: string[];
  people: string[]; personRole: PersonRole;
  sources: Source[];
  projectId: string;
  timings: Timing[];
  costMin: string; costMax: string;
  search: string;
}
export const EMPTY_FILTERS: ReportFilters = {
  kinds: [], from: '', to: '', dateBasis: 'active', statuses: [], approvals: [], units: [], people: [], personRole: 'any',
  sources: [], projectId: '', timings: [], costMin: '', costMax: '', search: '',
};

function inRange(row: ReportRow, from: string, to: string, basis: DateBasis): boolean {
  if (!from && !to) return true;
  const lo = from || '0000-01-01', hi = to || '9999-12-31';
  if (basis === 'start') return !!row.start && row.start >= lo && row.start <= hi;
  if (basis === 'end') return !!row.end && row.end >= lo && row.end <= hi;
  // «در جریان»: the item's own period overlaps the chosen one.
  if (!row.start && !row.end) return false;
  return (row.start || '0000-01-01') <= hi && (row.end || '9999-12-31') >= lo;
}
const norm = (s: string) => s.toLowerCase().replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/‌/g, ' ').trim();
const digits = (s: string) => s.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[,،\s]/g, '');

/** Every filter but the dates; the dates are applied separately so the previous period can be compared. */
export function applyFilters(rows: ReportRow[], f: ReportFilters, range: { from: string; to: string } = { from: f.from, to: f.to }): ReportRow[] {
  const search = norm(f.search);
  const costMin = f.costMin ? Number(digits(f.costMin)) : null, costMax = f.costMax ? Number(digits(f.costMax)) : null;
  return rows.filter(r => {
    if (f.kinds.length && !f.kinds.includes(r.kind)) return false;
    if (f.statuses.length && !f.statuses.includes(r.status)) return false;
    if (f.approvals.length && !f.approvals.includes(r.approval)) return false;
    if (f.units.length && !f.units.includes(r.unit) && !f.units.includes(r.unitLevel2)) return false;
    if (f.people.length) {
      const ids = f.personRole === 'manager' ? [r.managerId] : f.personRole === 'owner' ? [r.ownerId] : [r.managerId, r.ownerId];
      if (!ids.some(id => id && f.people.includes(id))) return false;
    }
    if (f.sources.length && (r.kind !== 'action' || !r.source || !f.sources.includes(r.source))) return false;
    if (f.projectId && r.projectId !== f.projectId && !(r.kind !== 'action' && r.id === f.projectId)) return false;
    if (f.timings.length && !f.timings.includes(r.timing)) return false;
    if (costMin !== null && !(r.cost !== null && r.cost >= costMin)) return false;
    if (costMax !== null && !(r.cost !== null && r.cost <= costMax)) return false;
    if (search && !norm(`${r.name} ${r.code}`).includes(search)) return false;
    return inRange(r, range.from, range.to, f.dateBasis);
  });
}
export function activeFilterCount(f: ReportFilters): number {
  return [f.kinds, f.statuses, f.approvals, f.units, f.people, f.sources, f.timings].filter(a => a.length).length
    + [f.from || f.to, f.projectId, f.costMin || f.costMax, f.search].filter(Boolean).length;
}
/** The window of the same length right before [from, to], for «نسبت به دوره قبل». */
export function previousRange(from: string, to: string): { from: string; to: string } | null {
  if (!from || !to) return null;
  const length = daysBetween(from, to) + 1;
  const end = new Date(`${from}T12:00:00`); end.setDate(end.getDate() - 1);
  const start = new Date(end); start.setDate(start.getDate() - (length - 1));
  return { from: isoOf(start), to: isoOf(end) };
}

// ---------- summaries ----------
export interface Summary { total: number; active: number; delayed: number; completed: number; cost: number; avgProgress: number | null }
export function summarize(rows: ReportRow[]): Summary {
  const withProgress = rows.filter(r => r.measured && r.progress !== null);
  return {
    total: rows.length,
    active: rows.filter(r => r.status === 'In Progress').length,
    delayed: rows.filter(r => r.timing === 'delayed').length,
    completed: rows.filter(r => r.status === 'Completed').length,
    cost: rows.reduce((sum, r) => sum + (r.cost ?? 0), 0),
    avgProgress: withProgress.length ? Math.round(withProgress.reduce((s, r) => s + (r.progress ?? 0), 0) / withProgress.length) : null,
  };
}
export function countBy<T extends string>(rows: ReportRow[], key: (r: ReportRow) => T): Map<T, ReportRow[]> {
  const map = new Map<T, ReportRow[]>();
  for (const r of rows) { const k = key(r); map.set(k, [...(map.get(k) || []), r]); }
  return map;
}
/** Started and completed (by end date) per Persian month over the last `months` months up to `to`. */
export function monthlyTrend(rows: ReportRow[], months: number, to = todayIso()) {
  const { jy, jm } = jalaliOf(to);
  const buckets: { label: string; key: string; started: number; finished: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    let y = jy, m = jm - i; while (m < 1) { m += 12; y--; }
    buckets.push({ label: `${PERSIAN_MONTHS[m - 1]} ${String(y).slice(2)}`, key: `${y}-${m}`, started: 0, finished: 0 });
  }
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  const keyOf = (iso: string) => { const j = jalaliOf(iso); return `${j.jy}-${j.jm}`; };
  for (const r of rows) {
    if (r.start) { const i = index.get(keyOf(r.start)); if (i !== undefined) buckets[i].started++; }
    if (r.status === 'Completed' && r.end) { const i = index.get(keyOf(r.end)); if (i !== undefined) buckets[i].finished++; }
  }
  return buckets;
}

// ---------- people ----------
export function personName(users: User[], id: string | null): string {
  if (!id) return '—';
  const u = users.find(x => x.id === id);
  return u ? (u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username) : '—';
}

// ---------- grouping ----------
export type GroupBy = 'none' | 'kind' | 'status' | 'unit' | 'unitLevel2' | 'manager' | 'approval' | 'timing';
export const GROUP_LABEL: Record<GroupBy, string> = { none: 'بدون گروه‌بندی', kind: 'نوع', status: 'وضعیت', unit: 'واحد مالک', unitLevel2: 'معاونت / اداره کل', manager: 'مدیر / مسئول', approval: 'وضعیت تأیید', timing: 'وضعیت زمانی' };
export function groupKey(row: ReportRow, by: GroupBy, users: User[]): string {
  switch (by) {
    case 'kind': return KIND_LABEL[row.kind];
    case 'status': return STATUS_LABEL[row.status] || row.status;
    case 'unit': return row.unit || 'تعیین نشده';
    case 'unitLevel2': return row.unitLevel2 || 'تعیین نشده';
    case 'manager': return personName(users, row.managerId);
    case 'approval': return APPROVAL_LABEL[row.approval];
    case 'timing': return TIMING_LABEL[row.timing];
    default: return '';
  }
}
