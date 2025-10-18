/**
 * Project and project image schemas for portfolio data.
 */

import { z } from "zod";

/**
 * Project image with optional caption.
 * Images are stored in Azure Blob Storage and displayed in order.
 */
export const ProjectImageSchema = z.object({
  /** Image URL from Azure Blob Storage */
  url: z.string().url(),
  /** Optional caption (max 100 chars) */
  caption: z.string().max(100).optional(),
  /** Display order (0-indexed) */
  order: z.number().int().min(0),
});

export type ProjectImage = z.infer<typeof ProjectImageSchema>;

/**
 * Project information with links and technologies.
 * Includes project details, links, demo video, and images.
 */
export const ProjectSchema = z.object({
  name: z.string().optional(),
  /** Markdown-formatted highlights/features */
  highlights: z.string().optional(),
  technologies: z.array(z.string()).optional().default([]),
  github: z.string().url().optional(),
  live_link: z.string().url().optional(),
  /** YouTube link for project demo video */
  demo_video: z.string().url().optional(),
  /** Markdown-supported detailed description */
  more_context: z.string().optional(),
  /** Ordered list of images with captions (max 5) */
  images: z.array(ProjectImageSchema).optional().default([]),
});

export type Project = z.infer<typeof ProjectSchema>;
