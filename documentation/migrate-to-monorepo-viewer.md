## Monorepo Migration: Single Components Package (`@portfolioly/template-components`)

Goal: Move all reusable UI and feature components into one workspace package `packages/template-components`, including the minimal CSS they need. The `template/` Next.js app will consume this package and contain only routing, data, and app shell.

This guide replaces earlier multi-package steps. If you previously created `@portfolioly/ui` or `@portfolioly/viewer`, you can remove/ignore them and follow this plan.

---

### 0) Prerequisites

- Node 18+
- Yarn 4 (node_modules linker)
- Next.js App Router in `template/`

---

### 1) Ensure monorepo setup

At repo root, your `package.json` should declare workspaces:

```json
{
  "name": "portfolioly",
  "private": true,
  "workspaces": ["apps/*", "packages/*", "template"],
  "packageManager": "yarn@4.9.4",
  "scripts": {
    "build": "yarn workspaces foreach -At run build",
    "watch": "yarn workspaces foreach -At run watch",
    "dev:template": "yarn workspace template dev"
  }
}
```

Use node_modules linker for Next.js:

```yaml
# .yarnrc.yml
nodeLinker: node-modules
```

Install once:

```bash
yarn install
```

---

### 2) Scaffold the components package

Create the package structure:

```bash
mkdir -p packages/template-components/src/{components,lib}
```

`packages/template-components/package.json`:

```json
{
  "name": "@portfolioly/template-components",
  "private": true,
  "version": "0.0.0",
  "main": "dist/index.cjs",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react-swc": "^3",
    "typescript": "^5",
    "vite": "^5",
    "vite-plugin-dts": "^4"
  },
  "scripts": {
    "build": "vite build",
    "watch": "vite build --watch"
  }
}
```

`packages/template-components/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "composite": false,
    "declaration": true,
    "emitDeclarationOnly": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

`packages/template-components/vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dts from "vite-plugin-dts";
import fs from "node:fs";

// Externalize peer deps automatically
const pkg = JSON.parse(
  fs.readFileSync(new URL("./package.json", import.meta.url), "utf-8")
);
const external = Object.keys(pkg.peerDependencies || {});
if (external.includes("react")) external.push("react/jsx-runtime");

export default defineConfig({
  plugins: [react(), dts({ entryRoot: "src" })],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "TemplateComponents",
      formats: ["es", "cjs"],
      fileName: (fmt) => `index.${fmt}.js`,
    },
    rollupOptions: { external },
  },
});
```

`packages/template-components/src/lib/cn.ts`:

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

`packages/template-components/src/styles.css` (CSS that components require):

```css
/* Minimal base/tokens required by components.
   Copy the relevant CSS variables and base layer from template/src/app/globals.css.
   Keep Tailwind utilities in the app; this file should only define tokens/base styles. */
