# Vercel One‑Click Deploy (See Central Guide)

This page has been consolidated. For the complete, up‑to‑date instructions (npm publish, dual‑mode dev, subtree sync, and Deploy Button), see:

- `documentation/template-repo-strategy.md`

Quick notes:

- The Deploy Button must point to the separate template repo (not the monorepo).
- Prefill environment variables using `env[NAME]` parameters (no `envDefaults`).
- A typical URL setup:

```ts
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
