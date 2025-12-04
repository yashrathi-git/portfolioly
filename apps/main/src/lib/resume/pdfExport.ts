/**
 * PDF Export Utility
 *
 * Handles PDF generation for resumes using browser print functionality.
 * Uses window.print() with print-specific CSS for reliable PDF generation.
 *
 * _Requirements: 5.1, 5.2, 5.3, 5.4_
 */

import type { ResumeData } from "@/types/resume";

/**
 * Options for PDF export
 */
export interface PDFExportOptions {
  /** Resume data to export */
  data: ResumeData;
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
 * Ensures proper page breaks and hides non-resume elements
 */
const printStyles = `
  @media print {
    /* Hide everything except the resume preview */
    body > *:not(.resume-print-container) {
      display: none !important;
    }

    /* Reset body styles for print */
    body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
    }

    /* Resume container styles */
    .resume-print-container {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
    }

    /* Page setup */
    @page {
      size: letter;
      margin: 0.5in;
    }

    /* Prevent page breaks inside entries */
    .classic-entry,
    .modern-entry,
    .minimal-entry {
      page-break-inside: avoid;
    }

    /* Allow page breaks between sections */
    .classic-section,
    .modern-section,
    .minimal-section {
      page-break-inside: avoid;
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
`;

/**
 * Create a style element with print CSS
 */
function createPrintStyleElement(): HTMLStyleElement {
  const style = document.createElement("style");
  style.id = "resume-print-styles";
  style.textContent = printStyles;
  return style;
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
 * Export the resume as a PDF using browser print
 *
 * This function:
 * 1. Injects print-specific CSS
 * 2. Sets the document title for the PDF filename
 * 3. Triggers the browser print dialog
 * 4. Cleans up after printing
 *
 * @param options - Export options including resume data and optional filename
 */
export async function exportToPDF(options: PDFExportOptions): Promise<void> {
  const { data, filename: customFilename } = options;

  // Generate filename
  const filename = generateFilename(data, customFilename);

  // Store original title
  const originalTitle = setDocumentTitle(filename);

  // Inject print styles
  let styleElement = document.getElementById(
    "resume-print-styles"
  ) as HTMLStyleElement | null;
  if (!styleElement) {
    styleElement = createPrintStyleElement();
    document.head.appendChild(styleElement);
  }

  // Add print container class to the preview element
  const previewElement = document.querySelector('[data-resume-preview="true"]');
  if (previewElement) {
    previewElement.classList.add("resume-print-container");
  }

  // Use a small delay to ensure styles are applied
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Trigger print
  window.print();

  // Cleanup after print dialog closes
  // Note: There's no reliable way to detect when print dialog closes,
  // so we use a timeout and also listen for focus
  const cleanup = () => {
    document.title = originalTitle;
    if (previewElement) {
      previewElement.classList.remove("resume-print-container");
    }
    window.removeEventListener("focus", cleanup);
  };

  // Cleanup on window focus (when print dialog closes)
  window.addEventListener("focus", cleanup, { once: true });

  // Fallback cleanup after a delay
  setTimeout(cleanup, 2000);
}

/**
 * Check if the browser supports printing
 */
export function isPrintSupported(): boolean {
  return typeof window !== "undefined" && typeof window.print === "function";
}

export default exportToPDF;
