// Nepali (Bikram Sambat) Date Utilities

export interface NepaliMonthInfo {
  index: number; // 1 to 12
  nameNp: string;
  nameEn: string;
  shortNp: string;
  defaultDays: number;
}

export const NEPALI_MONTHS: NepaliMonthInfo[] = [
  { index: 1, nameNp: 'बैशाख', nameEn: 'Baisakh', shortNp: 'बैशाख', defaultDays: 31 },
  { index: 2, nameNp: 'जेठ', nameEn: 'Jestha', shortNp: 'जेठ', defaultDays: 31 },
  { index: 3, nameNp: 'असार', nameEn: 'Ashadh', shortNp: 'असार', defaultDays: 32 },
  { index: 4, nameNp: 'साउन', nameEn: 'Shrawan', shortNp: 'साउन', defaultDays: 32 },
  { index: 5, nameNp: 'भदौ', nameEn: 'Bhadra', shortNp: 'भदौ', defaultDays: 31 },
  { index: 6, nameNp: 'असोज', nameEn: 'Ashwin', shortNp: 'असोज', defaultDays: 30 },
  { index: 7, nameNp: 'कात्तिक', nameEn: 'Kartik', shortNp: 'कात्तिक', defaultDays: 30 },
  { index: 8, nameNp: 'मंसिर', nameEn: 'Mangsir', shortNp: 'मंसिर', defaultDays: 29 },
  { index: 9, nameNp: 'पुस', nameEn: 'Poush', shortNp: 'पुस', defaultDays: 30 },
  { index: 10, nameNp: 'माघ', nameEn: 'Magh', shortNp: 'माघ', defaultDays: 29 },
  { index: 11, nameNp: 'फागुन', nameEn: 'Falgun', shortNp: 'फागुन', defaultDays: 30 },
  { index: 12, nameNp: 'चैत', nameEn: 'Chaitra', shortNp: 'चैत', defaultDays: 30 },
];

const NP_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
const EN_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function toNpDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => NP_DIGITS[Number(d)] || d);
}

export function toEnDigits(input: string | number): string {
  return String(input).replace(/[०-९]/g, (d) => {
    const idx = NP_DIGITS.indexOf(d);
    return idx !== -1 ? String(idx) : d;
  });
}

export interface ParsedBsDate {
  year: string; // e.g. "२०८१" or "2081"
  yearEn: number; // e.g. 2081
  month: number; // 1 to 12
  day: number; // 1 to 32
  isDevanagari: boolean;
}

export const DEFAULT_CURRENT_BS_YEAR = '२०८१';

/**
 * Parses any Nepali date string like "२०८१-०६-०३", "2081-06-03", "2081/06/03", or "०६-०३"
 */
export function parseBsDate(dateStr?: string, fallbackYear = DEFAULT_CURRENT_BS_YEAR): ParsedBsDate {
  if (!dateStr || !dateStr.trim()) {
    return {
      year: fallbackYear,
      yearEn: Number(toEnDigits(fallbackYear)) || 2081,
      month: 6,
      day: 3,
      isDevanagari: true,
    };
  }

  const trimmed = dateStr.trim();
  const isDev = /[०-९]/.test(trimmed);
  const enStr = toEnDigits(trimmed);

  // Split by '-' or '/' or '.' or space
  const parts = enStr.split(/[-/.\s]+/).filter(Boolean);

  let yearEn = Number(toEnDigits(fallbackYear)) || 2081;
  let month = 6;
  let day = 3;

  if (parts.length >= 3) {
    // Format: YYYY-MM-DD
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && y > 1900 && y < 2200) yearEn = y;
    if (!isNaN(m) && m >= 1 && m <= 12) month = m;
    if (!isNaN(d) && d >= 1 && d <= 32) day = d;
  } else if (parts.length === 2) {
    // Format: MM-DD (User only gave Month and Day!)
    const m = parseInt(parts[0], 10);
    const d = parseInt(parts[1], 10);
    if (!isNaN(m) && m >= 1 && m <= 12) month = m;
    if (!isNaN(d) && d >= 1 && d <= 32) day = d;
  } else if (parts.length === 1) {
    const val = parseInt(parts[0], 10);
    if (!isNaN(val) && val >= 1 && val <= 32) {
      day = val;
    }
  }

  const yearStr = isDev ? toNpDigits(yearEn) : String(yearEn);

  return {
    year: yearStr,
    yearEn,
    month,
    day,
    isDevanagari: isDev,
  };
}

/**
 * Builds a standardized Nepali date string: e.g. "२०८१-०६-०३"
 */
export function buildBsDate(year: string | number, month: number, day: number, devanagari = true): string {
  const yStr = devanagari ? toNpDigits(year) : toEnDigits(year);
  const mPadded = String(Math.max(1, Math.min(12, month))).padStart(2, '0');
  const dPadded = String(Math.max(1, Math.min(32, day))).padStart(2, '0');

  const mStr = devanagari ? toNpDigits(mPadded) : mPadded;
  const dStr = devanagari ? toNpDigits(dPadded) : dPadded;

  return `${yStr}-${mStr}-${dStr}`;
}

/**
 * Get human readable Nepali date: e.g. "२०८१ असोज ३ गते"
 */
export function getReadableBsDate(dateStr: string): string {
  const parsed = parseBsDate(dateStr);
  const mInfo = NEPALI_MONTHS.find((m) => m.index === parsed.month) || NEPALI_MONTHS[5];
  const dayStr = parsed.isDevanagari ? toNpDigits(parsed.day) : String(parsed.day);
  return `${parsed.year} ${mInfo.nameNp} ${dayStr} गते`;
}