/* Example skeleton:
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  /* ...copy the variables used by your components... */
}
.dark {
  /* ...dark variants if needed... */
}
```

`packages/template-components/src/index.ts`:

```ts
// Re-export public components and utilities
export * from "./components"; // if you add an index under components/
export { cn } from "./lib/cn";
// styles: imported by the app (see Step 5). Do not auto-import here.
```

---

### 3) Move components and helpers into the package

From the `template/` app, move all reusable code to the package:

```bash
# Components and helpers
cp -R template/src/components/* packages/template-components/src/components/
mkdir -p packages/template-components/src/lib
cp -R template/src/lib/* packages/template-components/src/lib/ 2>/dev/null || true
```

Fix imports inside the package to avoid app aliases:

```bash
# Replace app alias imports with relative or local ones
find packages/template-components/src -type f -name "*.{ts,tsx}" -print0 | \
  xargs -0 sed -i 's|from "@/components/|from "./components/|g'
find packages/template-components/src -type f -name "*.{ts,tsx}" -print0 | \
  xargs -0 sed -i 's|from "@/lib/|from "./lib/|g'
```

If you reference third-party UI libs (Radix, `lucide-react`, `framer-motion`, `embla-carousel-react`, `cmdk`, `vaul`, `react-day-picker`, `react-resizable-panels`, `input-otp`, etc.), add them as peerDependencies in `packages/template-components/package.json` and rebuild. This prevents duplicating React or UI libs.

Example:

```json
{
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18",
    "lucide-react": "*",
    "framer-motion": "*",
    "embla-carousel-react": "*",
    "cmdk": "*",
    "vaul": "*",
    "react-day-picker": "*",
    "react-resizable-panels": "*",
    "input-otp": "*"
  }
}
```

---

### 4) Build the package

```bash
yarn workspace @portfolioly/template-components build
```

If the build complains about unresolved paths, fix the remaining `@/` aliases to relative imports in the package code.

---

### 5) Wire the template app to consume the package

1. Add dependency in `template/package.json`:

```json
{
  "dependencies": {
    "@portfolioly/template-components": "workspace:*"
  }
}
```

2. Next.js config: transpile the workspace package (if needed):

```ts
// template/next.config.ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  transpilePackages: ["@portfolioly/template-components"],
};
export default nextConfig;
```

3. Tailwind v4: ensure the app scans the package sources so class names aren’t purged. In `template/tailwind.config.ts` (or equivalent):

```ts
export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "../packages/template-components/src/**/*.{ts,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
};
```

4. Import the package CSS tokens/base into the app’s global CSS (or layout):

```css
/* template/src/app/globals.css */
@import "@portfolioly/template-components/styles.css";
@import "tailwindcss";
/* your other global imports */
```

5. Replace local imports with package imports in the app. For example, in a page/component:

```tsx
// template/src/app/page.tsx
import { SomeComponent } from "@portfolioly/template-components";

