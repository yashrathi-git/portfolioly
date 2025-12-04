/**
 * Resume Template Types
 *
 * Standard props interface for all resume templates.
 * All templates must accept these props to ensure consistency.
 *
 * _Requirements: 9.1_
 */

import type { ResumeData, SectionType } from "@/types/resume";

/**
 * Standard props interface for all resume templates.
 */
export interface ResumeTemplateProps {
  /** The resume data to render */
  data: ResumeData;
  /** Order of sections to render */
  sectionOrder: SectionType[];
  /** Whether the template is in print mode (for PDF export) */
  isPrintMode?: boolean;
}

/**
 * Section renderer function type for templates.
 */
export type SectionRenderer = (data: ResumeData) => React.ReactNode;

/**
 * Map of section types to their renderers.
 */
export type SectionRendererMap = Record<SectionType, SectionRenderer>;
