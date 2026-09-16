/**
 * UTC COMPUTRA - Indian Standard Time (IST) Engine
 * Timezone: Asia/Kolkata (UTC+5:30)
 * 
 * Provides consistent IST date/time parsing, formatting, calculations,
 * and timestamp generation across the entire application.
 */

export const IST_TIMEZONE = 'Asia/Kolkata';
export const IST_OFFSET_STR = '+05:30';

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_FULL = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

/**
 * Parses any date-like input safely into a Date object representing the time in IST.
 * For date-only inputs (like '2026-09-12' or '12/09/2026'), assigns midday IST
 * (12:00:00+05:30) to prevent date-boundary shifting regardless of client browser timezone.
 */
export function parseISTDate(dateInput?: string | Date | number | null): Date | null {
  if (!dateInput && dateInput !== 0) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  if (typeof dateInput === 'number') {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof dateInput === 'string') {
    const s = dateInput.trim();
    if (!s) return null;

    // YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      return new Date(`${s}T12:00:00+05:30`);
    }

    // DD/MM/YYYY or DD-MM-YYYY format
    const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy) {
      const day = dmy[1].padStart(2, '0');
      const month = dmy[2].padStart(2, '0');
      const year = dmy[3];
      return new Date(`${year}-${month}-${day}T12:00:00+05:30`);
    }

    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Extracts date and time breakdown parts explicitly in Asia/Kolkata (IST).
 */
export function getISTParts(dateInput?: string | Date | number | null) {
  const d = parseISTDate(dateInput) || new Date();
  if (isNaN(d.getTime())) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    weekday: 'short',
    hour12: false
  });

  const parts = formatter.formatToParts(d);
  const m: Record<string, string> = {};
  for (const p of parts) {
    m[p.type] = p.value;
  }

  const year = parseInt(m.year, 10);
  const month = parseInt(m.month, 10); // 1-12
  const day = parseInt(m.day, 10);
  let hour = parseInt(m.hour, 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(m.minute, 10);
  const second = parseInt(m.second, 10);
  const weekdayShort = m.weekday || 'Sun';
  const weekdayIndex = WEEKDAYS_SHORT.indexOf(weekdayShort);

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    hour12: hour % 12 || 12,
    ampm: hour >= 12 ? 'PM' : 'AM',
    monthShort: MONTH_NAMES_SHORT[month - 1] || '',
    monthFull: MONTH_NAMES_FULL[month - 1] || '',
    weekdayShort,
    weekdayFull: weekdayIndex >= 0 ? WEEKDAYS_FULL[weekdayIndex] : weekdayShort
  };
}

/**
 * Returns today's date formatted as YYYY-MM-DD strictly in Indian Standard Time (Asia/Kolkata).
 * Perfect for <input type="date" /> values and daily attendance checks.
 */
export function getISTDateString(dateInput?: string | Date | number | null): string {
  const d = parseISTDate(dateInput) || new Date();
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
}

/**
 * Alias for getISTDateString() for the current moment.
 */
export function getISTToday(): string {
  return getISTDateString(new Date());
}

/**
 * Generates an ISO 8601 string stamped with the explicit +05:30 IST offset:
 * e.g. "2026-09-12T14:30:00.000+05:30"
 * This ensures that anywhere it is stored, viewed, or parsed, it reflects
 * true Indian Standard Time.
 */