export default function Page() {
  return <SomeComponent />;
}
```

---

### 6) Run the app

```bash
yarn install
yarn workspace @portfolioly/template-components build
yarn workspace template dev
```

If you iterate on the package frequently:

```bash
yarn workspace @portfolioly/template-components watch &
yarn workspace template dev
```

---

### 7) Notes on CSS and theming

- Keep Tailwind config and utilities in the app. The package should only ship minimal CSS variables/base (in `styles.css`) needed by its components.
- If the app already defines tokens in `globals.css`, either:
  - move those token definitions into the package’s `styles.css`, or
  - keep them in the app and remove/trim `styles.css` from the package. In that case, delete the import in Step 5.4.
- Ensure only one copy of React is used. All UI libs used by components should be peers/externalized by Vite.

---

### 8) Optional cleanup

- Remove old `packages/ui` or `packages/viewer` if you created them earlier.
- Delete unused local `template/src/components/*` folders after migration.

This simplified setup centralizes all reusable UI/feature code in a single package and keeps the Next.js app lean, while preserving Tailwind and theming in one place.

## Portfolioly Monorepo Migration & Shared Viewer Package (Action Plan)

This guide converts your current repository into a Yarn workspaces monorepo with a reusable Viewer package that renders a portfolio UI from JSON/props. It keeps your template as a deployable Next.js app and prepares a second app (`apps/web`) that serves `/username` previews using the same UI package.

This document is tailored to your repo:

- Current template app: `portfolio-tempalte/` (Next.js, with `src/components/ui/*` shadcn components, `src/lib/utils.ts`, chat-related components).
- Goal packages: `@portfolioly/shared` (types), `@portfolioly/ui` (shadcn primitives + `cn`), `@portfolioly/viewer` (portfolio UI that accepts data as props/JSON).

References: See `documentation/create-viewer-package.md` for the conceptual overview; this file is the concrete, end-to-end checklist with commands.

---

### 0) Prerequisites

- Node 18+ installed
- Yarn 4 (use node_modules linker for best Next.js compat)
- Git clean working tree recommended

Optional but recommended:

- VSCode + TS, ESLint
- `corepack enable` to manage Yarn

---

### 1) Initialize monorepo at the root

1. Ensure you are at repo root:

```bash
cd /home/yashrathi/Documents/AA_Essential_projx/portfolioly/portfolioly-main
```

2. Create root `package.json` for workspaces:

```json
{
  "name": "portfolioly",
  "private": true,
  "workspaces": ["apps/*", "packages/*", "template"],
  "packageManager": "yarn@4.7.0",
  "scripts": {
    "build": "yarn workspaces foreach -At run build",
    "watch": "yarn workspaces foreach -At run watch",
    "dev:template": "yarn workspace template dev",
    "dev:web": "yarn workspace @portfolioly/web dev"
  }
}
```

3. Use Yarn 4 and node_modules linker:

```bash
corepack enable
yarn set version stable
printf "nodeLinker: node-modules\n" > .yarnrc.yml
yarn install
```

4. (Optional) Create a shared TS base config at the root:

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "baseUrl": "."
  }
}
```

---

### 2) Normalize the template app location (fix the typo)

Move `portfolio-tempalte/` to `template/` (or keep both, but recommended to rename):

```bash
git mv portfolio-tempalte template
```

Ensure `template/package.json` has a proper `name` field (we will keep it as `template`), and that its `tsconfig.json` extends the root base config if you added it:

```json
// template/tsconfig.json (snippet)
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "allowJs": false
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

---

### 3) Scaffold packages

Create packages skeleton:

```bash
mkdir -p packages/shared/src packages/ui/src/{ui,lib} packages/viewer/src
```

Add `packages/shared/package.json`:

```json
{
  "name": "@portfolioly/shared",
  "private": true,
  "version": "0.0.0",
  "main": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "devDependencies": {
    "typescript": "^5.8.3",
    "tsup": "^8.3.0"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "watch": "tsup src/index.ts --format esm --dts --watch"
  }
}
```

Add `packages/shared/src/index.ts`:

```ts
export type BuildJson = {
  handle: string;
  name: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;
  skills?: string[];
  projects?: {
    name: string;
    description?: string;
    url?: string;
    imageUrl?: string;
  }[];
  links?: { email?: string; github?: string; linkedin?: string };
  settings?: Record<string, unknown>;
};
```

Add `packages/ui/package.json`:

```json
{
  "name": "@portfolioly/ui",
  "private": true,
  "version": "0.0.0",
  "main": "dist/index.cjs",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  },
  "devDependencies": {
    "vite": "^5",
    "@vitejs/plugin-react-swc": "^3",
    "vite-plugin-dts": "^4",
    "typescript": "^5",
    "@types/react": "^18",
    "@types/react-dom": "^18"
  },
  "scripts": {
    "build": "vite build",
    "watch": "vite build --watch"
  }
}
```

Add `packages/ui/vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [react(), dts({ entryRoot: "src" })],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "PortfoliolyUI",
      formats: ["es", "cjs"],
      fileName: (fmt) => `index.${fmt}.js`,
    },
    rollupOptions: { external: ["react", "react-dom"] },
  },
});
```

Add `packages/ui/src/lib/utils.ts` (move `cn` helper here):

```ts
// Will replace the one from template/src/lib/utils.ts during migration
import { type ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Add `packages/ui/src/index.ts` (export shadcn primitives and `cn`):

```ts
// Re-export migrated shadcn components here as you move them from the template
export * from "./ui/button";
export * from "./ui/input";
export * from "./ui/dialog";
export * from "./ui/tooltip";
export * from "./ui/sonner";
export { cn } from "./lib/utils";
```

Add `packages/viewer/package.json`:

```json
{
  "name": "@portfolioly/viewer",
  "private": true,
  "version": "0.0.0",
  "main": "dist/index.cjs",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  },
  "dependencies": {
    "@portfolioly/ui": "workspace:*",
    "@portfolioly/shared": "workspace:*"
  },
  "devDependencies": {
    "vite": "^5",
    "@vitejs/plugin-react-swc": "^3",
    "vite-plugin-dts": "^4",
    "typescript": "^5",
    "@types/react": "^18",
    "@types/react-dom": "^18"
  },
  "scripts": {
    "build": "vite build",
    "watch": "vite build --watch"
  }
}
```

Add `packages/viewer/vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [react(), dts({ entryRoot: "src" })],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "PortfoliolyViewer",
      formats: ["es", "cjs"],
      fileName: (fmt) => `index.${fmt}.js`,
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "@portfolioly/ui",
        "@portfolioly/shared",
      ],
    },
  },
});
```

Add `packages/viewer/src/index.ts`:

```ts
export { PortfolioViewer } from "./PortfolioViewer";
export type { BuildJson } from "@portfolioly/shared";
```

Add `packages/viewer/src/PortfolioViewer.tsx`:

```tsx
import * as React from "react";
import type { BuildJson } from "@portfolioly/shared";
import { TooltipProvider } from "@portfolioly/ui";

export function PortfolioViewer({ data }: { data: BuildJson }) {
  return (
    <TooltipProvider>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold">{data.name}</h1>
      </div>
    </TooltipProvider>
  );
}
```

---

### 4) Migrate code from the template app into packages

From `template/` (formerly `portfolio-tempalte/`):

- Move shadcn primitives and utilities to `@portfolioly/ui`:
  - `template/src/components/ui/**/*` → `packages/ui/src/ui/**/*`
  - `template/src/lib/utils.ts` → `packages/ui/src/lib/utils.ts` (replace the stub if needed)
  - Adjust all internal imports inside `packages/ui/src/ui/*` to import `cn` from `@portfolioly/ui` or relative `../lib/utils`.

- Extract reusable portfolio UI to `@portfolioly/viewer`:
  - Components under `template/src/components/*` that render the portfolio (e.g., `ChatPortfolio.tsx`, hero, logo, section components) → move to `packages/viewer/src/components/*`.
  - Replace imports from `@/components/ui/*` with `@portfolioly/ui` equivalents.
  - Ensure components receive data via props from `BuildJson` instead of fetching or using Next server APIs.
  - Compose them in `packages/viewer/src/PortfolioViewer.tsx`.

- Keep app-specific code in the template:
  - Next.js routing: `template/src/app/**/*`, `layout.tsx`, `page.tsx`, `loading.tsx`, `global-error.tsx`.
  - Any API routes, middleware, or deployment-specific config.

Checklist:

- [ ] All shadcn UI moved to `packages/ui` and exported from `packages/ui/src/index.ts`
- [ ] All viewer components import UI from `@portfolioly/ui`
- [ ] No `@/` absolute alias remains inside packages (use relative paths or package imports)
- [ ] No Tailwind CSS imported inside packages (Tailwind lives in apps)
- [ ] `PortfolioViewer` is the single package entry that composes the view

---

### 5) Wire up the template app to consume packages

1. Add workspace dependencies to `template/package.json`:

```json
{
  "dependencies": {
    "@portfolioly/ui": "workspace:*",
    "@portfolioly/shared": "workspace:*",
    "@portfolioly/viewer": "workspace:*"
  }
}
```

2. Next config: transpile workspace packages (if needed):

```ts
// template/next.config.ts (augment existing config)
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@portfolioly/ui", "@portfolioly/viewer"],
};

