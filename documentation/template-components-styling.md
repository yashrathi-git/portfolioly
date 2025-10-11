# Template Components Styling & Shadcn Setup

## Overview

`packages/template-components` is a shared component library that **does not bundle its own styles**. It relies entirely on the consuming application's Tailwind CSS setup and design tokens.

## Architecture

### No Style Isolation

- Template components use standard Tailwind classes (no prefix)
- Uses consuming app's CSS variables (`--primary`, `--foreground`, etc.)
- No separate Tailwind config or build in the package
- Single `.thin-scrollbar` utility is the only package-specific style

### Why This Approach?

1. **Zero conflicts** - No duplicate CSS rules or competing styles
2. **Shared design system** - Components automatically match the app's theme
3. **Smaller bundle** - No redundant Tailwind build
4. **Flexible** - Works with any app that has Tailwind + shadcn setup

## Consuming Apps Setup

Each app consuming template-components must:

### 1. Include Package in Tailwind Config

```ts
// apps/main/tailwind.config.ts or apps/template/tailwind.config.ts
export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/template-components/src/**/*.{ts,tsx}", // ← Required
  ],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
```

### 2. Import Package Styles (Optional)

```tsx
// In your app's layout or entry point
import "@portfolioly/template-components/style.css"; // Only exports .thin-scrollbar
```

The `style.css` file only contains the custom scrollbar utility. All other styles come from the app's Tailwind.

## Adding Shadcn Components

### Quick Process

Since `packages/template-components` has no `components.json` config, add shadcn components through a consuming app:

**1. Generate in the consuming app:**

```bash
cd apps/main
npx shadcn@latest add button
```

**2. Copy to template-components:**

```bash
cp src/components/ui/button.tsx ../../packages/template-components/src/components/ui/
```

**3. Update imports in the copied file:**

```tsx
// Change from:
import { cn } from "@/lib/utils";

// To:
import { cn } from "../../lib/cn";
```

**4. Export from package:**

```tsx
// packages/template-components/src/index.ts
export { Button } from "./components/ui/button";
```

**5. Rebuild:**

```bash
cd packages/template-components
yarn build
```

### Component Dependencies

#### Where to Install Dependencies

| Dependency Type                                | Install Location               | Example                         |
| ---------------------------------------------- | ------------------------------ | ------------------------------- |
| **Shared utility** (used by multiple packages) | `packages/template-components` | `clsx`, `tailwind-merge`        |
| **UI library** (peer dependency)               | Both package & apps            | `framer-motion`, `lucide-react` |
| **Radix primitive**                            | `packages/template-components` | `@radix-ui/react-dialog`        |
| **App-specific**                               | Individual app only            | `next-themes`, `firebase`       |

#### Common Shadcn Dependencies

Most shadcn components need Radix UI primitives. Install in the package:

```bash
cd packages/template-components
yarn add @radix-ui/react-dialog        # For Dialog
yarn add @radix-ui/react-dropdown-menu # For DropdownMenu
yarn add @radix-ui/react-select        # For Select
# etc.
```

#### Peer Dependencies

Already configured in `package.json`:

- `react` >= 18
- `react-dom` >= 18
- `framer-motion` ^12.23.12
- `lucide-react` ^0.544.0

Apps importing the package must have these installed.

## Current Package Dependencies

```json
{
  "dependencies": {
    "class-variance-authority": "^0.7.1", // Component variants
    "clsx": "^2.1.1", // Class merging
    "embla-carousel-react": "^8.6.0", // Carousel
    "markdown-to-jsx": "^7.7.14", // Markdown rendering
    "tailwind-merge": "^3.3.1" // Tailwind class merging
  }
}
```

## File Structure

```
packages/template-components/
├── src/
│   ├── components/
│   │   ├── ui/              # Shadcn components go here
│   │   │   └── carousel.tsx
│   │   ├── Portfolio.tsx
│   │   └── ChatPortfolio.tsx
│   ├── lib/
│   │   └── cn.ts           # tailwind-merge utility
│   ├── styles.css          # Only .thin-scrollbar utility
│   └── index.ts            # Main export
├── dist/                   # Build output
│   ├── index.mjs
│   ├── index.cjs
│   ├── index.d.ts
│   └── style.css          # Contains .thin-scrollbar
├── tsconfig.json          # Has @/* alias
├── vite.config.ts         # Build config
└── package.json
```

## TypeScript Alias

The `@/*` alias works in the package:

```tsx
// Both work:
import { cn } from "@/lib/cn";
import { cn } from "../../lib/cn";
```

Configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Examples

### Example: Adding Dialog Component

```bash
# 1. Generate in main app
cd apps/main
npx shadcn@latest add dialog

# 2. Copy to package
cp src/components/ui/dialog.tsx ../../packages/template-components/src/components/ui/

# 3. Install Radix dependency in package
cd ../../packages/template-components
yarn add @radix-ui/react-dialog

# 4. Fix imports in dialog.tsx
# Change: import { cn } from "@/lib/utils"
# To: import { cn } from "../../lib/cn"

# 5. Export from package
echo 'export * from "./components/ui/dialog";' >> src/index.ts

# 6. Rebuild
yarn build
```

### Example: Using in App

```tsx
// apps/main/src/app/page.tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
} from "@portfolioly/template-components";
import { Button } from "@portfolioly/template-components";

export default function Page() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open</Button>
      </DialogTrigger>
      <DialogContent>
        <h2>Dialog Title</h2>
        <p>Content here</p>
      </DialogContent>
    </Dialog>
  );
}
```

The Dialog uses the app's theme automatically (no style config needed).

## Troubleshooting

### Styles Not Applying

**Problem:** Components render but have no styles

**Solution:** Ensure consuming app's `tailwind.config.ts` includes the package in `content`:

```ts
content: [
  "./src/**/*.{ts,tsx}",
  "../../packages/template-components/src/**/*.{ts,tsx}",
];
```

### Import Errors

**Problem:** `Cannot find module '@/lib/utils'`

**Solution:** Update imports in copied shadcn components:

```tsx
// Change:
import { cn } from "@/lib/utils";
// To:
import { cn } from "../../lib/cn";
```

### Missing Peer Dependencies

**Problem:** `Cannot find module 'framer-motion'`

**Solution:** Install in the consuming app:

```bash
cd apps/main
yarn add framer-motion lucide-react
```

### Tailwind Classes Not Generated

**Problem:** Custom classes like `bg-primary` not working

**Solution:** Restart the consuming app's dev server to regenerate Tailwind:

```bash
# Stop dev server (Ctrl+C), then:
yarn dev:main
```

## Best Practices

1. **Always copy from apps/main** - Use it as the source of truth for shadcn components
2. **Install Radix in package** - Component primitives belong in template-components
3. **Keep peer deps minimal** - Only `react`, `react-dom`, `framer-motion`, `lucide-react`
4. **Export everything** - Add new components to `src/index.ts`
5. **Rebuild after changes** - Run `yarn build` in the package
6. **Test in both apps** - Verify in `apps/main` and `apps/template`

## Summary

- ✅ Template components use consuming app's Tailwind & theme
- ✅ No style isolation, no conflicts
- ✅ Add shadcn via main app, then copy
- ✅ Install Radix primitives in the package
- ✅ Keep peer dependencies minimal
- ✅ Rebuild package after adding components
