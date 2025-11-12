# Separate Template Repository Strategy

## Single-Path Strategy (Git Subtree Auto-Sync)

**Two Repos:**

1. **Main Monorepo** (portfolioly) - Development happens here
2. **Template Repo** (portfolioly-template) - Auto-synced via git subtree

**Flow:**

```
Monorepo (Development)
  └── apps/template/
      ├── src/
      ├── lib/         ← Gitignored in monorepo
      │   ├── schema/  ← Built packages (auto-generated)
      │   └── components/
      └── package.json (uses file:./lib/...)

Git subtree split → Template Repo (includes lib/)
                    └── Vercel deploys ✓
```

**Key Concept:**

- `lib/` is gitignored in monorepo (never committed)
- CI builds packages into `lib/` temporarily
- Git subtree pushes `apps/template/` (including `lib/`) to template repo
- Template repo is a clean, standalone Next.js app

## Template Repo Structure (Auto-Generated)

```
portfolioly-template/          # Root is apps/template/
├── src/                       # Template app source
├── lib/                       # Bundled packages (pre-built)
│   ├── schema/
│   │   ├── index.mjs
│   │   ├── index.d.ts
│   │   └── package.json
│   └── components/
│       ├── index.mjs
│       ├── index.d.ts
│       ├── style.css
│       └── package.json
├── package.json               # Uses file:./lib/...
├── next.config.ts
└── .env.example
```

## Setup (One-Time)

### 1) Make template app dual-mode (workspace for dev, bundled for deploy)

**Update `apps/template/package.json`:**

Add a script to toggle dependencies for standalone deploy:

```json
{
  "name": "template",
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "prepare-standalone": "node scripts/prepare-standalone.js"
  },
  "dependencies": {
    "@portfolioly/schema": "workspace:*",
    "@portfolioly/template-components": "workspace:*"
  }
}
```

**Create `apps/template/scripts/prepare-standalone.js`:**

```javascript
const fs = require("fs");
const path = require("path");

// Read current package.json
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

// Replace workspace dependencies with local file paths
pkg.dependencies["@portfolioly/schema"] = "file:./lib/schema";
pkg.dependencies["@portfolioly/template-components"] = "file:./lib/components";

// Write updated package.json
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));

console.log("✅ Converted to standalone mode");
```

**Add `apps/template/.gitignore`:**

```
lib/
```

This ensures `lib/` is never committed in the monorepo.

### 2) Build libs into the template (CI-only)

**Create `scripts/build-template-libs.sh`:**

```bash
#!/bin/bash
set -e

TEMPLATE_DIR="apps/template"

echo "🔧 Building packages..."
yarn workspace @portfolioly/schema build
yarn workspace @portfolioly/template-components build

echo "📦 Bundling into template/lib..."
rm -rf "$TEMPLATE_DIR/lib"
mkdir -p "$TEMPLATE_DIR/lib/schema"
mkdir -p "$TEMPLATE_DIR/lib/components"

# Copy built packages
cp -r packages/schema/dist/* "$TEMPLATE_DIR/lib/schema/"
cp packages/schema/package.json "$TEMPLATE_DIR/lib/schema/"

cp -r packages/template-components/dist/* "$TEMPLATE_DIR/lib/components/"
cp packages/template-components/package.json "$TEMPLATE_DIR/lib/components/"
cp packages/template-components/styles.css "$TEMPLATE_DIR/lib/components/"

echo "✅ Libraries bundled to $TEMPLATE_DIR/lib"
```

```bash
chmod +x scripts/build-template-libs.sh
```

### 3) Auto-sync with git subtree (CI)

**Create `.github/workflows/sync-template.yml`:**

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

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"

      - name: Enable Corepack
        run: corepack enable

      - name: Install dependencies
        run: yarn install

      - name: Build packages into template/lib
        run: ./scripts/build-template-libs.sh

      - name: Prepare standalone package.json
        run: |
          cd apps/template
          node scripts/prepare-standalone.js

      - name: Create deployment commit
        run: |
          cd apps/template
          git add -f lib/ package.json
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git commit -m "Add bundled dependencies for deployment" || true

      - name: Push to template repo using subtree
        run: |
          git remote add template-repo https://x-access-token:${{ secrets.TEMPLATE_REPO_TOKEN }}@github.com/yashrathi-git/portfolioly-template.git || true
          git subtree split --prefix apps/template -b template-deploy
          git push template-repo template-deploy:main --force

      - name: Cleanup
        run: |
          git reset --hard HEAD~1
          git branch -D template-deploy || true
