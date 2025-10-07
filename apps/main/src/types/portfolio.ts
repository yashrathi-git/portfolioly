/**
 * Portfolio data schema types for AI-extracted user information.
 *
 * This module defines TypeScript interfaces that mirror the Pydantic models
 * from backend/app/schemas/portfolio.py. All fields are optional to handle
 * incomplete or missing information from unstructured data sources.
 */

export enum ProfileType {
  LINKEDIN = "linkedin",
  GITHUB = "github",
  WEBSITE = "website",
  PORTFOLIO = "portfolio",
  YOUTUBE = "youtube",
  TWITTER = "twitter",
  SCHOLAR = "scholar",
  OTHER = "other",
}

export interface DateInfo {
  /** Month (1-12) */
  month?: number;
  /** 4-digit year */
  year?: number;
}

export interface Profile {
  type?: ProfileType;
  url?: string;
  label?: string;
}

export interface PersonalInfo {
  full_name?: string;
  headline?: string;
  summary?: string;
  email?: string;
  phone?: string;
  location?: string;
  profile_photo_url?: string;
  profiles?: Profile[];
}

export interface WorkExperience {
  organization?: string;
  title?: string;
  location?: string;
  start_date?: DateInfo;
  end_date?: DateInfo;
  is_current?: boolean;
  highlights?: string;
  technologies?: string[];
  more_context?: string;
}

export interface ProjectImage {
  url: string;
  caption?: string;
  order: number;
}

export interface Project {
  name?: string;
  highlights?: string;
  technologies?: string[];
  github?: string;
  live_link?: string;
  demo_video?: string;
  more_context?: string;
  images?: ProjectImage[];
}

export interface Education {
  institution?: string;
  degree?: string;
  branch?: string;
  start_date?: DateInfo;
  end_date?: DateInfo;
  is_current?: boolean;
  location?: string;
  grade?: string;
}

export interface Certification {
  name?: string;
  issuer?: string;
  link?: string;
}

export interface TextBlobs {
  achievements?: string;
  additional_context?: string;
}

export interface LayoutSettings {
  /** Available layout modes: chat-only, traditional-only, both */
  layout_mode?: string;
  /** Default layout when both are available: chat, traditional */
  default_layout?: string;
}

export interface PortfolioMetadata {
  /** Source type (e.g., resume_pdf, linkedin_pdf, github_only) */
  source_type?: string;
  /** ISO timestamp of when data was extracted */
  extracted_at?: string;
  notes?: string;
}

export interface PortfolioData {
  personal_info?: PersonalInfo;
  work_experiences?: WorkExperience[];
  projects?: Project[];
  education?: Education[];
  certifications?: Certification[];
  text_blobs?: TextBlobs;
  metadata?: PortfolioMetadata;
  layout_settings?: LayoutSettings;
}
