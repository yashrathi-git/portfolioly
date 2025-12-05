/**
 * PDF Export Utility
 *
 * Handles PDF generation for resumes.
 * Uses @react-pdf/renderer for templates with PDF versions (accurate page breaks).
 * Falls back to browser print for templates without PDF versions.
 *
 * _Requirements: 5.1, 5.2, 5.3, 5.4_
 */

import type { ResumeData, SectionType } from "@/types/resume";
import { pdf } from "@react-pdf/renderer";
import {
  getPDFTemplate,
  hasPDFTemplate,
} from "@/components/resume/templates/pdf";
import React from "react";

/**
 * Options for PDF export
 */
export interface PDFExportOptions {
  /** Resume data to export */
  data: ResumeData;
  /** Template ID to use */
  templateId: string;
  /** Section order for the resume */
  sectionOrder: SectionType[];
  /** Optional custom filename (without extension) */
  filename?: string;
}

/**
 * Sanitize a string for use in a filename
 * Removes special characters and replaces spaces with hyphens
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();
}

/**
 * Generate a filename for the PDF export
 * Format: "resume-{name}.pdf"
 */
export function generateFilename(
  data: ResumeData,
  customFilename?: string
): string {
  if (customFilename) {
    return `${sanitizeFilename(customFilename)}.pdf`;
  }

  const name = data.personal_info.full_name || data.name || "untitled";
  const sanitized = sanitizeFilename(name);
  return `resume-${sanitized || "untitled"}.pdf`;
}

/**
 * Print-specific CSS to inject for PDF export
 * Hides everything except the print container and ensures proper rendering
 */
const printStyles = `
  @media print {
    /* Page setup - NO margins, template handles padding */
    @page {
      size: letter;
      margin: 0 !important;
    }

    /* Hide everything in body */
    body > * {
      display: none !important;
    }

    /* Show only the print container */
    body > #resume-print-container {
      display: block !important;
    }

    /* Reset html/body styles for print */
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Print container styles */
    #resume-print-container {
      position: static !important;
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      transform: none !important;
      overflow: visible !important;
    }

    /* Hide LivePreview page break indicators */
    #resume-print-container [class*="PageBreakIndicator"],
    #resume-print-container .page-break-indicator,
    #resume-print-container [style*="border-dashed"],
    #resume-print-container [style*="amber"] {
      display: none !important;
    }

    /* Jake's template specific - hide measurement container */
    .jake-measure-container {
      display: none !important;
    }

    /* Jake's template specific - page labels */
    .jake-page-label {
      display: none !important;
    }

    /* Jake's template specific - pages container */
    .jake-pages-container {
      gap: 0 !important;
    }

    /* Jake's template specific - individual pages */
    .jake-page {
      width: 8.5in !important;
      height: 11in !important;
      padding: 0.5in !important;
      box-shadow: none !important;
      page-break-after: always !important;
      break-after: page !important;
      overflow: visible !important;
    }

    .jake-page:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }

    /* Prevent page breaks inside entries for all templates */
    .classic-entry,
    .modern-entry,
    .minimal-entry,
    .jake-entry {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* Prevent page breaks inside sections when possible */
    .classic-section,
    .modern-section,
    .minimal-section,
    .jake-section {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* Prevent orphaned section headers */
    .classic-section h2,
    .modern-section h2,
    .minimal-section h2,
    .jake-section-title {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }

    /* Prevent breaking inside bullet points */
    .jake-entry-bullets li {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* Ensure links are visible in print */
    a {
      text-decoration: none !important;
    }

    /* Hide UI elements */
    button,
    .no-print {
      display: none !important;
    }
  }

  /* Hide print container on screen */
  @media screen {
    #resume-print-container {
      display: none !important;
    }
  }
`;

/**
 * Create or get the style element with print CSS
 */
function ensurePrintStyles(): HTMLStyleElement {
  let styleElement = document.getElementById(
    "resume-print-styles"
  ) as HTMLStyleElement | null;

  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = "resume-print-styles";
    styleElement.textContent = printStyles;
    document.head.appendChild(styleElement);
  }

  return styleElement;
}

