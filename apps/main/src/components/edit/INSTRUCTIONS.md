# AI Portfolio Builder – Integration Guide

This package provides a reusable, theme-aware set of components to edit and preview portfolio data. All components are split into small, copy-friendly files and avoid fixed heights so they integrate cleanly into your app.

## What’s included

- Types: `src/types/portfolio.ts`
- Editor shell and preview:
  - `src/components/portfolio/PortfolioEditor.tsx`
  - `src/components/portfolio/PortfolioPreview.tsx`
- Section forms:
  - `src/components/portfolio/PersonalInfoForm.tsx`
  - `src/components/portfolio/ProfilesForm.tsx`
  - `src/components/portfolio/WorkExperienceForm.tsx`
  - `src/components/portfolio/ProjectsForm.tsx`
  - `src/components/portfolio/EducationForm.tsx`
  - `src/components/portfolio/CertificationsForm.tsx`
  - `src/components/portfolio/TextBlobsForm.tsx`

These use existing shadcn/ui components present in the project (Button, Card, Input, Textarea, Select, Tabs, etc.). No new packages are required.

## Data model

Types are defined in `src/types/portfolio.ts` and mirror the provided schema. Key export:

- `PortfolioData` – the root data structure

Import example:

```ts
import type { PortfolioData } from "@/types/portfolio";
```

## Using the PortfolioEditor

The editor renders an Edit/Preview tab layout and manages all sections. It’s optimized for reuse and can be used in controlled or uncontrolled modes.

```tsx
import { useState } from "react";
import { PortfolioEditor } from "@/components/portfolio/PortfolioEditor";
import type { PortfolioData } from "@/types/portfolio";

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioData | undefined>(undefined);

  return (
    <div className="container mx-auto p-6">
      <PortfolioEditor initial={data} onChange={(next) => setData(next)} />
    </div>
  );
}
```

Props:

- `initial?: PortfolioData` – optional initial value supplied by the caller.
- `onChange?: (next: PortfolioData) => void`