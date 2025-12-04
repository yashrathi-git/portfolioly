# Resume Transformer Documentation

Transforms LinkedIn/GitHub/Portfolio data into ResumeData format for resume generation.
Provides `fromLinkedIn()`, `fromGitHub()`, `fromPortfolio()`, and `mergeGitHubProjects()` methods.
Located at `apps/main/src/lib/resume/resumeTransformer.ts`.

---

## API Reference

### ResumeTransformer

| Method                               | Input                      | Output                | Description                                    |
| ------------------------------------ | -------------------------- | --------------------- | ---------------------------------------------- |
| `fromLinkedIn(data, options?)`       | `PortfolioData`            | `ResumeData`          | Converts LinkedIn extracted data to ResumeData |
| `fromGitHub(repos)`                  | `GitHubRepo[]`             | `Partial<ResumeData>` | Converts GitHub repos to projects only         |
| `fromPortfolio(data, options?)`      | `PortfolioData`            | `ResumeData`          | Converts existing portfolio to ResumeData      |
| `mergeGitHubProjects(resume, repos)` | `ResumeData, GitHubRepo[]` | `ResumeData`          | Adds GitHub repos to existing resume           |

### Options

```typescript
{
  resumeName?: string;   // Custom resume name (default: "{name}'s Resume")
  templateId?: string;   // Template ID (default: "classic")
}
```

### GitHubRepo Interface

```typescript
interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  stars: number;
  url: string;
  language: string | null;
  fork: boolean;
  private: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## Usage Examples

```typescript
import { ResumeTransformer, GitHubRepo } from "@/lib/resume/resumeTransformer";
import type { PortfolioData } from "portfolioly-schema";

// From LinkedIn data
const linkedInData: PortfolioData = await fetchLinkedInData();
const resume = ResumeTransformer.fromLinkedIn(linkedInData, {
  resumeName: "Software Engineer Resume",
  templateId: "modern",
});

// From GitHub repos
const repos: GitHubRepo[] = await fetchGitHubRepos("username");
const partialResume = ResumeTransformer.fromGitHub(repos);

// Merge GitHub into existing resume
const updatedResume = ResumeTransformer.mergeGitHubProjects(resume, repos);

// From existing portfolio
const portfolio: PortfolioData = await getUserPortfolio();
const resumeFromPortfolio = ResumeTransformer.fromPortfolio(portfolio);
```

---

## Key Transformations

1. **Personal Info**: Maps `profiles` array to individual URL fields (linkedin_url, github_url, website_url)
2. **Work Experience**: Parses markdown `highlights` string into `string[]` array
3. **Skills**: Auto-categorizes `tags` into Languages, Frameworks, Tools, Other
4. **Projects**: Converts GitHub repos with star count and language as highlights
5. **Summary**: Uses `summary` field, falls back to `headline`

---

## Requirements Covered

- **1.1, 1.2**: LinkedIn to ResumeData transformation
- **1.4**: Portfolio to ResumeData transformation
- **2.3**: GitHub repos to projects transformation