/**
 * Create a print container with cloned resume content
 */
function createPrintContainer(sourceElement: Element): HTMLDivElement {
  // Remove existing print container if any
  const existing = document.getElementById("resume-print-container");
  if (existing) {
    existing.remove();
  }

  // Create new container
  const container = document.createElement("div");
  container.id = "resume-print-container";

  // Clone the resume content (deep clone)
  const clone = sourceElement.cloneNode(true) as HTMLElement;

  // Remove any transforms or scaling from the clone
  clone.style.transform = "none";
  clone.style.boxShadow = "none";

  // Remove page break indicators and measurement containers
  const pageBreakIndicators = clone.querySelectorAll(".page-break-indicator, .no-print, .jake-measure-container, .jake-page-label");
  pageBreakIndicators.forEach((el) => el.remove());

  container.appendChild(clone);
  document.body.appendChild(container);

  return container;
}

/**
 * Set the document title for PDF filename
 * Browsers use the document title as the default PDF filename
 */
function setDocumentTitle(filename: string): string {
  const originalTitle = document.title;
  // Remove .pdf extension for document title (browser adds it)
  document.title = filename.replace(/\.pdf$/, "");
  return originalTitle;
}

/**
 * Export the resume as a PDF using @react-pdf/renderer (preferred) or browser print (fallback)
 *
 * For templates with PDF versions:
 * - Uses @react-pdf/renderer for accurate page breaks
 * - Generates a blob and triggers download
 *
 * For templates without PDF versions:
 * - Falls back to browser print dialog
 *
 * @param options - Export options including resume data, template ID, and optional filename
 */
export async function exportToPDF(options: PDFExportOptions): Promise<void> {
  const { data, templateId, sectionOrder, filename: customFilename } = options;

  // Check if we have a PDF template for this template ID
  if (hasPDFTemplate(templateId)) {
    await exportWithReactPDF(data, templateId, sectionOrder, customFilename);
  } else {
    await exportWithBrowserPrint(data, customFilename);
  }
}

/**
 * Export using @react-pdf/renderer for accurate PDF generation
 */
async function exportWithReactPDF(
  data: ResumeData,
  templateId: string,
  sectionOrder: SectionType[],
  customFilename?: string
): Promise<void> {
  const PDFTemplate = getPDFTemplate(templateId);
  if (!PDFTemplate) {
    throw new Error(`PDF template not found for: ${templateId}`);
  }

  // Generate filename
  const filename = generateFilename(data, customFilename);

  // Create the PDF document element
  const documentElement = React.createElement(PDFTemplate, {
    data,
    sectionOrder,
  });

  // Generate PDF blob
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(documentElement as any).toBlob();

  // Create download link and trigger download
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export using browser print (fallback for templates without PDF versions)
 */
async function exportWithBrowserPrint(
  data: ResumeData,
  customFilename?: string
): Promise<void> {
  // Find the resume preview element
  const previewElement = document.querySelector('[data-resume-preview="true"]');
  if (!previewElement) {
    throw new Error("Resume preview element not found");
  }

  // Generate filename
  const filename = generateFilename(data, customFilename);

  // Store original title
  const originalTitle = setDocumentTitle(filename);

  // Ensure print styles are injected
  ensurePrintStyles();

  // Create print container with cloned content
  const printContainer = createPrintContainer(previewElement);

  // Use a small delay to ensure DOM is updated
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Trigger print
  window.print();

  // Cleanup function
  const cleanup = () => {
    document.title = originalTitle;
    printContainer.remove();
    window.removeEventListener("focus", cleanup);
    window.removeEventListener("afterprint", cleanup);
  };

  // Listen for afterprint event (most reliable)
  window.addEventListener("afterprint", cleanup, { once: true });

  // Cleanup on window focus (fallback for browsers without afterprint)
  window.addEventListener("focus", cleanup, { once: true });

  // Fallback cleanup after a delay
  setTimeout(cleanup, 5000);
}

/**
 * Check if the browser supports printing
 */
export function isPrintSupported(): boolean {
  return typeof window !== "undefined" && typeof window.print === "function";
}

export default exportToPDF;
