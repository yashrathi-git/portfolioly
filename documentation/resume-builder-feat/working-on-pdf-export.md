# Resume Builder PDF Export

PDF export utility using browser print functionality for reliable PDF generation.
Implements Requirements 5.1, 5.2, 5.3, 5.4.
Uses window.print() with print-specific CSS for ATS-friendly output.

## Files Created/Modified

### PDF Export Utility (`apps/main/src/lib/resume/pdfExport.ts`)

Main export utility with browser print integration.

```typescript
interface PDFExportOptions {
  data: ResumeData;
  filename?: string;
}

// Generate filename in format "resume-{name}.pdf"
function generateFilename(data: ResumeData, customFilename?: string): string;

// Export resume to PDF using browser print
async function exportToPDF(options: PDFExportOptions): Promise<void>;

// Check if browser supports printing
function isPrintSupported(): boolean;
```

Features:

- Filename sanitization (removes special chars, replaces spaces with hyphens)
- Print-specific CSS injection for proper page layout
- Document title manipulation for PDF filename
- Automatic cleanup after print dialog closes
- Page break handling for resume sections

### LivePreview Update (`apps/main/src/components/resume/LivePreview.tsx`)

Added `data-resume-preview="true"` attribute to the paper container for PDF export targeting.

### Resume Builder Page Update (`apps/main/src/app/(appShell)/resume-builder/page.tsx`)

Updated `handleExport` function to use the PDF export utility:

- Checks browser support with `isPrintSupported()`
- Calls `exportToPDF()` with resume data
- Shows toast notifications for success/error

## Usage

```typescript
import { exportToPDF, isPrintSupported } from "@/lib/resume/pdfExport";

// Check support
if (isPrintSupported()) {
  // Export with auto-generated filename
  await exportToPDF({ data: resumeData });

  // Or with custom filename
  await exportToPDF({ data: resumeData, filename: "my-resume" });
}
```

## Print CSS Features

- Hides all non-resume elements during print
- Sets letter page size with 0.5in margins
- Prevents page breaks inside entries
- Ensures links are visible without underlines
- Hides buttons and UI elements