```

**What CI does:**

1. Builds packages into `apps/template/lib/`
2. Updates `package.json` to use `file:./lib/...`
3. Creates a temporary commit with lib/ included
4. Uses git subtree to push ONLY `apps/template/` to the template repo
5. Cleans up temporary changes

### 4) Create Template Repository (once)

```bash
# Create empty repo on GitHub
gh repo create portfolioly-template --public

# First sync will populate it
# Trigger manually or push to main branch
```

### 5) Configure Secret (once)

GitHub Settings → Secrets → Actions:

- Add `TEMPLATE_REPO_TOKEN` with `repo` scope

## Development & Deployment (Single Way)

### You do only this:

```bash
# 1) Develop in monorepo (workspace deps)
yarn dev:template   # or: yarn workspace template dev

# 2) Commit & push to main
git push            # CI builds & syncs template repo via subtree ✓
```

Notes:

- `lib/` is CI-generated; you never touch it locally
- Workspace development stays fast and simple

## Deploy Button Integration

**In Main App (PortfolioPreview.tsx):**

```tsx
const deployUrl = new URL("https://vercel.com/new/clone");
deployUrl.searchParams.set(
  "repository-url",
  "https://github.com/yashrathi-git/portfolioly-template" // ← Template repo
);
deployUrl.searchParams.set("project-name", "my-portfolio");
deployUrl.searchParams.set(
  "env",
  "NEXT_PUBLIC_API_BASE_URL,NEXT_PUBLIC_PUBLIC_TOKEN"
);
deployUrl.searchParams.set("envDescription", "Portfolio configuration");

// Pre-fill values
const envObject = {
  NEXT_PUBLIC_API_BASE_URL: "https://api.portfolioly.com",
  NEXT_PUBLIC_PUBLIC_TOKEN: userPublicToken,
};
deployUrl.searchParams.set("envDefaults", JSON.stringify(envObject));
```

**User Experience:**

1. Click "Deploy to Vercel"
2. Vercel clones `portfolioly-template` (simple Next.js app)
3. Standard build works immediately
4. Portfolio deployed in 60 seconds ✓

## Advantages of Git Subtree Approach

**For Development:**

- ✅ One way to run: monorepo dev with workspace deps
- ✅ `lib/` is gitignored - never clutters your repo
- ✅ No manual copying or hardcoding
- ✅ Type safety and hot reload work perfectly
- ✅ Single source of truth in monorepo

**For Deployment:**

- ✅ **Git subtree handles everything** - no custom scripts
- ✅ Template repo is pure Next.js (no monorepo complexity)
- ✅ Fast Vercel builds (packages pre-built)
- ✅ No `workspace:*` or Yarn 4 issues
- ✅ Users can fork and customize easily

**For Maintenance:**

- ✅ **Fully automated** - push to main = auto sync
- ✅ Template repo always matches main repo
- ✅ Minimal configuration needed
- ✅ Clean git history in template repo
- ✅ No temporary directories or manual cleanup

**Why Better Than Previous Approach:**

- ❌ No hardcoded paths or copy-paste logic
- ❌ No temporary directories to manage
- ❌ No complex bash scripts with multiple steps
- ✅ Uses native git commands (subtree)
- ✅ Package.json transformation is minimal and clean
- ✅ Everything happens in CI, never pollutes local dev

## Summary

**What You Get:**

- ✅ One clear way to run: `yarn dev:template` in monorepo
- ✅ `lib/` auto-generated only during deployment
- ✅ Git subtree automatically syncs `apps/template/` to separate repo
- ✅ Template repo is clean, standalone Next.js app
- ✅ Deploy button works flawlessly (no monorepo issues)
- ✅ No hardcoding, no manual steps

**Your Only Workflow:**

```bash
# 1) Develop
yarn dev:template

# 2) Ship
git push

# Done — CI builds, bundles, subtree-pushes, and Vercel can deploy
```

**What CI Does Automatically:**

1. Builds `@portfolioly/schema` and `@portfolioly/template-components`
2. Bundles them into `apps/template/lib/`
3. Updates `package.json` to use `file:./lib/...`
4. Uses git subtree to push only `apps/template/` to template repo
5. Cleans up temporary changes

**Result:** Template repo stays in sync, deployment works perfectly, you do nothing extra.