export default nextConfig;
```

3. Tailwind: include package sources in `content` so classes are not purged. If you have no `tailwind.config.{js,ts}` yet, create one:

```ts
// template/tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "../packages/ui/src/**/*.{ts,tsx}",
    "../packages/viewer/src/**/*.{ts,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
```

4. Use the viewer in the template home page (or a route):

```tsx
// template/src/app/page.tsx (example usage)
import { PortfolioViewer } from "@portfolioly/viewer";
import type { BuildJson } from "@portfolioly/shared";
import build from "../public/build.json" assert { type: "json" };

export default function Page() {
  const data = build as BuildJson;
  return <PortfolioViewer data={data} />;
}
```

If you prefer not to import JSON, fetch it and pass to `PortfolioViewer` as a prop in a client component.

5. Create a sample JSON at `template/public/build.json` matching `BuildJson` to validate rendering.

---

### 6) Add the main app for `/username` previews (later)

When ready to initialize your main Next.js app that serves `/username` pages using the same viewer:

```bash
mkdir -p apps
cd apps
yarn create next-app --typescript web
```

Configure dependencies:

```json
// apps/web/package.json (snippet)
{
  "name": "@portfolioly/web",
  "dependencies": {
    "@portfolioly/ui": "workspace:*",
    "@portfolioly/shared": "workspace:*",
    "@portfolioly/viewer": "workspace:*"
  }
}
```

Next config:

```ts
// apps/web/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@portfolioly/ui", "@portfolioly/viewer"],
};

