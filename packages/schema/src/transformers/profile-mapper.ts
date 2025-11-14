/**
 * Profile to social link mapping utilities.
 * Converts backend Profile types to UI-friendly SocialLink format.
 */

import type { Profile, ProfileType } from "../schemas/core";
import type { SocialLink, SocialType } from "../types/display";

/**
 * Maps backend ProfileType to UI SocialType.
 * Handles platform-specific naming differences between backend and UI.
 */
export const PROFILE_TO_SOCIAL_MAP: Record<ProfileType, SocialType> = {
  linkedin: "linkedin",
  github: "github",
  website: "website",
  portfolio: "website",
  twitter: "x",
  instagram: "instagram",
  codeforces: "codeforces",
  codechef: "codechef",
  leetcode: "leetcode",
  figma: "figma",
  stackoverflow: "stackoverflow",
  devto: "devto",
  medium: "medium",
  producthunt: "producthunt",
  atcoder: "atcoder",
  youtube: "youtube",
  scholar: "scholar",
  dribbble: "dribbble",
  behance: "behance",
  other: "link",
};

/**
 * Converts an array of Profile objects to SocialLink objects for UI display.
 * Filters out profiles without URLs and maps profile types to social types.
 *
 * @param profiles - Array of profile objects from backend
 * @returns Array of social links ready for UI rendering
 *
 * @example
 * ```typescript
 * const profiles = [
 *   { type: "github", url: "https://github.com/user", label: "GitHub" },
 *   { type: "linkedin", url: "https://linkedin.com/in/user" },
 *   { type: "twitter", url: "" } // Will be filtered out
 * ];
 * const socials = mapProfilesToSocials(profiles);
 * // [
 * //   { type: "github", href: "https://github.com/user", label: "GitHub" },
 * //   { type: "linkedin", href: "https://linkedin.com/in/user", label: "linkedin" }
 * // ]
 * ```
 */
export function mapProfilesToSocials(
  profiles?: Profile[] | null
): SocialLink[] {
  if (!profiles || !Array.isArray(profiles)) {
    return [];
  }

  return profiles
    .filter((profile) => profile.url && profile.type)
    .map((profile) => ({
      type: PROFILE_TO_SOCIAL_MAP[profile.type!] || "link",
      href: profile.url!,
      label: profile.label || profile.type || "Link",
    }));
}
