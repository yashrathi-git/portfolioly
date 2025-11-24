"use client";
import { User } from "firebase/auth";

/**
 * Returns the canonical path to navigate to for an authenticated user.
 * - Unverified → "/auth/verify-email" (new users need verification first)
 * - Verified → "/dashboard" (existing users who are logging in)
 *
 * Note: Users coming from verification screen are redirected to /upload
 * since they're new users completing onboarding.
 */
export function getPostAuthRedirectPath(
  user: User
): "/dashboard" | "/auth/verify-email" {
  return user.emailVerified ? "/dashboard" : "/auth/verify-email";
}

/**
 * Helper to check if an authenticated user should be sent to verify email.
 */
export function shouldRedirectToVerifyEmail(user: User | null): boolean {
  return Boolean(user && !user.emailVerified);
}
