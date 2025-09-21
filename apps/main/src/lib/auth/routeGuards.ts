"use client";
import { User } from "firebase/auth";

/**
 * Returns the canonical path to navigate to for an authenticated user.
 * - Verified → "/upload" (onboarding flow)
 * - Unverified → "/auth/verify-email"
 */
export function getPostAuthRedirectPath(
  user: User
): "/upload" | "/auth/verify-email" {
  return user.emailVerified ? "/upload" : "/auth/verify-email";
}

/**
 * Helper to check if an authenticated user should be sent to verify email.
 */
export function shouldRedirectToVerifyEmail(user: User | null): boolean {
  return Boolean(user && !user.emailVerified);
}
