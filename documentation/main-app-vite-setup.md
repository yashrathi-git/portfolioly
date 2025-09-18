## Main App (Vite) Setup: Live Preview with Template Components

This guide creates a Vite React app as your main site that:

- Consumes `@portfolioly/template-components` from the monorepo
- Supports instant HMR while editing either the app or the package
- Renders the same portfolio preview (home) and a dynamic `/username` page

Prereqs:

- Node 18+
- Yarn 4 (node-modules linker)
- Monorepo at the repo root (this project)

---

### 1) Scaffold the Vite app

From the monorepo root:

```bash
mkdir -p apps
cd apps
yarn create vite main --template react-ts -- --no-git
cd main
yarn
```

Update `apps/main/package.json` for workspaces and scripts:

```json
{
  "name": "@portfolioly/main",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@portfolioly/template-components": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vite": "^5"
  }
}
```

Ensure the repo root uses Yarn node_modules linker (already configured for this repo). If missing:

```bash
printf "nodeLinker: node-modules\n" > .yarnrc.yml
yarn install
```

---

### 2) Configure Vite for monorepo HMR

Create `apps/main/vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Ensure linked workspaces (the package) use the app's React
    dedupe: ["react", "react-dom"],
    preserveSymlinks: true,
  },
  server: {
    fs: {
      // Allow serving files from outside this app (workspace package sources)
      allow: [path.resolve(__dirname, "../../")],
    },
  },
});
```

---

### 3) Tailwind v4 in the Vite app

Create `apps/main/postcss.config.mjs`:

```js
const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;
```

Create `apps/main/src/index.css`:

```css
@import "tailwindcss";
/* Scan the shared package source so its class names are included */
@source "../../../packages/template-components/src";
```

Wire CSS in `apps/main/src/main.tsx`:

```ts
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

### 4) Use the shared components (preview page)

Update `apps/main/src/App.tsx` to render the same portfolio preview as the template app:

```tsx
import { ChatPortfolio } from "@portfolioly/template-components/src/client";
import type { Profile, Suggestion } from "@portfolioly/template-components";

export default function App() {
  const profile: Profile = {
    name: "Alex Chen",
    badge: "Chat Portfolio",
    links: [
      { type: "github", href: "#" },
      { type: "mail", href: "#" },
      { type: "link", href: "#" },
    ],
  };

  const suggestions: Suggestion[] = [
    { id: "me", label: "Me", icon: "user" },
    { id: "projects", label: "Projects", icon: "folderGit2" },
    { id: "skills", label: "Skills", icon: "wrench" },
    { id: "fun", label: "Fun", icon: "smile" },
    { id: "contact", label: "Contact", icon: "mail" },
  ];

  const presets: Record<string, string> = {
    Me: "…",
    Projects: "…",
  };

  return (
    <ChatPortfolio
      profile={profile}
      suggestions={suggestions}
      presets={presets}
    />
  );
}
```

Run dev:

```bash
yarn workspace @portfolioly/template-components watch &
yarn workspace @portfolioly/main dev
```

HMR notes:

- Editing the package code rebuilds it; Vite will live reload in the main app.
- If you edit the package often, keep `watch` running as above.

---

### 5) Add a username route (SPA style)

Create `apps/main/src/pages/Username.tsx`:

```tsx
import { ChatPortfolio } from "@portfolioly/template-components/src/client";
import type { Profile, Suggestion } from "@portfolioly/template-components";

function fetchUser(handle: string) {
  // Replace with real API call
  const profile: Profile = { name: handle } as Profile;
  const suggestions: Suggestion[] = [{ id: "me", label: "Me", icon: "user" }];
  const presets: Record<string, string> = {};
  return { profile, suggestions, presets };
}

export default function Username({ handle }: { handle: string }) {
  const { profile, suggestions, presets } = fetchUser(handle);
  return (
    <ChatPortfolio
      profile={profile}
      suggestions={suggestions}
      presets={presets}
    />
  );
}
```

Add a minimal router in `apps/main/src/App.tsx` (optional):

```tsx
import { useMemo } from "react";
import Home from "./Home";
import Username from "./pages/Username";

export default function App() {
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  const page = useMemo(() => {
    const match = path.match(/^\/(.+)$/);
    if (match) return <Username handle={decodeURIComponent(match[1])} />;
    return <Home />;
  }, [path]);
  return page;
}
```

For production, prefer a proper router (e.g., React Router) or a Next.js app. The above shows how to reuse the same components to render a preview and a `/username` view.

---

### 6) Notes and best practices

- Tailwind: use `@source` in the app to scan the package sources. Do not import global CSS from the package unless you explicitly want it.
- Client components: import from `@portfolioly/template-components/src/client` so React hooks work correctly in Vite and Next.
- React singletons: ensure `resolve.dedupe` includes `react` and `react-dom`, and `preserveSymlinks: true` is set in Vite.
- Shared tokens (optional): if you want a single source of truth for theme tokens, expose a `src/tokens.css` with `@theme` in the package and consume with `@reference` in each app.
