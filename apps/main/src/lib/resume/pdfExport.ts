/**
 * PDF Export Utility
 *
 * Handles PDF generation for resumes using browser print functionality.
 * Clones the resume content to a dedicated print container for reliable rendering.
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
 * Hides everything except the print container and ensures proper rendering
 */
const printStyles = `
  @media print {
    /* Hide everything in body */
    body > * {
      display: none !important;
    }

    /* Show only the print container */
    body > #resume-print-container {
      display: block !important;
    }

    /* Reset body styles for print */
    body {
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
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      transform: none !important;
    }

    #resume-print-container > * {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      transform: none !important;
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
  clone.style.width = "100%";
  clone.style.maxWidth = "100%";
  clone.style.boxShadow = "none";

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
 * Export the resume as a PDF using browser print
 *
 * This function:
 * 1. Clones the resume preview to a dedicated print container
 * 2. Injects print-specific CSS
 * 3. Sets the document title for the PDF filename
 * 4. Triggers the browser print dialog
 * 5. Cleans up after printing
 *
 * @param options - Export options including resume data and optional filename
 */
export async function exportToPDF(options: PDFExportOptions): Promise<void> {
  const { data, filename: customFilename } = options;

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
