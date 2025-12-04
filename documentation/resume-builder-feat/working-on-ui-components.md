# Resume Builder UI Components

UI components for template selection, live preview, and section reordering.
Implements Requirements 3.1, 3.4, 4.2, 4.3, 8.1, 8.2.
Property test validates section ordering (Property 6).

## Components Created

### TemplateSelector (`apps/main/src/components/resume/TemplateSelector.tsx`)

Displays thumbnail previews of available templates with selection callback.

```typescript
interface TemplateSelectorProps {
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  className?: string;
}
```

### LivePreview (`apps/main/src/components/resume/LivePreview.tsx`)

Renders selected template with zoom controls and print mode toggle.

```typescript
interface LivePreviewProps {
  data: ResumeData;
  templateId: string;
  sectionOrder: SectionType[];
  className?: string;
  onPrintModeChange?: (isPrintMode: boolean) => void;
}
```

Features:

- Zoom controls (25% - 200%)
- Preset zoom levels (50%, 75%, 100%, 125%, 150%)
- Print mode toggle
- Scrollable preview area

### SectionReorder (`apps/main/src/components/resume/SectionReorder.tsx`)

Drag-and-drop section reordering with keyboard support.

```typescript
interface SectionReorderProps {
  sectionOrder: SectionType[];
  onReorder: (newOrder: SectionType[]) => void;
  className?: string;
  sectionsWithContent?: SectionType[];
}
```

Features:

- Native HTML5 drag-and-drop
- Keyboard support (Alt+Arrow keys)
- Visual feedback for content presence
- Accessible with ARIA labels

## Index Export (`apps/main/src/components/resume/index.ts`)

```typescript
export {
  TemplateSelector,
  type TemplateSelectorProps,
} from "./TemplateSelector";
export { LivePreview, type LivePreviewProps } from "./LivePreview";
export { SectionReorder, type SectionReorderProps } from "./SectionReorder";
```

## Property Test

`apps/main/src/components/resume/__tests__/sectionOrder.property.test.ts`

Tests Property 6: Section Order Determines Render Order

- Validates Requirements 8.2, 8.3
- 100 iterations per test
- Tests all three templates (Classic, Modern, Minimal)
