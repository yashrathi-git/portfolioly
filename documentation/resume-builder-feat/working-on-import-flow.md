# Import Flow Documentation

Import components for LinkedIn PDF, GitHub repos, and existing portfolio data.
Located at `apps/main/src/components/resume/import/`.
Transforms imported data to ResumeData using ResumeTransformer.

---

## Components

### LinkedInImport

| Prop               | Type                               | Description                   |
| ------------------ | ---------------------------------- | ----------------------------- |
| `onImportComplete` | `(resumeData: ResumeData) => void` | Callback when import succeeds |
| `onError`          | `(error: Error) => void`           | Optional error callback       |
| `resumeName`       | `string`                           | Optional custom resume name   |
| `templateId`       | `string`                           | Optional template ID          |

### GitHubImport

| Prop               | Type                                  | Description                       |
| ------------------ | ------------------------------------- | --------------------------------- |
| `onImportComplete` | `(projects: ResumeProject[]) => void` | Callback with imported projects   |
| `onError`          | `(error: Error) => void`              | Optional error callback           |
| `maxRepos`         | `number`                              | Max repos to select (default: 10) |

### PortfolioImport

| Prop               | Type                               | Description                   |
| ------------------ | ---------------------------------- | ----------------------------- |
| `onImportComplete` | `(resumeData: ResumeData) => void` | Callback when import succeeds |
| `onError`          | `(error: Error) => void`           | Optional error callback       |
| `resumeName`       | `string`                           | Optional custom resume name   |
| `templateId`       | `string`                           | Optional template ID          |

---

## Exported Functions

### sortReposByStars

```typescript
function sortReposByStars(repos: GitHubRepo[]): GitHubRepo[];
```

Sorts GitHub repositories by star count in descending order. Does not modify the original array.

---

## Usage Examples

```typescript
import { LinkedInImport, GitHubImport, PortfolioImport } from "@/components/resume/import";

// LinkedIn Import
<LinkedInImport
  onImportComplete={(resume) => setResume(resume)}
  onError={(err) => console.error(err)}
  templateId="modern"
/>

// GitHub Import
<GitHubImport
  onImportComplete={(projects) => addProjects(projects)}
  maxRepos={5}
/>

// Portfolio Import
<PortfolioImport
  onImportComplete={(resume) => setResume(resume)}
  resumeName="My Resume"
/>
```

---

## Requirements Covered

- **1.1, 1.2, 1.3**: LinkedIn PDF upload and extraction
- **1.4**: Portfolio to ResumeData import
- **2.1, 2.2, 2.3, 2.4**: GitHub username search, star sorting, repo selection

---

## Property Tests

- **Property 2**: GitHub Repositories Sorted by Stars - `apps/main/src/components/resume/import/__tests__/githubSorting.property.test.ts`
