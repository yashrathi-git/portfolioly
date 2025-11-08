/**
 * Personal information schema for portfolio data.
 */

import { z } from "zod";
import { ProfileSchema } from "./core";

/**
 * Personal information section of the portfolio.
 * Includes basic contact info, profile photo, and social/professional profiles.
 */
export const PersonalInfoSchema = z.object({
  full_name: z.string().nullable().optional(),
  headline: z.string().nullable().optional(),
  chatfolio_headline: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  profile_photo_url: z.string().nullable().optional(),
  profiles: z
    .preprocess(
      (val) => (Array.isArray(val) ? val : []),
      z.array(ProfileSchema)
    )
    .optional()
    .default([]),
  tags: z
    .preprocess((val) => (Array.isArray(val) ? val : []), z.array(z.string()))
    .optional()
    .default([]),
});

export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
