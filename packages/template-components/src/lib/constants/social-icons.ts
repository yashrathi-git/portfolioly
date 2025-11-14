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
 * Maps SocialType to display labels.
 * Derives from PROFILE_TYPE_LABELS for consistency, with special handling for UI-specific types.
 */
export function getSocialLabel(type: SocialType): string {
  // Handle UI-specific types that don't exist in ProfileType
  if (type === "mail") return "Email";
  if (type === "link") return "Link";
  if (type === "x") return PROFILE_TYPE_LABELS.twitter; // twitter → x mapping

  // For all other types, use the label from schema
  return PROFILE_TYPE_LABELS[type as keyof typeof PROFILE_TYPE_LABELS] || type;
}
