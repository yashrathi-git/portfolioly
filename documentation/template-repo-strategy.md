# One‑Click Deploy with a Minimal Template Repo (NPM‑first, Dual‑mode Dev)

This document is the single source of truth for:

- Developing the template app inside the monorepo with zero friction
- Publishing reusable packages to npm
- Auto‑syncing a separate, minimal template GitHub repo for Vercel’s Deploy Button
- Generating a correct Deploy Button URL with prefilled env vars

Goals:

- Keep your original repo out of user clones (no lost history/attribution)
- Keep the template repo minimal; rely on published packages
- Follow best practices with minimal ongoing effort

## Architecture

Two repos, one codebase:

1. Main monorepo (development happens here)
2. Separate template repo (auto‑synced; minimal Next.js app)

Key idea: The template app depends on `@portfolioly/*` packages published to npm using normal semver ranges. In the monorepo, Yarn workspaces link to local sources automatically when versions satisfy the range; in the separate template repo, they resolve from npm. No toggle scripts needed.

```
Monorepo
  apps/template/                # Next.js app (dev target)
  packages/schema               # @portfolioly/schema (published)
  packages/template-components  # @portfolioly/template-components (published)

Git subtree split → portfolioly-template (separate repo)
  └── a minimal Next.js app that depends on npm @portfolioly/* packages
```

## Package Publishing (npm)

We publish `portfolioly-schema` and `portfolioly-template-components` to npm using **npm trusted publishing** (OIDC authentication).

### Prerequisites for Trusted Publishing

1. npm CLI v11.5.1 or later (automatically installed in CI)
2. Packages must already exist on npmjs.com (initial publish done manually)
3. Trusted publisher configured on npmjs.com for each package:

   - Organization/User: `yashrathi-git`
   - Repository: `portfolioly`
   - Workflow filename: `release.yml`

4. Ensure each package builds to a portable `dist/`:

Example `packages/template-components/package.json`:

```json
{
  "name": "@portfolioly/template-components",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.cjs",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist", "package.json", "README.md", "LICENSE"],
  "scripts": {
    "build": "tsup src/index.tsx --dts --format cjs,esm --sourcemap"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

Do similar for `@portfolioly/schema` (use `tsc` or `tsup` to emit `.d.ts` + JS).

2. Monorepo release flow with Changesets:

```bash
yarn add -D @changesets/cli
yarn changeset init
```

Create a release when package changes occur:

```bash
yarn changeset   # choose packages and bump types
yarn changeset version
yarn install     # updates lockfile with new versions
```

3. GitHub Action to publish to npm (using npm trusted publishing):

`.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org
      - name: Enable Corepack
        run: corepack enable
      - name: Install
        run: yarn install --immutable
      - name: Build
        run: yarn workspaces foreach -A run build
      - name: Create versions from changesets
        run: yarn changeset version
      - name: Reinstall after version bump
        run: yarn install --immutable
      - name: Publish
        run: yarn workspaces foreach -A npm publish --tolerate-republish
        # No NODE_AUTH_TOKEN needed - using npm trusted publishing via OIDC
```

Notes:

- Use semver ranges in dependents (e.g. `^0.1.0`).
- Yarn in the monorepo links local workspaces when versions match. Outside, npm registry is used.

## Template App (dual‑mode with zero toggles)

Set normal semver dependencies in `apps/template/package.json`:

```json
{
  "name": "template",
  "private": false,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start -p 3000"
  },
  "dependencies": {
    "@portfolioly/schema": "^0.1.0",
    "@portfolioly/template-components": "^0.1.0",
    "next": "15.x",
    "react": "18.x",
    "react-dom": "18.x"
  }
}
```

Why this works:

- In the monorepo: Yarn links to `packages/*` automatically (versions satisfy `^0.1.0`).
- In the separate template repo: dependencies resolve from npm (no workspaces needed).

## Auto‑Sync a Separate Template Repository (git subtree)

Keep `portfolioly-template` minimal. We push only `apps/template/` to it—no local bundling required because dependencies come from npm.

Create `.github/workflows/sync-template.yml` in the monorepo:

```yaml
name: Sync Template Repository

on:
  push:
    branches:
      - main
    paths:
      - "apps/template/**"
      - "packages/schema/**"
      - "packages/template-components/**"
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout with full history
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.TEMPLATE_REPO_TOKEN }}

      - name: Push apps/template to separate repo via subtree
        run: |
          git remote add template-repo https://x-access-token:${{ secrets.TEMPLATE_REPO_TOKEN }}@github.com/yashrathi-git/portfolioly-template.git || true
          git subtree split --prefix apps/template -b template-deploy
          git push template-repo template-deploy:main --force
          git branch -D template-deploy || true
```

One‑time setup:

```bash
gh repo create portfolioly-template --public
# Add TEMPLATE_REPO_TOKEN (repo scope) in the monorepo GitHub secrets
```

Template repo structure (auto‑generated by subtree):

```
portfolioly-template/
├── src/
├── public/
├── package.json            # semver deps on @portfolioly/*
├── next.config.ts
└── .env.example
```

## Deploy Button Integration (point to the template repo)

Use Vercel’s documented env prefill syntax `env[NAME]` (not `envDefaults`).

Example (`apps/main/.../DeployButton.tsx`):

```tsx
const deployUrl = new URL("https://vercel.com/new/clone");
deployUrl.searchParams.set(
  "repository-url",
  "https://github.com/yashrathi-git/portfolioly-template"
);
deployUrl.searchParams.set("project-name", `${username || "my"}-portfolio`);
deployUrl.searchParams.set("repository-name", `${username || "my"}-portfolio`);
deployUrl.searchParams.set(
  "env",
  "NEXT_PUBLIC_USERNAME,NEXT_PUBLIC_PSK_TOKEN,NEXT_PUBLIC_API_BASE_URL"
);
if (username) deployUrl.searchParams.set("env[NEXT_PUBLIC_USERNAME]", username);
if (publicToken)
  deployUrl.searchParams.set("env[NEXT_PUBLIC_PSK_TOKEN]", publicToken);
deployUrl.searchParams.set("env[NEXT_PUBLIC_API_BASE_URL]", apiBaseUrl);
```

Template `.env.example`:

```bash
NEXT_PUBLIC_USERNAME=your-username
NEXT_PUBLIC_PSK_TOKEN=your-public-token
NEXT_PUBLIC_API_BASE_URL=https://api.portfolioly.com
```

Notes:

- The template repo is a normal Next.js app. You typically don’t need a custom `vercel.json`.
- Keep the template repo public for the Deploy Button to work seamlessly.

## Local Dev and Shipping

```bash
# 1) Develop in monorepo
yarn dev:template  # or: yarn workspace template dev

# 2) When packages change: bump versions via changesets and publish
yarn changeset && yarn changeset version && git commit -am "chore: versions" && git push
# CI publishes to npm (Release workflow)

# 3) Push to main to sync template repo
git push  # subtree workflow updates portfolioly-template
```

## Testing Checklist

- [ ] `apps/template` runs locally in the monorepo
- [ ] Packages build and publish to npm
- [ ] `portfolioly-template` contains only the template app
- [ ] Deploy Button opens with correct repo and env prefilled
- [ ] Vercel deployment succeeds and the app loads data/chat

## Appendix: Alternative (not recommended now)

Earlier we proposed bundling prebuilt libs into `apps/template/lib` and rewriting `package.json` to `file:./lib/...`. That works but adds CI complexity and larger commits. The npm‑first approach above is simpler, standard, and requires no toggles. Consider the lib‑bundling approach only if you must avoid npm publishing.
