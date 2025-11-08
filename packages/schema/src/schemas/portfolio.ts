/**
 * Root portfolio data schema composing all portfolio sections.
 */

import { z } from "zod";
import { PersonalInfoSchema } from "./personal";
import { WorkExperienceSchema } from "./work";
import { ProjectSchema } from "./project";
import { EducationSchema } from "./education";
import { CertificationSchema } from "./certification";
import {
  TextBlobsSchema,
  LayoutSettingsSchema,
  PortfolioMetadataSchema,
} from "./metadata";

/**
 * Complete portfolio data structure for AI-extracted user information.
 *
 * This is the root model that contains all user portfolio information
 * extracted from PDFs and GitHub repositories. All fields are optional
 * to handle incomplete or missing information from unstructured sources.
 *
 * @example
 * ```typescript
 * const portfolio: PortfolioData = {
 *   personal_info: {
 *     full_name: "John Doe",
 *     headline: "Senior Software Engineer",
 *     email: "john@example.com"
 *   },
 *   work_experiences: [{
 *     organization: "Tech Corp",
 *     title: "Senior Engineer",
 *     start_date: { month: 1, year: 2020 }
 *   }],
 *   projects: [],
 *   education: []
 * };
 * ```
 */
export const PortfolioDataSchema = z.object({
  personal_info: PersonalInfoSchema.catch({}).default({}),
  work_experiences: z
    .preprocess(
      (val) => (Array.isArray(val) ? val : val == null ? [] : [val]),
      z.array(WorkExperienceSchema)
    )
    .catch([])
    .optional()
    .default([]),
  projects: z
    .preprocess(
      (val) => (Array.isArray(val) ? val : val == null ? [] : [val]),
      z.array(ProjectSchema)
    )
    .catch([])
    .optional()
    .default([]),
  education: z
    .preprocess(
      (val) => (Array.isArray(val) ? val : val == null ? [] : [val]),
      z.array(EducationSchema)
    )
    .catch([])
    .optional()
    .default([]),
  certifications: z
    .preprocess(
      (val) => (Array.isArray(val) ? val : val == null ? [] : [val]),
      z.array(CertificationSchema)
    )
    .catch([])
    .optional()
    .default([]),
  text_blobs: TextBlobsSchema.catch({}).default({}),
  metadata: PortfolioMetadataSchema.catch({}).default({}),
  layout_settings: LayoutSettingsSchema.catch({
    layout_mode: "both",
    default_layout: "chat",
  }).default({
    layout_mode: "both",
    default_layout: "chat",
  }),
});

export type PortfolioData = z.infer<typeof PortfolioDataSchema>;
