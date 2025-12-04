# Resume Builder Pages

Main pages for the Resume Builder feature in the app shell.
Implements Requirements 3.1, 3.2, 3.3, 10.2, 10.3, 10.4.
Integrates editor, preview, template selector, and import components.

---

## Files Created

| File                                                        | Description                        |
| ----------------------------------------------------------- | ---------------------------------- |
| `apps/main/src/app/(appShell)/resume-builder/layout.tsx`    | Layout with SEO metadata           |
| `apps/main/src/app/(appShell)/resume-builder/page.tsx`      | Main resume builder/editor page    |
| `apps/main/src/app/(appShell)/resume-builder/list/page.tsx` | Resume list page with CRUD actions |

---

## Routes

| Route                    | Description                          |
| ------------------------ | ------------------------------------ |
| `/resume-builder`        | Create/edit resume with live preview |
| `/resume-builder?id=xxx` | Edit existing resume by ID           |
| `/resume-builder/list`   | View all saved resumes               |

---

## Resume Builder Page Features

- Three-panel layout: Editor (left), Preview (center), Settings (right)
- Import tab with LinkedIn PDF, GitHub repos, Portfolio options
- Edit tab with full ResumeEditor component
- Live preview with zoom controls
- Template selector and section reorder in collapsible settings panel
- Undo/redo toolbar
- Save and Export PDF buttons

### State Management

Uses `useResumeEditor` hook for:

- Resume data state
- Undo/redo history
- Dirty state tracking
- Auto-save (disabled by default)

---

## Resume List Page Features

- Grid of resume cards with name and last updated date
- Create new resume button
- Per-resume actions: Edit, Duplicate, Delete
- Delete confirmation dialog
- Empty state with CTA

---

## Integration Points

### Components Used

```typescript
import {
  ResumeEditor,
  LivePreview,
  TemplateSelector,
  SectionReorder,
  TemplateRegistry,
} from "@/components/resume";
import {
  LinkedInImport,
  GitHubImport,
  PortfolioImport,
} from "@/components/resume/import";
import { useResumeEditor } from "@/hooks/useResumeEditor";
```

### Types Used

```typescript
import type {
  ResumeData,
  SectionType,
  ResumeProject,
  ResumeSummary,
} from "@/types/resume";
```

---

## TODO (Task 15)

API integration pending:

- `createResume()` - Create new resume
- `getResume(id)` - Load existing resume
- `listResumes()` - Get all user resumes
- `updateResume(id, data)` - Save resume changes
- `deleteResume(id)` - Delete resume
- `duplicateResume(id)` - Copy resume

---

## Authentication

Both pages use `withAuth` HOC with `requireVerification: true`.