export default nextConfig;
```

Dynamic route to render viewer:

```tsx
// apps/web/src/app/[handle]/page.tsx
import { PortfolioViewer } from "@portfolioly/viewer";
import type { BuildJson } from "@portfolioly/shared";

async function getData(handle: string): Promise<BuildJson> {
  // Replace with your data source (DB/API). Example placeholder:
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/portfolio/${handle}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to load portfolio");
  return res.json();
}

export default async function Page({ params }: { params: { handle: string } }) {
  const data = await getData(params.handle);
  return <PortfolioViewer data={data} />;
}
```

Tailwind content in `apps/web/tailwind.config.ts` should include `../packages/ui/src/**/*` and `../packages/viewer/src/**/*` similarly to the template.

---

### 7) Install, build, and run

From the repo root:

```bash
yarn install
yarn workspace @portfolioly/shared build
yarn workspace @portfolioly/ui build
yarn workspace @portfolioly/viewer build

# Template app dev (uses the packages)
yarn workspace template dev
```

Live development (watch packages and run the app):

```bash
yarn workspace @portfolioly/ui watch &
yarn workspace @portfolioly/viewer watch &
yarn workspace template dev
```

If you add `apps/web`, run it with:

```bash
yarn workspace @portfolioly/web dev
```

---

### 8) Tailwind and CSS notes

- Do not import Tailwind CSS inside packages. Keep `globals.css` and Tailwind setup in each app.
- Ensure both apps include `packages/ui/src/**/*` and `packages/viewer/src/**/*` in `content` globs.
- The `@portfolioly/ui` components should rely on the app’s Tailwind configuration.

---

### 9) TypeScript and paths

- Inside packages, avoid `@/` path aliases. Use relative imports or package imports.
- Apps can keep `@/` aliases in their own TS config if desired; this does not leak into packages.
- Consider adding `references` if you want project references; not required for this setup.

---

### 10) React dedupe and externals

- The Vite library configs for `@portfolioly/ui` and `@portfolioly/viewer` externalize `react` and `react-dom`. This prevents bundling duplicate React copies.
- For Vite-based template apps, set `resolve: { dedupe: ["react", "react-dom"], preserveSymlinks: true }`. For Next.js, `transpilePackages` is generally enough.

---

### 11) What to move vs keep (quick mapping for your repo)

- Move to `@portfolioly/ui`:
  - `template/src/components/ui/*` (all shadcn primitives present in your repo)
  - `template/src/lib/utils.ts` (the `cn` helper)

- Move to `@portfolioly/viewer`:
  - Portfolio composition components from `template/src/components/*` that render the portfolio experience (e.g., `ChatPortfolio.tsx`, hero/sections)
  - Any portfolio widgets that are purely presentational and can receive data via props

- Keep in `template` app:
  - `src/app/*` (routing, pages, layouts)
  - API routes, error boundaries, loading UI specific to the app

---

### 12) Common pitfalls and fixes

- Build errors about CSS classes not applying: Tailwind `content` does not include package sources. Add the globs in both apps.
- Multiple React copies or hooks error: ensure packages externalize React (done) and Next.js app does not bundle React twice; do not `npm link`—use workspaces.
- PnP resolution issues: using `.yarnrc.yml` with `nodeLinker: node-modules` avoids most Next.js PnP edge cases.
- Type errors on JSON import: use `resolveJsonModule` in TS config (root base config above includes it), or load via `fetch`.

---

### 13) Next steps (only what remains)

Follow these steps to complete the migration from your current state. Assume the monorepo is initialized, packages exist, builds succeed, and `template` is wired to the packages.

1. Move shadcn primitives from the template into `@portfolioly/ui`

- Create destinations:

```bash
mkdir -p packages/ui/src/ui
```

- Move the primitives (do NOT move `navigation.tsx`; it uses Next-specific APIs):

```bash
cp -R template/src/components/ui/* packages/ui/src/ui/
rm -f packages/ui/src/ui/navigation.tsx
```

- Also do NOT keep motion-based effects in `ui`. Move these to the viewer:

```bash
mkdir -p packages/viewer/src/effects
mv packages/ui/src/ui/background-boxes.tsx packages/viewer/src/effects/background-boxes.tsx 2>/dev/null || true
mv packages/ui/src/ui/container-scroll-animation.tsx packages/viewer/src/effects/container-scroll-animation.tsx 2>/dev/null || true
```

- Fix imports inside `packages/ui/src/ui/**/*`:
  - Replace `import { cn } from "@/lib/utils"` with relative import from `../lib/utils`.
  - Replace cross-imports like `@/components/ui/button` with relative `./button`.

Examples (Linux):

```bash
find packages/ui/src/ui -type f -name "*.tsx" -print0 | xargs -0 sed -i 's|from "@/lib/utils"|from "../lib/utils"|g'
find packages/ui/src/ui -type f -name "*.tsx" -print0 | xargs -0 sed -i 's|@/components/ui/|./|g'
```

2. Export the UI primitives from `@portfolioly/ui`

- Update `packages/ui/src/index.ts` to re-export the primitives you moved (skip `navigation.tsx`). For example:

```ts
export { cn } from "./lib/utils";
export * from "./ui/accordion";
export * from "./ui/alert-dialog";
export * from "./ui/alert";
export * from "./ui/aspect-ratio";
export * from "./ui/avatar";
export * from "./ui/badge";
export * from "./ui/breadcrumb";
export * from "./ui/button";
export * from "./ui/calendar";
export * from "./ui/card";
export * from "./ui/carousel";
export * from "./ui/checkbox";
export * from "./ui/collapsible";
export * from "./ui/command";
export * from "./ui/context-menu";
export * from "./ui/dialog";
export * from "./ui/drawer";
export * from "./ui/dropdown-menu";
export * from "./ui/form";
export * from "./ui/hover-card";
export * from "./ui/input-otp";
export * from "./ui/input";
export * from "./ui/label";
export * from "./ui/menubar";
export * from "./ui/navigation-menu";
export * from "./ui/pagination";
export * from "./ui/popover";
export * from "./ui/progress";
export * from "./ui/radio-group";
export * from "./ui/resizable";
export * from "./ui/scroll-area";
export * from "./ui/select";
export * from "./ui/separator";
export * from "./ui/sheet";
export * from "./ui/sidebar";
export * from "./ui/skeleton";
export * from "./ui/slider";
export * from "./ui/sonner";
export * from "./ui/switch";
export * from "./ui/table";
export * from "./ui/tabs";
export * from "./ui/textarea";
export * from "./ui/toggle-group";
export * from "./ui/toggle";
export * from "./ui/tooltip";
```

3. Declare peer dependencies for `@portfolioly/ui` and externalize them

- Add peers used by these components to `packages/ui/package.json` (leave React as peers as already done):

```json
{
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18",
    "@radix-ui/react-accordion": "*",
    "@radix-ui/react-alert-dialog": "*",
    "@radix-ui/react-aspect-ratio": "*",
    "@radix-ui/react-avatar": "*",
    "@radix-ui/react-checkbox": "*",
    "@radix-ui/react-collapsible": "*",
    "@radix-ui/react-context-menu": "*",
    "@radix-ui/react-dialog": "*",
    "@radix-ui/react-dropdown-menu": "*",
    "@radix-ui/react-hover-card": "*",
    "@radix-ui/react-label": "*",
    "@radix-ui/react-menubar": "*",
    "@radix-ui/react-navigation-menu": "*",
    "@radix-ui/react-popover": "*",
    "@radix-ui/react-progress": "*",
    "@radix-ui/react-radio-group": "*",
    "@radix-ui/react-scroll-area": "*",
    "@radix-ui/react-select": "*",
    "@radix-ui/react-separator": "*",
    "@radix-ui/react-slider": "*",
    "@radix-ui/react-slot": "*",
    "@radix-ui/react-switch": "*",
    "@radix-ui/react-tabs": "*",
    "@radix-ui/react-toggle": "*",
    "@radix-ui/react-toggle-group": "*",
    "cmdk": "*",
    "embla-carousel-react": "*",
    "input-otp": "*",
    "lucide-react": "*",
    "react-day-picker": "*",
    "react-resizable-panels": "*",
    "sonner": "*",
    "vaul": "*",
    "next-themes": "*"
  }
}
```

- Extend `packages/ui/vite.config.ts` `rollupOptions.external` to include all of the above so they are not bundled.

4. Move portfolio-specific components into `@portfolioly/viewer`

- Move chat UI and container:

```bash
mkdir -p packages/viewer/src/chat
cp -R template/src/components/chat/* packages/viewer/src/chat/
cp template/src/components/ChatPortfolio.tsx packages/viewer/src/ChatPortfolio.tsx
```

- Fix imports inside viewer code:
  - Replace `@/components/ui/*` with `@portfolioly/ui`.
  - Ensure any `@/lib/utils` usages are removed (viewer should not depend on the app’s alias).

Examples:

```bash
find packages/viewer/src -type f -name "*.tsx" -print0 | xargs -0 sed -i 's|@/components/ui/|@portfolioly/ui/|g'
find packages/viewer/src -type f -name "*.tsx" -print0 | xargs -0 sed -i 's|from "@/lib/utils"|/* removed app utils */|g'
```

- Add peers for viewer features to `packages/viewer/package.json` (keep React peers):
  - If you use animations or effects moved above: add `framer-motion` and/or `motion` as peer deps.

```json
{
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18",
    "framer-motion": "*",
    "motion": "*"
  }
}
```

- Compose the viewer to use your real components:

```tsx
// packages/viewer/src/PortfolioViewer.tsx (example wiring)
import * as React from "react";
import type { BuildJson } from "@portfolioly/shared";
import { TooltipProvider } from "@portfolioly/ui";
import { ChatPortfolio } from "./ChatPortfolio";

