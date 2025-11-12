# Vercel One-Click Deploy Implementation

## Overview

Enable users to deploy their portfolio template (`apps/template/`) to their own Vercel instance using their public token for data access and chat functionality.

## Architecture

```
Main App → User clicks Deploy → Vercel clones template → Template fetches data via public token
```

**What deploys**: `apps/template/` only (not the entire monorepo)  
**Data source**: Centralized backend API via public token  
**Authentication**: Read-only public token (safe for client-side)

## Implementation

### 1. Configure Template App for Deployment

**Create `apps/template/vercel.json`:**

```json
{
  "buildCommand": "cd ../.. && corepack yarn workspace @portfolioly/schema build && corepack yarn workspace @portfolioly/template-components build && corepack yarn workspace template build",
  "installCommand": "cd ../.. && corepack enable && corepack yarn install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

**Critical**:

- Use `corepack yarn` (not just `yarn`) to ensure Vercel uses Yarn 4
- Build packages in dependency order: schema → template-components → template

**How monorepo dependencies work:**

- Vercel clones the **entire repository** (including `packages/`)
- `root-directory: apps/template` tells Vercel where the app is
- `corepack enable` tells Vercel to use Yarn 4 (from `packageManager` field)
- `installCommand` goes to root (`cd ../..`) and runs `corepack yarn install`
- Yarn workspaces installs ALL packages (`@portfolioly/schema`, `@portfolioly/template-components`)
- Build command builds in dependency order:
  1. `@portfolioly/schema` (base types) → `dist/`
  2. `@portfolioly/template-components` (React components) → `dist/`
  3. `template` (Next.js app) → `.next/`
- Template imports built packages from `packages/*/dist/` via workspace protocol

**Why `corepack yarn`?**

- Your project uses Yarn 4 with `workspace:*` protocol
- Vercel defaults to Yarn 1 which doesn't understand `workspace:*`
- `corepack enable` activates corepack
- `corepack yarn` reads `packageManager: "yarn@4.9.4"` from root `package.json` and uses the correct version

**Create `apps/template/.env.example`:**

```bash
NEXT_PUBLIC_USERNAME=your-username
NEXT_PUBLIC_PSK_TOKEN=your-public-token
NEXT_PUBLIC_API_BASE_URL=https://api.portfolioly.com
```

**Update `apps/template/src/lib/env.ts`:**

```typescript
export function getAPIBaseURL(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.portfolioly.com";
}
```

### 2. Create Deploy Button Component

**Create `apps/main/src/components/edit/DeployButton.tsx`:**

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DeployButtonProps {
  username?: string;
  publicToken?: string;
}

export function DeployButton({ username, publicToken }: DeployButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const githubRepoUrl = "https://github.com/YOUR_USERNAME/portfolioly";
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.portfolioly.com";

  // Generate Vercel deploy URL
  const deployUrl = new URL("https://vercel.com/new/clone");
  deployUrl.searchParams.set("repository-url", githubRepoUrl);
  deployUrl.searchParams.set("project-name", `${username || "my"}-portfolio`);
  deployUrl.searchParams.set(
    "repository-name",
    `${username || "my"}-portfolio`
  );
  deployUrl.searchParams.set("root-directory", "apps/template");
  deployUrl.searchParams.set(
    "env",
    "NEXT_PUBLIC_USERNAME,NEXT_PUBLIC_PSK_TOKEN,NEXT_PUBLIC_API_BASE_URL"
  );

  // Pre-fill values
  if (username)
    deployUrl.searchParams.set("env-NEXT_PUBLIC_USERNAME", username);
  if (publicToken)
    deployUrl.searchParams.set("env-NEXT_PUBLIC_PSK_TOKEN", publicToken);
  deployUrl.searchParams.set("env-NEXT_PUBLIC_API_BASE_URL", apiBaseUrl);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isConfigured = Boolean(username && publicToken);

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ExternalLink className="h-4 w-4" />
          Deploy to Vercel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Deploy Your Portfolio to Vercel</DialogTitle>
          <DialogDescription>
            One-click deployment with pre-configured credentials
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isConfigured && (
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4 text-sm">
              <p className="font-medium text-yellow-900 dark:text-yellow-100">
                ⚠️ Set your username in Settings to enable deployment
              </p>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-medium">Deployment Credentials</h3>

            {/* Username */}
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Username</label>
              <div className="flex gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm">
                  {username || "Not set"}
                </code>
                {username && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(username, "username")}
                  >
                    {copiedField === "username" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Public Token */}
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                Public Token
              </label>
              <div className="flex gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                  {publicToken
                    ? `${publicToken.slice(0, 20)}...`
                    : "Not available"}
                </code>
                {publicToken && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(publicToken, "token")}
                  >
                    {copiedField === "token" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* API URL */}
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                API Base URL
              </label>
              <code className="block px-3 py-2 bg-muted rounded-md text-sm">
                {apiBaseUrl}
              </code>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">
              What happens:
            </p>
            <ul className="text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-disc mt-1">
              <li>Vercel clones template to your GitHub</li>
              <li>Credentials pre-filled as environment variables</li>
              <li>Portfolio deploys with live chat</li>
              <li>Updates reflect automatically</li>
            </ul>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => window.open(deployUrl.toString(), "_blank")}
              disabled={!isConfigured}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Deploy Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Add to Portfolio Preview

