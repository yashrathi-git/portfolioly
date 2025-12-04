# Resume Service Documentation

Backend service and API routes for resume CRUD operations.
Stores resumes in Firebase at `users/{uid}/resumes/{resumeId}`.
Use these endpoints for creating, reading, updating, deleting, and duplicating resumes.

---

## Service: ResumeService

**File:** `backend/app/services/resume_service.py`

### Methods

| Method                                           | Description                      | Returns               |
| ------------------------------------------------ | -------------------------------- | --------------------- |
| `create_resume(user_id, request)`                | Create new resume with unique ID | `str` (resume_id)     |
| `get_resume(user_id, resume_id)`                 | Get single resume                | `ResumeData`          |
| `list_resumes(user_id)`                          | List all user resumes            | `List[ResumeSummary]` |
| `update_resume(user_id, resume_id, request)`     | Update resume fields             | `bool`                |
| `delete_resume(user_id, resume_id)`              | Delete resume                    | `bool`                |
| `duplicate_resume(user_id, resume_id, new_name)` | Copy resume                      | `str` (new_id)        |

### Exceptions

- `ResumeServiceError` - General service errors
- `ResumeNotFoundError` - Resume not found (404)

### Usage

```python
from app.services.resume_service import get_resume_service

service = get_resume_service()
resume_id = service.create_resume(user_id, request)
```

---

## API Routes

**File:** `backend/app/routes/resume.py`
**Prefix:** `/api/resumes`

### Endpoints

| Method | Path                          | Description   | Request Body          | Response             |
| ------ | ----------------------------- | ------------- | --------------------- | -------------------- |
| POST   | `/api/resumes`                | Create resume | `CreateResumeRequest` | `{id, message}`      |
| GET    | `/api/resumes`                | List resumes  | -                     | `{resumes, total}`   |
| GET    | `/api/resumes/{id}`           | Get resume    | -                     | `ResumeData`         |
| PUT    | `/api/resumes/{id}`           | Update resume | `UpdateResumeRequest` | `{message}`          |
| DELETE | `/api/resumes/{id}`           | Delete resume | -                     | `{success, message}` |
| POST   | `/api/resumes/{id}/duplicate` | Duplicate     | `{new_name?}`         | `{id, message}`      |

### Authentication

All endpoints require authentication via `rate_limited_core_user` dependency.

---

## Firebase Structure

```
users/
  {uid}/
    resumes/
      {resumeId}/
        - id: string
        - name: string
        - template_id: string
        - section_order: string[]
        - personal_info: {...}
        - summary: string
        - work_experiences: [...]
        - education: [...]
        - projects: [...]
        - skills: {...}
        - certifications: [...]
        - created_at: timestamp
        - updated_at: timestamp
```
