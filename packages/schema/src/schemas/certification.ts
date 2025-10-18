/**
 * Certification schema for portfolio data.
 */

import { z } from "zod";

/**
 * Certification information.
 * Includes certification name, issuing organization, and verification link.
 */
export const CertificationSchema = z.object({
  name: z.string().optional(),
  /** Issuing organization (e.g., Coursera, Udemy, AWS) */
  issuer: z.string().optional(),
  link: z.string().url().optional(),
});

export type Certification = z.infer<typeof CertificationSchema>;
