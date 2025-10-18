/**
 * Core Zod schemas for portfolio data structures.
 * These schemas align with the backend Pydantic models.
 */

import { z } from "zod";

/**
 * Structured date information with numeric month and year.
 * Used for work experience, education, and other date-based fields.
 */
export const DateInfoSchema = z
  .object({
    /** Month (1-12) */
    month: z.number().int().min(1).max(12).optional(),
    /** 4-digit year (1900-2100) */
    year: z.number().int().min(1900).max(2100).optional(),
  })
  .optional();

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
  type: ProfileTypeSchema.optional(),
  url: z.string().url().optional(),
  label: z.string().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;
