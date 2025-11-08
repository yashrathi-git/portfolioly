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
  logo_url: z.string().nullable().optional(),
  start_date: DateInfoSchema,
  end_date: DateInfoSchema,
  is_current: z.boolean().nullable().optional(),
  /** Markdown-formatted highlights/achievements */
  highlights: z
    .preprocess((val) => {
      if (val == null) return null;
      if (typeof val === "string") return val;
      if (Array.isArray(val)) {
        const lines = val
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter((item) => item.length > 0);
        return lines.length > 0 ? lines.join("\n") : null;
      }
      if (typeof val === "object") {
        try {
          return JSON.stringify(val);
        } catch {
          return null;
        }
      }
      return String(val);
    }, z.string().nullable())
    .optional(),
  technologies: z
    .preprocess(
      (val) =>
        Array.isArray(val)
          ? val
          : val == null
          ? []
          : typeof val === "string"
          ? [val]
          : [],
      z.array(z.string())
    )
    .optional()
    .default([]),
  more_context: z.string().nullable().optional(),
});

export type WorkExperience = z.infer<typeof WorkExperienceSchema>;