export function PortfolioViewer({ data }: { data: BuildJson }) {
  const profile = { name: data.name } as any; // map from BuildJson to your chat props
  const suggestions = [] as any[];
  const presets = {} as Record<string, string>;
  return (
    <TooltipProvider>
      <div className="container mx-auto p-6">
        <ChatPortfolio
          profile={profile}
          suggestions={suggestions}
          presets={presets}
        />
      </div>
    </TooltipProvider>
  );
}
```

5. Update the template app to use the packages exclusively

- Replace any remaining `@/components/ui/*` imports in the template with `@portfolioly/ui`.
- Keep Next-specific components (e.g., `navigation.tsx`) in the template.
- Create a sample `template/public/build.json` and render `@portfolioly/viewer` in a page:

```tsx
// template/src/app/page.tsx
import { PortfolioViewer } from "@portfolioly/viewer";
import type { BuildJson } from "@portfolioly/shared";
import build from "../public/build.json" assert { type: "json" };

export default function Page() {
  return <PortfolioViewer data={build as BuildJson} />;
}
```

6. Build and verify

```bash
yarn workspace @portfolioly/ui build
yarn workspace @portfolioly/viewer build
yarn workspace template build
yarn workspace template dev
```

7. Optional: set up the main Next.js app for `/[handle]`

- Scaffold `apps/web`, add `@portfolioly/*` deps, add `transpilePackages`, and implement `app/[handle]/page.tsx` that fetches a `BuildJson` and renders `PortfolioViewer`.

8. (Optional) Tests

- Add smoke tests for `@portfolioly/viewer` and any pure functions in `@portfolioly/shared` using `vitest`.

That’s it—completing these steps finishes the extraction and ensures both the template app and your main app can consume the same UI/viewer packages.
