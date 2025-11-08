/**
 * Metadata and settings schemas for portfolio data.
 */

import { z } from "zod";

/**
 * Unstructured text information that couldn't be categorized.
 * Used for achievements and additional context that doesn't fit other sections.
 */
export const TextBlobsSchema = z.object({
  /** Markdown-formatted achievements, one per line with bullet points */
  achievements: z.string().nullable().optional(),
  additional_context: z.string().nullable().optional(),
});

export type TextBlobs = z.infer<typeof TextBlobsSchema>;

/**
 * Layout preference settings for portfolio display.
 * Controls which layouts are available and which is shown by default.
 */
export const LayoutSettingsSchema = z
  .object({
    /** Available layout modes: chat-only, traditional-only, both */
    layout_mode: z
      .enum(["chat-only", "traditional-only", "both"])
      .catch("both")
      .optional()
      .default("both"),
    /** Default layout when both are available: chat, traditional */
    default_layout: z
      .enum(["chat", "traditional"])
      .catch("chat")
      .optional()
      .default("chat"),
  })
  .catch({
    layout_mode: "both",
    default_layout: "chat",
  });

export type LayoutSettings = z.infer<typeof LayoutSettingsSchema>;

/**
 * Metadata about the portfolio data extraction.
 * Tracks source type, extraction timestamp, and processing notes.
 */
export const PortfolioMetadataSchema = z.object({
  /** Source type (e.g., resume_pdf, linkedin_pdf, github_only) */
  source_type: z.string().nullable().optional(),
  /** ISO timestamp of when data was extracted */
  extracted_at: z
    .preprocess((val) => {
      if (val === undefined || val === null) {
        return null;
      }

      if (typeof val === "string") {
        return val;
      }

      if (typeof val === "object" && val !== null) {
        const maybeTimestamp = val as {
          toDate?: () => Date;
          seconds?: number;
          nanoseconds?: number;
        };

        if (typeof maybeTimestamp.toDate === "function") {
          const date = maybeTimestamp.toDate();
          if (date instanceof Date && !Number.isNaN(date.valueOf())) {
            return date.toISOString();
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
            return date.toISOString();
          }
        }
      }

      return String(val);
    }, z.string().nullable())
    .optional(),
  notes: z.string().nullable().optional(),
});

export type PortfolioMetadata = z.infer<typeof PortfolioMetadataSchema>;
