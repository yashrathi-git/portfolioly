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
  full_name: z.string().optional(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  profile_photo_url: z.string().url().optional(),
  profiles: z.array(ProfileSchema).optional().default([]),
});

export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
