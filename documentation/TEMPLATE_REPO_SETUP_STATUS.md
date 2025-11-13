# Template Repository Setup Status

## ✅ Completed

### 1. Package Configuration

- Updated `packages/schema/package.json`:

  - Changed name from `@portfolioly/schema` to `portfolioly-schema` (unscoped)
  - Set `private: false` and `version: 0.1.0`
  - Added `publishConfig` with `access: public`
  - Added repository, keywords, and description

- Updated `packages/template-components/package.json`:

  - Changed name from `@portfolioly/template-components` to `portfolioly-template-components`
  - Set `private: false` and `version: 0.1.0`
  - Updated dependency to use `portfolioly-schema: ^0.1.0`
  - Added `publishConfig` with `access: public`
  - Added repository, keywords, and description

- Updated `apps/template/package.json`:

  - Changed dependency to use `portfolioly-template-components: ^0.1.0`

- Updated `apps/main/package.json`:
  - Changed dependencies to use unscoped package names

### 2. Source Code Updates

- Updated all import statements across the codebase:
  - Changed `@portfolioly/schema` → `portfolioly-schema`
  - Changed `@portfolioly/template-components` → `portfolioly-template-components`
- Files updated in:
  - `packages/template-components/src/**/*.{ts,tsx}`
  - `apps/main/src/**/*.{ts,tsx}`
  - `apps/template/src/**/*.{ts,tsx}`

### 3. Changesets Configuration

- Installed `@changesets/cli`
- Initialized changesets with `yarn changeset init`
- Configured `.changeset/config.json`:
  - Set `access: "public"`
  - Set `ignore: ["main", "template"]` to exclude apps from versioning

### 4. GitHub Actions Workflows

- Created `.github/workflows/release.yml`:

  - Automates npm publishing using changesets
  - Triggers on push to main branch
  - Builds packages and publishes to npm registry

- Created `.github/workflows/sync-template.yml`:
  - Automates syncing `apps/template/` to separate repo via git subtree
  - Triggers on changes to template, schema, or template-components
  - Can also be triggered manually

### 5. NPM Publishing

- **Successfully published to npm**:
  - `portfolioly-schema@0.1.0` ✅
  - `portfolioly-template-components@0.1.0` ✅
- Packages are now publicly available on npm registry
- Can be installed with: `npm install portfolioly-schema portfolioly-template-components`

### 6. UI Components

- Created `apps/main/src/components/ui/dialog.tsx` for future Deploy to Vercel button
- Installed `@radix-ui/react-dialog` dependency

## ⏳ Pending (Manual Setup Required)

### 1. Template Repository Initial Sync

The `portfolioly-template` repository exists but needs initial population. Since `git subtree` is not available on this system, you need to do this manually once:

```bash
# Option A: Install git-subtree (if you have sudo access)
# Then run the sync workflow manually from GitHub Actions

# Option B: Manual sync (one-time)
cd /tmp
git clone https://github.com/yashrathi-git/portfolioly.git
cd portfolioly
git subtree split --prefix apps/template -b template-deploy
git push https://github.com/yashrathi-git/portfolioly-template.git template-deploy:main --force
```

### 2. GitHub Secrets Configuration

Add these secrets to your main repository for the workflows to function:

1. **NPM_TOKEN**: Your npm authentication token

   - Go to npmjs.com → Access Tokens → Generate New Token
   - Add to GitHub: Settings → Secrets → Actions → New repository secret

2. **TEMPLATE_REPO_TOKEN**: GitHub Personal Access Token with `repo` scope
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate token with `repo` scope
   - Add to GitHub: Settings → Secrets → Actions → New repository secret

### 3. Deploy to Vercel Button (Optional - Can be added later)

The `DeployToVercelButton` component has been updated but is not yet integrated into the editor. To enable it:

1. Update `apps/main/src/components/edit/EditorTopBar.tsx` to pass `username` and `publicToken` props
2. Test the deploy flow
3. Ensure the template repo is properly synced first

## 📋 Template Repository Structure

Once synced, the `portfolioly-template` repo will contain:

```
portfolioly-template/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── lib/
│       └── env.ts
├── public/
├── package.json              # Uses portfolioly-* packages from npm
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.example
└── README.md
```

## 🔄 Development Workflow

### For Package Updates:

```bash
# 1. Make changes to packages/schema or packages/template-components
# 2. Create a changeset
yarn changeset

# 3. Commit and push
git add .
git commit -m "feat: your changes"
git push

# 4. CI will create a "Version Packages" PR
# 5. Merge the PR to publish new versions to npm
```

### For Template Updates:

```bash
# 1. Make changes to apps/template/
# 2. Commit and push
git add apps/template
git commit -m "feat: template changes"
git push

# 3. CI will automatically sync to portfolioly-template repo
```

## 🎯 Next Steps

1. **Complete template repo sync** (see Pending section above)
2. **Add GitHub secrets** for automated workflows
3. **Test the template repo** by cloning it and running:
   ```bash
   git clone https://github.com/yashrathi-git/portfolioly-template.git
   cd portfolioly-template
   yarn install
   yarn dev
   ```
4. **Optional**: Integrate Deploy to Vercel button when ready

## 📦 Published Packages

- **portfolioly-schema**: https://www.npmjs.com/package/portfolioly-schema
- **portfolioly-template-components**: https://www.npmjs.com/package/portfolioly-template-components

## ✨ Benefits Achieved

- ✅ Packages published to npm (standard distribution)
- ✅ Template repo will be minimal and standalone
- ✅ Users won't clone your main repo (no attribution issues)
- ✅ Automated publishing via changesets
- ✅ Automated template syncing via GitHub Actions
- ✅ Follows industry best practices
- ✅ Minimal ongoing maintenance required
