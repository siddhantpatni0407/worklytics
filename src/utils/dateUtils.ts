import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  parseISO,
  getYear,
  getMonth,
  addMonths,
  subMonths,
} from "date-fns";

export const formatDateISO = (date: Date): string => format(date, "yyyy-MM-dd");
export const formatDisplayDate = (dateStr: string): string =>
  format(parseISO(dateStr), "dd MMM yyyy");
export const formatDisplayMonth = (year: number, month: number): string =>
  format(new Date(year, month - 1, 1), "MMMM yyyy");
export const todayISO = (): string => formatDateISO(new Date());
export const currentYear = (): number => getYear(new Date());
export const currentMonth = (): number => getMonth(new Date()) + 1; // 1-based

/**
 * Returns an array of Date objects that fill the 6-week calendar grid for
 * the given year/month (including padding days from prev/next month).
 */
export function getCalendarGrid(year: number, month: number): Date[] {
  const firstDay = startOfMonth(new Date(year, month - 1, 1));
  const lastDay = endOfMonth(firstDay);
  const gridStart = startOfWeek(firstDay, { weekStartsOn: 0 }); // Sunday
  const gridEnd = endOfWeek(lastDay, { weekStartsOn: 0 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

export { isSameMonth, isToday, parseISO, format, addMonths, subMonths, getYear, getMonth };

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const SHORT_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function yearRange(centerYear: number, span = 5): number[] {
  const years: number[] = [];
  for (let y = centerYear - span; y <= centerYear + span; y++) years.push(y);
  return years;
}

/** Build a year list from an explicit start–end range (used in Settings). */
export function yearRangeFromBounds(start: number, end: number): number[] {
  const years: number[] = [];
  for (let y = start; y <= end; y++) years.push(y);
  return years;
}

/** Format date as "Mon, 24 Apr 2026" */
export const formatDisplayDateShort = (date: Date): string =>
  format(date, "EEE, dd MMM yyyy");
