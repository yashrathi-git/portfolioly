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
  tags?: string[];
  more_context?: string;
}

export interface PersonalInfo {
  full_name?: string;
  headline?: string;
  summary?: string;
  email?: string;
  phone?: string;
  location?: string;
  profiles?: Profile[];
}

export interface WorkExperience {
  organization?: string;
  title?: string;
  location?: string;
  start_date?: DateInfo;
  end_date?: DateInfo;
  is_current?: boolean;
  highlights?: string[];
  technologies?: string[];
  more_context?: string;
}

export interface Project {
  name?: string;
  role?: string;
  highlights?: string[];
  technologies?: string[];
  github?: string;
  live_link?: string;
  more_context?: string;
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
  link?: string;
}

export interface TextBlobs {
  achievements?: string;
  additional_context?: string;
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
}

// Example data for development and testing
export const examplePortfolioData: PortfolioData = {
  personal_info: {
    full_name: "John Doe",
    headline: "Senior Software Engineer",
    summary: "Experienced developer with 5+ years in web development",
    email: "john.doe@example.com",
    location: "San Francisco, CA",
    profiles: [
      {
        type: ProfileType.LINKEDIN,
        url: "https://linkedin.com/in/johndoe",
        label: "LinkedIn Profile",
      },
    ],
  },
  work_experiences: [
    {
      organization: "Tech Corp",
      title: "Senior Software Engineer",
      location: "San Francisco, CA",
      start_date: { month: 1, year: 2020 },
      end_date: { month: 12, year: 2023 },
      is_current: false,
      highlights: ["Led team of 5 developers", "Increased performance by 40%"],
      technologies: ["Python", "React", "PostgreSQL"],
    },
  ],
  projects: [
    {
      name: "Portfolio Website",
      role: "Full Stack Developer",
      highlights: ["Built responsive design", "Implemented CI/CD"],
      technologies: ["Next.js", "TypeScript", "Tailwind CSS"],
      github: "https://github.com/johndoe/portfolio",
      live_link: "https://johndoe.dev",
    },
  ],
  education: [
    {
      institution: "University of California",
      degree: "Bachelor of Science",
      branch: "Computer Science",
      start_date: { month: 9, year: 2016 },
      end_date: { month: 6, year: 2020 },
      location: "Berkeley, CA",
      grade: "3.8 GPA",
    },
  ],
  metadata: {
    source_type: "resume_pdf",
    extracted_at: "2024-01-15T10:30:00Z",
    notes: "Extracted from resume PDF with high confidence",
  },
};
