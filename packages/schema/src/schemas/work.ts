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
  organization: z.string().optional(),
  title: z.string().optional(),
  location: z.string().optional(),
  start_date: DateInfoSchema,
  end_date: DateInfoSchema,
  is_current: z.boolean().optional(),
  /** Markdown-formatted highlights/achievements */
  highlights: z.string().optional(),
  technologies: z.array(z.string()).optional().default([]),
  more_context: z.string().optional(),
});

export type WorkExperience = z.infer<typeof WorkExperienceSchema>;
