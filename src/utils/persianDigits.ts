/**
 * Utility functions for Persian digits and number localization across the Post Bank project management system.
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Converts English digits (0-9) to Persian digits (۰-۹).
 * Handles numbers, strings, and mixed text.
 */
export function toPersianDigits(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str.replace(/[0-9]/g, digit => PERSIAN_DIGITS[parseInt(digit, 10)]);
}

/**
 * Formats a number with comma separators and converts to Persian digits.
 * Example: 1250000 -> ۱,۲۵۰,۰۰۰
 */
export function toPersianNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '۰';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '۰';
  
  // Format with commas in thousands
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formatted = parts.join('/');
  return toPersianDigits(formatted);
}

/**
 * Formats a currency value with Persian numbers and Toman/Rial suffix.
 */
export function toPersianCurrency(amount: number | null | undefined, suffix = 'ریال'): string {
  if (amount === null || amount === undefined || isNaN(amount)) return `۰ ${suffix}`;
  return `${toPersianNumber(amount)} ${suffix}`;
}

/**
 * Formats a percentage value with Persian numbers and percent sign.
 */
export function toPersianPercent(percent: number | string | null | undefined): string {
  if (percent === null || percent === undefined || percent === '') return '۰٪';
  const num = typeof percent === 'string' ? Math.round(parseFloat(percent)) : Math.round(percent);
  return `${toPersianDigits(isNaN(num) ? 0 : num)}٪`;
}
