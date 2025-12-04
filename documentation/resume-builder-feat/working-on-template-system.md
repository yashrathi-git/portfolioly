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

---

## ATS Compliance

All templates follow ATS requirements:

- Single h1 for name
- h2 for section headings (Experience, Education, Skills, Projects, Certifications)
- h3 for entry titles
- No tables for layout
- No images for text content
- All text is selectable
