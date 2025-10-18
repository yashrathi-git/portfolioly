/**
 * Date formatting utilities for converting DateInfo to display strings.
 */

import type { DateInfo } from "../schemas/core";

/**
 * Month names for date formatting.
 */
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * Formats a DateInfo object to a human-readable string.
 *
 * @param dateInfo - The date information to format
 * @returns Formatted date string or empty string if no date info
 *
 * @example
 * ```typescript
 * formatDateInfo({ month: 1, year: 2020 }) // "Jan 2020"
 * formatDateInfo({ year: 2020 }) // "2020"
 * formatDateInfo(undefined) // ""
 * ```
 */
export function formatDateInfo(dateInfo?: DateInfo): string {
  if (!dateInfo) return "";

  if (dateInfo.year && dateInfo.month) {
    return `${MONTH_NAMES[dateInfo.month - 1]} ${dateInfo.year}`;
  } else if (dateInfo.year) {
    return dateInfo.year.toString();
  }

  return "";
}
