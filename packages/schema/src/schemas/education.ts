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
  institution: z.string().optional(),
  degree: z.string().optional(),
  branch: z.string().optional(),
  start_date: DateInfoSchema,
  end_date: DateInfoSchema,
  is_current: z.boolean().optional(),
  location: z.string().optional(),
  grade: z.string().optional(),
});

export type Education = z.infer<typeof EducationSchema>;
