/**
 * Work experience schema for portfolio data.
 */

import { z } from "zod";
import { DateInfoSchema } from "./core";

/**
 * Work experience entry with structured dates.
 * Includes organization details, role, dates, highlights, and technologies used.
 */
export const WorkExperienceSchema = z.object({
  organization: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  start_date: DateInfoSchema,
  end_date: DateInfoSchema,
  is_current: z.boolean().nullable().optional(),
  /** Markdown-formatted highlights/achievements */
  highlights: z.string().nullable().optional(),
  technologies: z.array(z.string()).optional().default([]),
  more_context: z.string().nullable().optional(),
});

export type WorkExperience = z.infer<typeof WorkExperienceSchema>;
