# Frontend API Integration Documentation

Resume API client and React hooks for frontend resume management.
Use these for all resume CRUD operations from the frontend.
Follows same patterns as portfolio.ts for consistency.

---

## API Client

**File:** `apps/main/src/lib/api/resume.ts`

### Functions

| Function                              | Description           | Returns                     |
| ------------------------------------- | --------------------- | --------------------------- |
| `createResume(data)`                  | Create new resume     | `Promise<string>`           |
| `getResume(resumeId)`                 | Get single resume     | `Promise<ResumeData>`       |
| `listResumes()`                       | List all user resumes | `Promise<{resumes, total}>` |
| `updateResume(resumeId, data)`        | Update resume         | `Promise<void>`             |
| `deleteResume(resumeId)`              | Delete resume         | `Promise<void>`             |
| `duplicateResume(resumeId, newName?)` | Duplicate resume      | `Promise<string>`           |

### Error Handling

```typescript
import { ResumeAPIError } from "@/lib/api/resume";

try {
  await createResume(data);
} catch (err) {
  if (err instanceof ResumeAPIError) {
    console.log(err.status, err.code, err.message);
  }
}
```

### Error Codes

- `AUTH_REQUIRED` - User not authenticated (401)
- `CREATE_ERROR` - Failed to create resume
- `FETCH_ERROR` - Failed to fetch resume
- `LIST_ERROR` - Failed to list resumes
- `UPDATE_ERROR` - Failed to update resume
- `DELETE_ERROR` - Failed to delete resume
- `DUPLICATE_ERROR` - Failed to duplicate resume

---

## React Hooks

**File:** `apps/main/src/hooks/useResume.ts`

### useResumeList

Hook for managing the list of user's resumes.

```typescript
const {
  resumes, // ResumeSummary[]
  total, // number
  isLoading, // boolean
  error, // string | null
  refetch, // () => Promise<void>
  create, // (data: CreateResumeRequest) => Promise<string>
  remove, // (resumeId: string) => Promise<void>
  duplicate, // (resumeId: string, newName?: string) => Promise<string>
} = useResumeList();
```

### useResume

Hook for managing a single resume.

```typescript
const {
  resume, // ResumeData | null
  isLoading, // boolean
  error, // string | null
  refetch, // () => Promise<void>
  update, // (data: UpdateResumeRequest) => Promise<void>
  remove, // () => Promise<void>
  duplicate, // (newName?: string) => Promise<string>
} = useResume(resumeId);
```

### Caching

- In-memory cache with 5-minute TTL
- Cache invalidated on delete/update operations
- Use `refetch()` to force fresh data

---

## Usage Examples

### Create Resume

```typescript
import { useResumeList } from "@/hooks/useResume";

function CreateResumeButton() {
  const { create } = useResumeList();

  const handleCreate = async () => {
    const id = await create({
      name: "My Resume",
      personal_info: { full_name: "John Doe" },
    });
    // Navigate to editor with new id
  };
}
```

### Edit Resume

```typescript
import { useResume } from "@/hooks/useResume";

function ResumeEditor({ resumeId }: { resumeId: string }) {
  const { resume, isLoading, error, update } = useResume(resumeId);

  const handleSave = async (data: UpdateResumeRequest) => {
    await update(data);
  };
}
```

### List Resumes

```typescript
import { useResumeList } from "@/hooks/useResume";

function ResumeList() {
  const { resumes, isLoading, remove, duplicate } = useResumeList();

  return (
    <ul>
      {resumes.map((r) => (
        <li key={r.id}>
          {r.name}
          <button onClick={() => duplicate(r.id)}>Duplicate</button>
          <button onClick={() => remove(r.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```
