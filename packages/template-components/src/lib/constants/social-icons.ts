/**
 * Social media icon components and labels.
 * Consolidates all icons (Simple Icons + Lucide) in one place.
 */

import {
  SiLeetcode,
  SiCodeforces,
  SiCodechef,
  SiFigma,
  SiStackoverflow,
  SiMedium,
  SiProducthunt,
  SiInstagram,
  SiYoutube,
  SiGooglescholar,
  SiGithub,
  SiX,
  SiDribbble,
  SiBehance,
  SiDevdotto,
} from "@icons-pack/react-simple-icons";
import { Mail, Globe, Link2, Code2, Linkedin } from "lucide-react";
import type { ComponentType } from "react";
import type { SocialType } from "portfolioly-schema";
import { PROFILE_TYPE_LABELS } from "portfolioly-schema";

export type IconComponent = ComponentType<{
  size?: number;
  className?: string;
}>;

/**
 * All social icon components in one place.
 * Mix of Simple Icons (for brands) and Lucide (for generic/missing icons).
 */
export const SOCIAL_ICON_COMPONENTS: Record<SocialType, IconComponent> = {
  // Simple Icons (brand icons)
  github: SiGithub,
  x: SiX,
  instagram: SiInstagram,
  youtube: SiYoutube,
  dribbble: SiDribbble,
  behance: SiBehance,
  leetcode: SiLeetcode,
  codeforces: SiCodeforces,
  codechef: SiCodechef,
  figma: SiFigma,
  stackoverflow: SiStackoverflow,
  devto: SiDevdotto,
  medium: SiMedium,
  producthunt: SiProducthunt,
  scholar: SiGooglescholar,

  // Lucide icons (generic or not available in Simple Icons)
  linkedin: Linkedin,
  atcoder: Code2,
  website: Globe,
  mail: Mail,
  link: Link2,
};

/**
 * Display labels for social platforms.
 * Derives from schema for consistency.
 */
export const SOCIAL_LABELS: Record<SocialType, string> = {
  github: PROFILE_TYPE_LABELS.github,
  linkedin: PROFILE_TYPE_LABELS.linkedin,
  x: PROFILE_TYPE_LABELS.twitter,
  instagram: PROFILE_TYPE_LABELS.instagram,
  youtube: PROFILE_TYPE_LABELS.youtube,
  dribbble: PROFILE_TYPE_LABELS.dribbble,
  behance: PROFILE_TYPE_LABELS.behance,
  leetcode: PROFILE_TYPE_LABELS.leetcode,
  codeforces: PROFILE_TYPE_LABELS.codeforces,
  codechef: PROFILE_TYPE_LABELS.codechef,
  atcoder: PROFILE_TYPE_LABELS.atcoder,
  figma: PROFILE_TYPE_LABELS.figma,
  stackoverflow: PROFILE_TYPE_LABELS.stackoverflow,
  devto: PROFILE_TYPE_LABELS.devto,
  medium: PROFILE_TYPE_LABELS.medium,
  producthunt: PROFILE_TYPE_LABELS.producthunt,
  scholar: PROFILE_TYPE_LABELS.scholar,
  website: PROFILE_TYPE_LABELS.website,
  mail: "Email",
  link: "Link",
};
