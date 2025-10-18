/**
 * Display format types for UI components.
 * These types represent flattened, string-based data optimized for rendering.
 */

import type { ProjectImage } from "../schemas/project";

/**
 * Social platform types supported by UI components.
 * Maps to various profile types with UI-specific naming.
 */
export type SocialType =
  | "github"
  | "linkedin"
  | "leetcode"
  | "mail"
  | "website"
  | "x"
  | "dribbble"
  | "behance"
  | "link";

/**
 * Social link for display in UI components.
 * Contains the platform type, URL, and optional label.
 */
export interface SocialLink {
  /** Platform type for icon rendering */
  type: SocialType;
  /** URL to the social profile */
  href: string;
  /** Optional display label */
  label?: string;
}

/**
 * Display format for portfolio profile information.
 * Flattened structure with formatted data ready for UI rendering.
 */
export interface DisplayPortfolioProfile {
  name?: string;
  headline?: string;
  location?: string;
  avatarUrl?: string;
  summary?: string;
  email?: string;
  socials?: SocialLink[];
}

/**
 * Display format for project information.
 * Includes formatted fields and extracted one-line description.
 */
export interface DisplayProject {
  name?: string;
  /** First line extracted from highlights for quick display */
  one_line_description?: string;
  /** Full markdown highlights */
  highlights?: string;
  technologies?: string[];
  github?: string;
  live_link?: string;
  demo_video?: string;
  more_context?: string;
  images?: ProjectImage[];
}

/**
 * Display format for education information.
 * Combines degree and branch fields, formats dates as strings.
 */
export interface DisplayEducation {
  school?: string;
  /** Combined degree and branch (e.g., "Bachelor of Science in Computer Science") */
  degree?: string;
  /** Formatted start date string (e.g., "Jan 2020") */
  start?: string;
  /** Formatted end date string or "Present" for current */
  end?: string;
  location?: string;
  grade?: string;
}

/**
 * Display format for work experience information.
 * Flattens organization to companyName, formats dates as strings.
 */
export interface DisplayWorkExperience {
  companyName?: string;
  role?: string;
  location?: string;
  /** Formatted start date string (e.g., "Jan 2020") */
  start?: string;
  /** Formatted end date string or "Present" for current */
  end?: string;
  /** Markdown string with work highlights */
  points?: string;
  technologies?: string[];
}

/**
 * Root display format for complete portfolio data.
 * Optimized for UI component consumption with all nested data flattened.
 */
export interface DisplayPortfolioData {
  profile?: DisplayPortfolioProfile;
  projects: DisplayProject[];
  education: DisplayEducation[];
  experience?: DisplayWorkExperience[];
  skills?: string[];
  achievements?: string[];
  certificates?: string[];
  layout_settings?: {
    layout_mode?: string;
    default_layout?: string;
  };
}
