/**
 * PDF Templates Index
 *
 * Exports PDF template components for use with @react-pdf/renderer.
 * These templates generate accurate PDFs with proper page breaks.
 */

import type { ResumeData, SectionType } from "@/types/resume";
import type { ComponentType } from "react";

export interface PDFTemplateProps {
  data: ResumeData;
  sectionOrder: SectionType[];
}

type PDFTemplateComponent = ComponentType<PDFTemplateProps>;

/**
 * Map of template IDs to their PDF components.
 * Add new PDF templates here as they are created.
 */
export const pdfTemplateMap: Record<string, PDFTemplateComponent | undefined> =
  {
    // Add PDF templates as they are created:
    // classic: ClassicTemplatePDF,
    // modern: ModernTemplatePDF,
    // minimal: MinimalTemplatePDF,
  };

/**
 * Get the PDF template component for a given template ID.
 * Returns undefined if no PDF template exists for the ID.
 */
export function getPDFTemplate(
  templateId: string
): PDFTemplateComponent | undefined {
  return pdfTemplateMap[templateId];
}

/**
 * Check if a PDF template exists for the given template ID.
 */
export function hasPDFTemplate(templateId: string): boolean {
  return (
    templateId in pdfTemplateMap && pdfTemplateMap[templateId] !== undefined
  );
}