export function getISTISOString(dateInput?: string | Date | number | null): string {
  const d = parseISTDate(dateInput) || new Date();
  if (isNaN(d.getTime())) {
    return new Date().toISOString();
  }

  const p = getISTParts(d);
  if (!p) return new Date().toISOString();

  const pad = (n: number) => String(n).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');

  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}.${ms}+05:30`;
}

/**
 * Returns the current Month & Year in IST (e.g. "September 2026").
 */
export function getISTCurrentMonthYear(dateInput?: string | Date | number | null): string {
  const p = getISTParts(dateInput);
  if (!p) return '';
  return `${p.monthFull} ${p.year}`;
}

/**
 * Returns the previous month name with the current year in IST (e.g. "August 2026" when current month is September 2026).
 */
export function getISTPreviousMonthCurrentYear(dateInput?: string | Date | number | null): string {
  const p = getISTParts(dateInput);
  if (!p) return '';
  const prevMonthIndex = p.month === 1 ? 11 : p.month - 2;
  const prevMonthName = MONTH_NAMES_FULL[prevMonthIndex] || '';
  return `${prevMonthName} ${p.year}`;
}

/**
 * Robust, single-pass date formatter strictly evaluated in Asia/Kolkata (IST).
 * Compatible with common date-fns / Moment format tokens:
 * yyyy, yy, MMMM, MMM, MM, M, dd, d, EEEE, EEE, HH, H, hh, h, mm, m, ss, s, a, z
 */
export function formatIST(dateInput: string | Date | number | undefined | null, formatStr = 'dd MMM yyyy'): string {
  if (!dateInput && dateInput !== 0) return 'N/A';
  
  const p = getISTParts(dateInput);
  if (!p) return 'N/A';

  const pad = (n: number) => String(n).padStart(2, '0');

  const tokens: Record<string, string> = {
    yyyy: String(p.year),
    yy: String(p.year).slice(-2),
    MMMM: p.monthFull,
    MMM: p.monthShort,
    MM: pad(p.month),
    M: String(p.month),
    dd: pad(p.day),
    d: String(p.day),
    EEEE: p.weekdayFull,
    EEE: p.weekdayShort,
    EE: p.weekdayShort,
    E: p.weekdayShort,
    HH: pad(p.hour),
    H: String(p.hour),
    hh: pad(p.hour12),
    h: String(p.hour12),
    mm: pad(p.minute),
    m: String(p.minute),
    ss: pad(p.second),
    s: String(p.second),
    a: p.ampm,
    zzzz: 'Indian Standard Time',
    zzz: 'IST',
    z: 'IST'
  };

  const tokenRegex = /yyyy|yy|MMMM|MMM|MM|M|dd|d|EEEE|EEE|EE|E|HH|H|hh|h|mm|m|ss|s|a|zzzz|zzz|z/g;
  return formatStr.replace(tokenRegex, (match) => tokens[match] !== undefined ? tokens[match] : match);
}

/**
 * Drop-in replacement for safeFormat that routes through formatIST.
 */
export function safeFormat(date: string | Date | number | undefined | null, formatStr = 'dd MMM yyyy'): string {
  return formatIST(date, formatStr);
}

/**
 * Standard readable date in IST (e.g. "12 Sep 2026").
 */
export function formatISTDate(dateInput: string | Date | number | undefined | null): string {
  return formatIST(dateInput, 'dd MMM yyyy');
}

/**
 * Standard date & time in IST (e.g. "12 Sep 2026, 02:30 PM IST").
 */
export function formatISTDateTime(dateInput: string | Date | number | undefined | null, includeIST = true): string {
  return formatIST(dateInput, `dd MMM yyyy, hh:mm a${includeIST ? ' IST' : ''}`);
}

/**
 * Standard time in IST (e.g. "02:30 PM IST" or "02:30:15 PM IST").
 */
export function formatISTTime(dateInput: string | Date | number | undefined | null, includeSeconds = false, includeIST = true): string {
  const pattern = includeSeconds ? 'hh:mm:ss a' : 'hh:mm a';
  return formatIST(dateInput, `${pattern}${includeIST ? ' IST' : ''}`);
}

/**
 * Comprehensive banner clock string for dashboards.
 * e.g. "Saturday, 12 Sep 2026 • 02:30:15 PM IST"
 */
export function getISTClockString(dateInput: Date = new Date()): string {
  return formatIST(dateInput, 'EEEE, dd MMM yyyy • hh:mm:ss a IST');
}

export interface BillingMonthOption {
  value: string;
  label: string;
  isCurrent: boolean;
  offset: number;
}

/**
 * Returns billing month quick-access options in Indian Standard Time (IST).
 * Includes the Previous 3 Months and the Current Month.
 * Formatted strictly as Month & Year only (no date/day numbers), e.g.
 * ["June 2026", "July 2026", "August 2026", "September 2026"].
 */
export function getISTBillingMonthOptions(dateInput?: string | Date | number | null): BillingMonthOption[] {
  const parts = getISTParts(dateInput);
  const baseYear = parts ? parts.year : new Date().getFullYear();
  const baseMonthIndex = parts ? parts.month - 1 : new Date().getMonth();

  const options: BillingMonthOption[] = [];
  // -3 (3 months ago), -2 (2 months ago), -1 (previous month), 0 (current month)
  for (let offset = -3; offset <= 0; offset++) {
    const targetDate = new Date(baseYear, baseMonthIndex + offset, 1);
    const monthName = MONTH_NAMES_FULL[targetDate.getMonth()];
    const year = targetDate.getFullYear();
    const value = `${monthName} ${year}`;
    options.push({
      value,
      label: value,
      isCurrent: offset === 0,
      offset
    });
  }
  return options;
}
