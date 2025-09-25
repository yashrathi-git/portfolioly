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
- `examplePortfolioData` – sample data you can use as a starting point

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

- `initial?: PortfolioData` – optional initial value. Defaults to `examplePortfolioData`.
- `onChange?: (next: PortfolioData) => void` – receive updates for controlled usage.

## Using individual form sections

You can embed any form section in your own layout. Each section is fully controlled via `value` and `onChange`.

Examples:

```tsx
import { PersonalInfoForm } from "@/components/portfolio/PersonalInfoForm";
import { ProfilesForm } from "@/components/portfolio/ProfilesForm";
import { WorkExperienceForm } from "@/components/portfolio/WorkExperienceForm";
import { ProjectsForm } from "@/components/portfolio/ProjectsForm";
import { EducationForm } from "@/components/portfolio/EducationForm";
import { CertificationsForm } from "@/components/portfolio/CertificationsForm";
import { TextBlobsForm } from "@/components/portfolio/TextBlobsForm";

// Example: Personal Info
<PersonalInfoForm value={personalInfo} onChange={setPersonalInfo} />

// Example: Work Experience list
<WorkExperienceForm value={workExperiences} onChange={setWorkExperiences} />
```

## Preview component

`PortfolioPreview` renders a clean, responsive portfolio layout using the same `PortfolioData`. You can swap it with your own visual design while keeping the same data shape.

```tsx
import PortfolioPreview from "@/components/portfolio/PortfolioPreview";

<PortfolioPreview data={portfolioData} />;
```

## Theming and styling

- Components rely on Tailwind CSS and CSS variables provided by your app’s theme. No absolute heights are used.
- Dark mode is supported via the `.dark` class if your app toggles it.
- Layout uses standard paddings and flexible widths to fit parent containers.

## Validation

- The editor enables the Preview tab once `personal_info.full_name` has a non-empty value. You can extend validation rules in `PortfolioEditor` as needed.

## Metadata

- `metadata` in `PortfolioData` is intentionally not editable in the UI. Manage it server-side or where you assemble the data.

## Copying into another app

1. Copy the files from `src/types/portfolio.ts` and `src/components/portfolio/*` into your project.
2. Ensure shadcn/ui primitives exist in your app at `@/components/ui/*` for: `button`, `card`, `input`, `label`, `textarea`, `select`, `tabs`, `badge`, and any others used. If your paths differ, update imports accordingly.
3. Make sure Tailwind is configured and your global CSS defines the same CSS variables or maps them to your theme.
4. Import and render `<PortfolioEditor />` anywhere in your app. Optionally pass `initial` and handle `onChange`.

## Accessibility

- Form inputs are labeled via `<Label htmlFor>` where applicable.
- Tab navigation uses shadcn Tabs built on Radix primitives for good a11y by default.

## Notes

- All Select items have non-empty values.
- No packages are installed by these components.
- Avoid editing Next.js `src/app/layout.tsx` to add client directives; it must remain a Server Component.

---

If you need a different preview design, duplicate `PortfolioPreview.tsx` and customize the rendering while keeping the same `PortfolioData` prop.
