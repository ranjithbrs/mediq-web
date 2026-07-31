import { format } from "date-fns";

/**
 * Converts a local Date object to a YYYY-MM-DD string, avoiding UTC timezone shifts.
 */
export const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Parses a YYYY-MM-DD string into a local midnight Date object, avoiding UTC timezone shifts.
 */
export const parseLocalDateString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Returns the current date as a local YYYY-MM-DD string.
 */
export const getTodayLocalDateString = (): string => {
  return toLocalDateString(new Date());
};

/**
 * Returns a local Date object representing the start of today (midnight local time).
 */
export const getTodayLocalMidnight = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Returns true if the given local Date is strictly before today's local midnight.
 */
export const isBeforeToday = (date: Date): boolean => {
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return checkDate < getTodayLocalMidnight();
};

/**
 * Formats a YYYY-MM-DD date string into a user-facing display string (MMM dd, yyyy) using local timezone parsing.
 */
export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const date = parseLocalDateString(dateStr);
  return format(date, "MMM dd, yyyy");
};
