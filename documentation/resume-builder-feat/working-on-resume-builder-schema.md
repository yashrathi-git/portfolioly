# Resume Builder Schema Documentation

Resume data types and Pydantic schemas for the Resume Builder feature.
Defines ResumeData structure with array-based highlights, categorized skills, and section ordering.
Use these schemas for resume CRUD operations and transformations.

---

## TypeScript Types (Frontend)

**File:** `apps/main/src/types/resume.ts`

### Core Interfaces

| Interface              | Description                                        |
| ---------------------- | -------------------------------------------------- |
| `ResumeData`           | Main resume schema with all sections               |
| `ResumePersonalInfo`   | Contact information (full_name required)           |
| `ResumeWorkExperience` | Work entry with `highlights: string[]`             |
| `ResumeEducation`      | Education entry with optional GPA                  |
| `ResumeProject`        | Project with technologies and highlights           |
| `ResumeSkills`         | Categorized skills (`categories: SkillCategory[]`) |
| `ResumeCertification`  | Certification entry                                |
| `SkillCategory`        | `{ name: string, items: string[] }`                |

### Types

```typescript
type SectionType =
  | "summary"
  | "experience"
  | "education"
  | "projects"
  | "skills"
  | "certifications";
```

### Request Types

- `CreateResumeRequest` - For POST /api/resumes
- `UpdateResumeRequest` - For PUT /api/resumes/{id}
- `ResumeSummary` - For list views

---

## Pydantic Schemas (Backend)

**File:** `backend/app/schemas/resume.py`

### Models

| Model                  | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `ResumeData`           | Main resume model with validation                |
| `ResumePersonalInfo`   | Personal info (full_name required, min_length=1) |
| `ResumeWorkExperience` | Work experience with highlights array            |
| `ResumeEducation`      | Education with optional GPA                      |
| `ResumeProject`        | Project entry                                    |
| `ResumeSkills`         | Skills with categories                           |
| `ResumeCertification`  | Certification entry                              |
| `ResumeDateInfo`       | Date with month (1-12) and year (1900-2100)      |

### Enums

```python
class SectionType(str, Enum):
    SUMMARY = "summary"
    EXPERIENCE = "experience"
    EDUCATION = "education"
    PROJECTS = "projects"
    SKILLS = "skills"
    CERTIFICATIONS = "certifications"
```

### Request/Response Models

- `CreateResumeRequest` - Create new resume
- `UpdateResumeRequest` - Update existing resume
- `ResumeSummary` - Summary for list views
- `ResumeListResponse` - List response with total count

---

## Key Design Decisions

1. **Array-based highlights** - Work experiences, education, and projects use `highlights: string[]` for bullet points
2. **Categorized skills** - Skills grouped by category (Languages, Frameworks, Tools)
3. **Section ordering** - `section_order: SectionType[]` for custom resume layout
4. **Template persistence** - `template_id` stored with resume data

## Usage Example

```typescript
// Frontend
import { ResumeData, SectionType, DEFAULT_SECTION_ORDER } from "@/types/resume";

const resume: ResumeData = {
  id: "resume_123",
  name: "Software Engineer Resume",
  template_id: "classic",
  section_order: DEFAULT_SECTION_ORDER,
  personal_info: { full_name: "John Doe" },
  // ...
};
```

```python
# Backend
from app.schemas.resume import ResumeData, CreateResumeRequest

request = CreateResumeRequest(
    name="My Resume",
    personal_info={"full_name": "John Doe"},
    template_id="classic"
)
```
