"use client";
import { User } from "firebase/auth";

const HAS_PORTFOLIO_COOKIE = "has_portfolio";

/**
 * Sets a cookie indicating the user has visited the edit page (has a portfolio).
 * Called from the edit page on mount.
 */
export function setHasPortfolioCookie(): void {
  if (typeof document === "undefined") return;
  // Set cookie for 1 year
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${HAS_PORTFOLIO_COOKIE}=true; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
}

/**
 * Checks if the user has the portfolio cookie set.
 */
export function hasPortfolioCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${HAS_PORTFOLIO_COOKIE}=true`);
}

/**
 * Returns the canonical path to navigate to for an authenticated user.
 * - Unverified → "/auth/verify-email" (new users need verification first)
 * - Verified with portfolio cookie → "/dashboard"
 * - Verified without portfolio cookie → "/upload" (new users need onboarding)
 */
export function getPostAuthRedirectPath(
  user: User
): "/dashboard" | "/upload" | "/auth/verify-email" {
  if (!user.emailVerified) {
    return "/auth/verify-email";
  }
  return hasPortfolioCookie() ? "/dashboard" : "/upload";
}

/**
 * Helper to check if an authenticated user should be sent to verify email.
 */
export function shouldRedirectToVerifyEmail(user: User | null): boolean {
  return Boolean(user && !user.emailVerified);
}
