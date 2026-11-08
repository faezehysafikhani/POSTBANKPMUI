import { toGregorian, toJalali } from '../utils';

export const PERSIAN_MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
export function gregorianDay(year: number, month: number, day: number) {
  const value = toGregorian(year, month, day);
  return new Date(value.gy, value.gm - 1, value.gd, 12);
}
export function moveMonth(year: number, month: number, delta: number) {
  const index = year * 12 + month - 1 + delta;
  return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 + 1 };
}
export function monthGrid(year: number, month: number) {
  const first = gregorianDay(year, month, 1);
  const next = moveMonth(year, month, 1);
  const nextFirst = gregorianDay(next.year, next.month, 1);
  const days = Math.round((Date.UTC(nextFirst.getFullYear(), nextFirst.getMonth(), nextFirst.getDate()) - Date.UTC(first.getFullYear(), first.getMonth(), first.getDate())) / 86400000);
  const offset = (first.getDay() + 1) % 7; // Saturday is the first day in the RTL grid.
  return { days, offset, cells: Array.from({ length: Math.ceil((days + offset) / 7) * 7 }, (_, i) => i >= offset && i < offset + days ? i - offset + 1 : null) };
}
export function tehranDay(value: Date | string = new Date()) {
  const date = typeof value === 'string' ? new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`) : value;
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Tehran', calendar:'gregory', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(date);
  const get = (type: string) => Number(parts.find(part => part.type === type)!.value);
  return toJalali(get('year'), get('month'), get('day'));
}
export const persianDateKey = (year: number, month: number, day: number) => `${year}/${String(month).padStart(2,'0')}/${String(day).padStart(2,'0')}`;
export function tehranDateTime(date: string, time: string) {
  const [year, month, day] = date.split('/').map(Number);
  if (!year || month < 1 || month > 12 || day < 1 || day > monthGrid(year, month).days || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('تاریخ یا ساعت معتبر نیست.');
  const { gy, gm, gd } = toGregorian(year, month, day);
  return new Date(`${gy}-${String(gm).padStart(2,'0')}-${String(gd).padStart(2,'0')}T${time}:00+03:30`).toISOString();
}
