# Resume Editor Panel

Resume editor component and hook for inline editing with undo/redo.
Implements Requirements 6.1, 6.2, 6.3, 6.4.
Provides personal info, work experience, education, projects, skills, and certifications editing.

## Components Created

### ResumeEditor (`apps/main/src/components/resume/ResumeEditor.tsx`)

Main editor component with section editors for all resume fields.

```typescript
interface ResumeEditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  className?: string;
}
```

Features:

- Personal info editing (name, email, phone, location, URLs)
- Summary/objective textarea
- Work experience with bullet point management
- Education with GPA and highlights
- Projects with technologies and highlights
- Skills category management (Languages, Frameworks, Tools)
- Certifications editing

### useResumeEditor (`apps/main/src/hooks/useResumeEditor.ts`)

Hook for managing resume state with undo/redo and auto-save.

```typescript
interface UseResumeEditorOptions {
  initialData: ResumeData;
  onSave?: (data: ResumeData) => Promise<void>;
  autoSaveDelay?: number; // default: 2000ms
  maxHistorySize?: number; // default: 50
  autoSaveEnabled?: boolean; // default: true
}

interface UseResumeEditorResult {
  data: ResumeData;
  setData: (data: ResumeData) => void;
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  save: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  markAsSaved: () => void;
}
```

Features:

- Undo/redo with configurable history size
- Dirty state tracking (compares with last saved)
- Auto-save with debouncing
- Manual save trigger
- Error handling for save failures

## Index Export Update

```typescript
export { ResumeEditor, type ResumeEditorProps } from "./ResumeEditor";
```

## Usage Example

```typescript
import { ResumeEditor, useResumeEditor } from "@/components/resume";

function ResumeBuilderPage() {
  const {
    data,
    setData,
    isDirty,
    isSaving,
    canUndo,
    canRedo,
    undo,
    redo,
    save,
  } = useResumeEditor({
    initialData: resumeData,
    onSave: async (data) => {
      await updateResume(resumeId, data);
    },
  });

  return (
    <div>
      <div className="toolbar">
        <button onClick={undo} disabled={!canUndo}>
          Undo
        </button>
        <button onClick={redo} disabled={!canRedo}>
          Redo
        </button>
        <button onClick={save} disabled={!isDirty || isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
      <ResumeEditor data={data} onChange={setData} />
    </div>
  );
}
```
