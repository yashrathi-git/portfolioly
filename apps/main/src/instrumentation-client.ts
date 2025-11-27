// instrumentation-client.ts
import posthog from "posthog-js";

if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  console.warn("PostHog: missing NEXT_PUBLIC_POSTHOG_KEY");
}

if (!process.env.NEXT_PUBLIC_POSTHOG_HOST) {
  console.warn("PostHog: missing NEXT_PUBLIC_POSTHOG_HOST");
}

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  // PostHog docs recommend this to get the new default behavior
  defaults: "2025-05-24",
  // Helpful while debugging:
  debug: process.env.NODE_ENV === "development",
});
