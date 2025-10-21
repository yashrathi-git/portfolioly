/**
 * Education schema for portfolio data.
 */

import { z } from "zod";
import { DateInfoSchema } from "./core";

/**
 * Education information with structured dates.
 * Includes institution details, degree, dates, and academic performance.
 */
export const EducationSchema = z.object({
  institution: z.string().nullable().optional(),
  degree: z.string().nullable().optional(),
  branch: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  start_date: DateInfoSchema,
  end_date: DateInfoSchema,
  is_current: z.boolean().nullable().optional(),
  location: z.string().nullable().optional(),
  grade: z.string().nullable().optional(),
});

export type Education = z.infer<typeof EducationSchema>;
