# Template Components Styling & Shadcn Setup

## Overview

`packages/template-components` is a shared component library that **does not bundle its own styles**. It relies entirely on the consuming application's Tailwind CSS setup and design tokens.

## Architecture

### Two Theming Modes

The package supports **both shared and isolated theming**:

#### 1. Shared Theme (Default)

- Uses consuming app's CSS variables (`--primary`, `--foreground`, etc.)
- Components automatically match the parent app's design system
- No style conflicts

#### 2. Isolated Theme (Optional)

- `portfolio-theme.module.css` provides scoped CSS variables
- Portfolio components can use `.portfolioTheme` class for isolation
- Custom color palette independent of parent app
- Useful when portfolio needs different aesthetics than the main app

### Why This Hybrid Approach?

1. **Flexibility** - Use parent theme or custom theme per use case
2. **Zero conflicts** - CSS modules scope prevents variable clashes
3. **No Tailwind build** - No separate Tailwind config in package
4. **Smaller bundle** - Only adds CSS when needed

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
│   │   ├── ui/                          # Shadcn components go here
│   │   │   └── carousel.tsx
│   │   ├── portfolio-theme.module.css   # Optional scoped theme
│   │   ├── Portfolio.tsx
│   │   └── ChatPortfolio.tsx
│   ├── lib/
│   │   └── cn.ts                        # tailwind-merge utility
│   ├── styles.css                       # Only .thin-scrollbar utility
│   └── index.ts                         # Main export
├── dist/                                # Build output
│   ├── index.mjs
│   ├── index.cjs
│   ├── index.d.ts
│   └── style.css                        # Contains .thin-scrollbar
├── tsconfig.json                        # Has @/* alias
├── vite.config.ts                       # Build config
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

## Theme Isolation with CSS Modules

### How Portfolio Theme is Applied

**Both `TraditionalPortfolio` and `ChatPortfolio` components automatically apply `.portfolioTheme`** at their root:

```tsx
// In TraditionalPortfolio.tsx & ChatPortfolio.tsx
import styles from "./portfolio-theme.module.css";

export function TraditionalPortfolio() {
  return (
    <div className={styles.portfolioTheme}>
      {/* All portfolio content uses isolated theme */}
    </div>
  );
}
```

**What it affects:**

- ✅ Hero, Experience, Education, Projects, Skills sections (Traditional)
- ✅ Chat interface, composer, thread messages (Chat)
- ✅ All child components and widgets
- ❌ Does NOT affect: Standalone UI components (Button, Card, etc.) used outside portfolio

### Using the Portfolio Theme

The `portfolio-theme.module.css` file provides an **isolated design system** for portfolio components:

```tsx
// Portfolio component using isolated theme
import styles from "./portfolio-theme.module.css";

export function Portfolio() {
  return (
    <div className={styles.portfolioTheme}>
      {/* All children use scoped CSS variables */}
      <h1 className="text-foreground">Uses --foreground from portfolioTheme</h1>
      <button className="bg-primary">Uses --primary from portfolioTheme</button>
    </div>
  );
}
```

### Theme Scope

**Inside `.portfolioTheme`:**

```css
:local(.portfolioTheme) {
  --background: oklch(0.99 0 0); /* Custom light background */
  --foreground: oklch(0.18 0 0); /* Custom text color */
  --primary: oklch(0.28 0.02 260); /* Custom primary */
  /* ... other variables */
}
```

**Outside `.portfolioTheme`:**

- Uses parent app's CSS variables
- No conflict with portfolio theme

### When to Use Each Mode

| Use Case                       | Theme Mode                   | Example                                                |
| ------------------------------ | ---------------------------- | ------------------------------------------------------ |
| Portfolio preview in main app  | Isolated (`.portfolioTheme`) | Editing interface where portfolio needs different look |
| Standalone portfolio viewer    | Shared (parent theme)        | `apps/template` displays portfolio with its own theme  |
| Embedded portfolio widget      | Isolated (`.portfolioTheme`) | Portfolio embedded in another site                     |
| Portfolio components in app UI | Shared (parent theme)        | Using portfolio cards in app's design system           |

### Dark Mode Support

The scoped theme automatically adapts:

```css
:global(.dark) :local(.portfolioTheme) {
  --background: oklch(0.22 0.01 260); /* Dark mode override */
  --foreground: oklch(0.96 0 0);
  /* ... */
}
```

The parent app's dark mode class (`.dark`) triggers the portfolio's dark theme.

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

### Example: Using in App (Shared Theme)

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

### Example: Portfolio Already Has Isolated Theme

```tsx
// apps/main/src/components/PortfolioPreview.tsx
import { TraditionalPortfolio } from "@portfolioly/template-components";

export function PortfolioPreview() {
  return (
    <div className="p-4 bg-background">
      {/* Parent app's theme (main app colors) */}
      <h1 className="text-2xl mb-4">Portfolio Preview</h1>

      {/* Portfolio automatically uses isolated theme - no wrapper needed! */}
      <TraditionalPortfolio data={portfolioData} />
    </div>
  );
}
```

**Why no wrapper?** `TraditionalPortfolio` and `ChatPortfolio` already apply `.portfolioTheme` internally, so they automatically have isolated styling.

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
7. **Understand theme scoping**:
   - `TraditionalPortfolio` & `ChatPortfolio` always use isolated theme
   - Individual UI components (Button, Card) use parent theme
   - No need to wrap portfolio components - theme is built-in
8. **Don't modify `portfolio-theme.module.css`** unless intentionally changing portfolio's design system

## Summary

- ✅ `TraditionalPortfolio` & `ChatPortfolio` always use isolated theme (built-in)
- ✅ Individual UI components use parent app's theme
- ✅ Portfolio theme uses CSS modules for scoped variables
- ✅ No Tailwind build in package, relies on consuming app
- ✅ Add shadcn via main app, then copy
- ✅ Install Radix primitives in the package
- ✅ Rebuild package after adding components
