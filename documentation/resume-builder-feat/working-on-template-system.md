# Template System Documentation

Resume template system with registry pattern, 3 ATS-friendly templates, and property tests.
Templates render ResumeData with semantic HTML (h1/h2/h3) and print-optimized CSS.
Use TemplateRegistry to get templates by ID or get the default template.

---

## Files Created

| File                                                                             | Description                       |
| -------------------------------------------------------------------------------- | --------------------------------- |
| `apps/main/src/components/resume/templates/registry.ts`                          | Template registry singleton       |
| `apps/main/src/components/resume/templates/types.ts`                             | ResumeTemplateProps interface     |
| `apps/main/src/components/resume/templates/ClassicTemplate.tsx`                  | Traditional serif layout          |
| `apps/main/src/components/resume/templates/ModernTemplate.tsx`                   | Clean sans-serif layout           |
| `apps/main/src/components/resume/templates/MinimalTemplate.tsx`                  | Minimalist whitespace layout      |
| `apps/main/src/components/resume/templates/JakeTemplate.tsx`                     | Jake's LaTeX-style template       |
| `apps/main/src/components/resume/templates/index.ts`                             | Exports and template registration |
| `apps/main/src/components/resume/templates/__tests__/templates.property.test.ts` | Property tests                    |

---

## Key Interfaces

```typescript
// Template definition for registry
interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  component: ComponentType<ResumeTemplateProps>;
}

// Props for all templates
interface ResumeTemplateProps {
  data: ResumeData;
  sectionOrder: SectionType[];
  isPrintMode?: boolean;
}
```

---

## Usage

```typescript
import { TemplateRegistry } from "@/components/resume/templates";

// Get all templates
const templates = TemplateRegistry.templates;

// Get template by ID
const classic = TemplateRegistry.getTemplate("classic");

// Get default template
const defaultTemplate = TemplateRegistry.getDefaultTemplate();

// Render a template
<ClassicTemplate
  data={resumeData}
  sectionOrder={resumeData.section_order}
  isPrintMode={false}
/>;
```

---

## Template IDs

- `classic` - Traditional serif fonts, conservative industries
- `modern` - Sans-serif, tech/creative roles
- `minimal` - Maximum whitespace, sophisticated look
- `jake` - Jake Gutierrez's LaTeX-style template, ATS-friendly with small-caps headers

---

## Markdown Formatting (Jake's Template)

Jake's Template supports inline markdown formatting in text fields:

- `**text**` → **bold**
- `*text*` → _italic_
- Bullet points are rendered from the `highlights` array (use `*`, `-`, or `/` in editor)

Example: `Developed a **REST API** using *FastAPI* and PostgreSQL`

---

## ATS Compliance

All templates follow ATS requirements:

- Single h1 for name
- h2 for section headings (Experience, Education, Skills, Projects, Certifications)
- h3 for entry titles
- No tables for layout
- No images for text content
- All text is selectable

---

## PDF Templates (@react-pdf/renderer)

Templates with PDF versions use `@react-pdf/renderer` for accurate page breaks.

| Template | PDF Version | Location                            |
| -------- | ----------- | ----------------------------------- |
| Jake's   | ✅ Yes      | `templates/pdf/JakeTemplatePDF.tsx` |
| Classic  | ❌ No       | Falls back to browser print         |
| Modern   | ❌ No       | Falls back to browser print         |
| Minimal  | ❌ No       | Falls back to browser print         |

### PDF Template Files

| File                                                                | Description           |
| ------------------------------------------------------------------- | --------------------- |
| `apps/main/src/components/resume/templates/pdf/index.ts`            | PDF template registry |
| `apps/main/src/components/resume/templates/pdf/JakeTemplatePDF.tsx` | Jake's PDF template   |

### PDF Template API

```typescript
import {
  getPDFTemplate,
  hasPDFTemplate,
} from "@/components/resume/templates/pdf";

// Check if PDF template exists
if (hasPDFTemplate("jake")) {
  const PDFTemplate = getPDFTemplate("jake");
  // Use with PDFViewer or pdf() for export
}
```

### Export with PDF Templates

```typescript
import { exportToPDF } from "@/lib/resume/pdfExport";

await exportToPDF({
  data: resumeData,
  templateId: "jake",
  sectionOrder: resumeData.section_order,
});
```

### LivePreview Behavior

- Templates with PDF versions: Uses `PDFViewer` for accurate page break preview
- Templates without PDF versions: Uses HTML preview with estimated page breaks
