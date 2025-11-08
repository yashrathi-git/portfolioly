/**
 * Core Zod schemas for portfolio data structures.
 * These schemas align with the backend Pydantic models.
 */

import { z } from "zod";

/**
 * Structured date information with numeric month and year.
 * Used for work experience, education, and other date-based fields.
 */
const DateInfoObjectSchema = z.object({
  /** Month (1-12) */
  month: z.number().int().min(1).max(12).nullable().optional(),
  /** 4-digit year (1900-2100) */
  year: z.number().int().min(1900).max(2100).nullable().optional(),
});

export const DateInfoSchema = z.preprocess((val) => {
  if (val === undefined || val === null || val === "") {
    return undefined;
  }

  if (typeof val === "number") {
    // Interpret bare year numbers as the year field.
    return { year: val };
  }

  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) {
      return undefined;
    }

    // Attempt to parse simple YYYY or YYYY-MM formats.
    const yearMatch = trimmed.match(
      /^(?<year>\d{4})(?:[-/](?<month>\d{1,2}))?$/
    );
    if (yearMatch?.groups?.year) {
      const year = Number(yearMatch.groups.year);
      const month = yearMatch.groups.month
        ? Number(yearMatch.groups.month)
        : undefined;
      return {
        year: Number.isFinite(year) ? year : undefined,
        month: Number.isFinite(month ?? NaN) ? month : undefined,
      };
    }

    return undefined;
  }

  if (typeof val === "object" && !Array.isArray(val)) {
    const maybeTimestamp = val as {
      seconds?: number;
      nanoseconds?: number;
      toDate?: () => Date;
    };

    if (typeof maybeTimestamp.toDate === "function") {
      const date = maybeTimestamp.toDate();
      if (date instanceof Date && !Number.isNaN(date.valueOf())) {
        return {
          year: date.getUTCFullYear(),
          month: date.getUTCMonth() + 1,
        };
      }
    }

    if (
      typeof maybeTimestamp.seconds === "number" &&
      typeof maybeTimestamp.nanoseconds === "number"
    ) {
      const millis =
        maybeTimestamp.seconds * 1000 +
        Math.floor(maybeTimestamp.nanoseconds / 1_000_000);
      const date = new Date(millis);
      if (!Number.isNaN(date.valueOf())) {
        return {
          year: date.getUTCFullYear(),
          month: date.getUTCMonth() + 1,
        };
      }
    }

    return val;
  }

  return undefined;
}, DateInfoObjectSchema.optional());

export type DateInfo = z.infer<typeof DateInfoSchema>;

/**
 * Supported profile types for user social/professional profiles.
 */
export const ProfileTypeSchema = z.enum([
  "linkedin",
  "github",
  "website",
  "portfolio",
  "youtube",
  "twitter",
  "scholar",
  "other",
]);

export type ProfileType = z.infer<typeof ProfileTypeSchema>;

/**
 * User profile/social media link information.
 */
export const ProfileSchema = z.object({
  type: ProfileTypeSchema.nullable().optional(),
  url: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;