**Modify `apps/main/src/components/edit/PortfolioPreview.tsx`:**

```typescript
import { DeployButton } from "./DeployButton";

// Inside component, before preview container:
return (
  <div className="w-full space-y-4">
    {/* Deploy Button */}
    <div className="flex justify-end">
      <DeployButton username={username} publicToken={publicToken} />
    </div>

    {/* Existing preview container */}
    <div className="relative w-full...">{/* ... */}</div>
  </div>
);
```

## Deploy URL Structure

```
https://vercel.com/new/clone?
  repository-url=https://github.com/YOUR_USERNAME/portfolioly&
  project-name=username-portfolio&
  repository-name=username-portfolio&
  root-directory=apps/template&
  env=NEXT_PUBLIC_USERNAME,NEXT_PUBLIC_PSK_TOKEN,NEXT_PUBLIC_API_BASE_URL&
  env-NEXT_PUBLIC_USERNAME=johndoe&
  env-NEXT_PUBLIC_PSK_TOKEN=pk_abc123&
  env-NEXT_PUBLIC_API_BASE_URL=https://api.portfolioly.com
```

## User Flow

1. User edits portfolio in main app
2. Clicks "Deploy to Vercel" button
3. Dialog shows credentials (username, public token, API URL)
4. Clicks "Deploy Now" → opens Vercel in new tab
5. Vercel clones repo to user's GitHub (credentials pre-filled)
6. Build runs, portfolio deploys
7. Live at `username-portfolio.vercel.app`
8. Portfolio fetches data via public token
9. Chat works automatically

## Testing Checklist

- [ ] Template builds: `cd apps/template && yarn build`
- [ ] Deploy button appears in preview
- [ ] Button disabled without username/token
- [ ] Dialog shows correct credentials
- [ ] Copy buttons work
- [ ] Deploy URL has all parameters
- [ ] Vercel deployment succeeds
- [ ] Deployed portfolio loads data
- [ ] Chat functionality works

## Security

**Public Token**:

- ✅ Read-only access to public data
- ✅ Enables chat (public feature)
- ✅ Safe for client-side (`NEXT_PUBLIC_*`)
- ✅ Rate-limited by backend
- ✅ Can be regenerated

## Key Points

1. **Monorepo**: Vercel clones entire repo but only deploys `apps/template/`
   - Build commands run from root to access `packages/`
   - Yarn workspaces resolve `@portfolioly/*` dependencies
2. **Data**: Fetched dynamically from backend (no rebuild needed)
3. **Updates**: Portfolio changes reflect automatically
4. **Hosting**: User controls deployment, custom domain, etc.
5. **Token**: Public token for read-only access, safe to expose
6. **GitHub**: Repo must be public for deploy button to work

## Troubleshooting

| Issue                                              | Fix                                                       |
| -------------------------------------------------- | --------------------------------------------------------- |
| `workspace:*` not found on npm registry            | Use `corepack yarn` instead of `yarn` in commands         |
| Still using Yarn 1 after corepack enable           | Use `corepack yarn install` not just `yarn install`       |
| Module not found: Can't resolve '@portfolioly/...' | Build dependencies first (schema → template-components)   |
| Build fails                                        | Check `vercel.json` buildCommand uses `corepack yarn`     |
| Package not found                                  | Ensure `installCommand` runs from root                    |
| `@portfolioly/*` not found                         | Verify yarn workspaces configured & using `corepack yarn` |
| Portfolio doesn't load                             | Verify env vars are set correctly                         |
| Chat doesn't work                                  | Verify public token is valid                              |
| 404 errors                                         | Check API_BASE_URL                                        |

## Next Steps After Implementation

1. Update GitHub repo URL in `DeployButton.tsx`
2. Make repository public
3. Test full deployment flow
4. Add usage analytics (optional)
5. Create video tutorial (optional)

---

**Estimated Implementation Time**: 2-3 hours  
**Prerequisites**: Working public token system, deployed backend API
