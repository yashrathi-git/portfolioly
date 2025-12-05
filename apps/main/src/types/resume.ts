/**
 * Resume Data Types
 *
 * Type definitions for the Resume Builder feature.
 * These types are optimized for resume formatting with array-based highlights,
 * categorized skills, and section ordering.
 */

/**
 * Structured date information for resume entries.
 */
export interface DateInfo {
  /** Month (1-12) */
  month?: number | null;
  /** 4-digit year */
  year?: number | null;
}

/**
 * Profile links for various platforms.
 */
export interface ResumeProfiles {
  linkedin?: string | null;
  github?: string | null;
  leetcode?: string | null;
  codeforces?: string | null;
  codechef?: string | null;
  website?: string | null;
}

/**
 * Personal information section of the resume.
 */
export interface ResumePersonalInfo {
  full_name: string;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  profiles?: ResumeProfiles;
}

/**
 * Work experience entry with bullet point highlights.
 */
export interface ResumeWorkExperience {
  id: string;
  company: string;
  title: string;
  location?: string | null;
  start_date: DateInfo;
  end_date?: DateInfo | null;
  is_current: boolean;
  /** Array of bullet points for resume formatting (supports **bold** and *italic*) */
  highlights: string[];
}

/**
 * Education entry with optional GPA and highlights.
 */
export interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  field?: string | null;
  location?: string | null;
  start_date: DateInfo;
  end_date?: DateInfo | null;
  gpa?: string | null;
  /** Array of highlights (supports **bold** and *italic*) */
  highlights: string[];
}

/**
 * Project entry for resume.
 */
export interface ResumeProject {
  id: string;
  name: string;
  description?: string | null;
  technologies: string[];
  url?: string | null;
  /** Array of highlights (supports **bold** and *italic*) */
  highlights: string[];
}

/**
 * Skill category for grouped skills display.
 */
export interface SkillCategory {
  /** Category name (e.g., "Languages", "Frameworks", "Tools") */
  name: string;
  /** Skills in this category */
  items: string[];
}

/**
 * Skills section with categorized skill groups.
 */
export interface ResumeSkills {
  categories: SkillCategory[];
}

/**
 * Certification entry.
 */
export interface ResumeCertification {
  id: string;
  name: string;
  issuer?: string | null;
  date?: string | null;
}

/**
 * Section types for resume ordering.
 */
export type SectionType =
  | "summary"
  | "experience"
  | "education"
  | "projects"
  | "skills"
  | "certifications"
  | "achievements";

/**
 * Default section order for new resumes.
 */
export const DEFAULT_SECTION_ORDER: SectionType[] = [
  "summary",
  "experience",
  "education",
  "projects",
  "skills",
  "certifications",
  "achievements",
];

/**
 * Main ResumeData schema for storing and rendering resumes.
 */
export interface ResumeData {
  /** Unique identifier */
  id: string;
  /** User-defined name for this resume version */
  name: string;
  /** Selected template ID */
  template_id: string;
  /** Order of sections in the resume */
  section_order: SectionType[];

  /** Personal/contact information */
  personal_info: ResumePersonalInfo;
  /** Professional summary or objective */
  summary?: string | null;
  /** Work experience entries */
  work_experiences: ResumeWorkExperience[];
  /** Education entries */
  education: ResumeEducation[];
  /** Project entries */
  projects: ResumeProject[];
  /** Categorized skills */
  skills: ResumeSkills;
  /** Certifications */
  certifications: ResumeCertification[];
  /** Achievements (supports **bold** and *italic*) */
  achievements: string[];

  /** ISO timestamp of creation */
  created_at: string;
  /** ISO timestamp of last update */
  updated_at: string;
}

/**
 * Summary view of a resume for list displays.
 */
export interface ResumeSummary {
  id: string;
  name: string;
  template_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Request payload for creating a new resume.
 */
export interface CreateResumeRequest {
  name: string;
  template_id?: string;
  personal_info: ResumePersonalInfo;
  summary?: string | null;
  work_experiences?: ResumeWorkExperience[];
  education?: ResumeEducation[];
  projects?: ResumeProject[];
  skills?: ResumeSkills;
  certifications?: ResumeCertification[];
  achievements?: string[];
  section_order?: SectionType[];
}

/**
 * Request payload for updating an existing resume.
 */
export interface UpdateResumeRequest {
  name?: string;
  template_id?: string;
  section_order?: SectionType[];
  personal_info?: Partial<ResumePersonalInfo>;
  summary?: string | null;
  work_experiences?: ResumeWorkExperience[];
  education?: ResumeEducation[];
  projects?: ResumeProject[];
  skills?: ResumeSkills;
  certifications?: ResumeCertification[];
  achievements?: string[];
}
