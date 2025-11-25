import { getFirebaseApp } from "./firebase";
import { env } from "./env";
import type { Analytics } from "firebase/analytics";

let analyticsInstance: Analytics | null = null;
let initPromise: Promise<Analytics | null> | null = null;

/**
 * Lazily initialize Firebase Analytics (client-side only)
 */
export async function getAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (analyticsInstance) return analyticsInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (!env.FIREBASE_MEASUREMENT_ID) {
        if (env.IS_DEVELOPMENT) {
          console.warn("[Analytics] No measurement ID configured");
        }
        return null;
      }

      const { getAnalytics: fbGetAnalytics, isSupported } = await import(
        "firebase/analytics"
      );

      const supported = await isSupported();
      if (!supported) {
        if (env.IS_DEVELOPMENT) {
          console.warn("[Analytics] Not supported in this environment");
        }
        return null;
      }

      const app = getFirebaseApp();
      analyticsInstance = fbGetAnalytics(app);

      if (env.IS_DEVELOPMENT) {
        console.log("[Analytics] Initialized successfully");
      }

      return analyticsInstance;
    } catch (error) {
      console.error("[Analytics] Failed to initialize:", error);
      return null;
    }
  })();

  return initPromise;
}

// Event parameter types
type AuthMethod = "email" | "google";
type UploadType = "pdf" | "github";

/**
 * Track authentication events
 */
export async function trackSignUp(method: AuthMethod) {
  const analytics = await getAnalytics();
  if (!analytics) return;

  const { logEvent, setUserProperties } = await import("firebase/analytics");
  logEvent(analytics, "sign_up", { method });
  setUserProperties(analytics, { signup_method: method });

  if (env.IS_DEVELOPMENT) {
    console.log("[Analytics] sign_up", { method });
  }
}

export async function trackLogin(method: AuthMethod) {
  const analytics = await getAnalytics();
  if (!analytics) return;

  const { logEvent } = await import("firebase/analytics");
  logEvent(analytics, "login", { method });

  if (env.IS_DEVELOPMENT) {
    console.log("[Analytics] login", { method });
  }
}

export async function trackLogout() {
  const analytics = await getAnalytics();
  if (!analytics) return;

  const { logEvent } = await import("firebase/analytics");
  logEvent(analytics, "logout" as string);

  if (env.IS_DEVELOPMENT) {
    console.log("[Analytics] logout");
  }
}

export async function trackVerificationEmailSent() {
  const analytics = await getAnalytics();
  if (!analytics) return;

  const { logEvent } = await import("firebase/analytics");
  logEvent(analytics, "verification_email_sent" as string);

  if (env.IS_DEVELOPMENT) {
    console.log("[Analytics] verification_email_sent");
  }
}

/**
 * Track page views
 */
export async function trackPageView(pagePath: string, pageTitle?: string) {
  const analytics = await getAnalytics();
  if (!analytics) return;

  const { logEvent } = await import("firebase/analytics");
  logEvent(analytics, "page_view", {
    page_path: pagePath,
    page_title: pageTitle || document.title,
  });

  if (env.IS_DEVELOPMENT) {
    console.log("[Analytics] page_view", { pagePath, pageTitle });
  }
}

/**
 * Track upload events
 */
export async function trackUploadStarted(type: UploadType) {
  const analytics = await getAnalytics();
  if (!analytics) return;

  const { logEvent } = await import("firebase/analytics");
  logEvent(analytics, "upload_started" as string, { type });

  if (env.IS_DEVELOPMENT) {
    console.log("[Analytics] upload_started", { type });
  }
}

export async function trackUploadCompleted(type: UploadType) {
  const analytics = await getAnalytics();
  if (!analytics) return;

  const { logEvent } = await import("firebase/analytics");
  logEvent(analytics, "upload_completed" as string, { type });

  if (env.IS_DEVELOPMENT) {
    console.log("[Analytics] upload_completed", { type });
  }
}

/**
 * Track portfolio events
 */
export async function trackPortfolioSaved() {
  const analytics = await getAnalytics();
  if (!analytics) return;

  const { logEvent } = await import("firebase/analytics");
  logEvent(analytics, "portfolio_saved" as string);

  if (env.IS_DEVELOPMENT) {
    console.log("[Analytics] portfolio_saved");
  }
}

export async function trackPortfolioPublished() {
  const analytics = await getAnalytics();
  if (!analytics) return;

  const { logEvent } = await import("firebase/analytics");
  logEvent(analytics, "portfolio_published" as string);

  if (env.IS_DEVELOPMENT) {
    console.log("[Analytics] portfolio_published");
  }
}

export async function trackLayoutChanged(layout: string) {
  const analytics = await getAnalytics();
  if (!analytics) return;

  const { logEvent } = await import("firebase/analytics");
  logEvent(analytics, "layout_changed" as string, { layout });

  if (env.IS_DEVELOPMENT) {
    console.log("[Analytics] layout_changed", { layout });
  }
}

/**
 * Set user ID for analytics
 */
export async function setAnalyticsUserId(userId: string | null) {
  const analytics = await getAnalytics();
  if (!analytics) return;

  const { setUserId } = await import("firebase/analytics");
  setUserId(analytics, userId);

  if (env.IS_DEVELOPMENT) {
    console.log("[Analytics] setUserId", userId ? "[set]" : "[cleared]");
  }
}
