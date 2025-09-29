// Portfolio schema aligned with backend structure

export type ProfileType =
  | "linkedin"
  | "github"
  | "website"
  | "portfolio"
  | "youtube"
  | "twitter"
  | "scholar"
  | "other";

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

export type SocialLink = {
  type: SocialType;
  href: string;
  label?: string;
};

// Backend-aligned types
export type DateInfo = {
  month?: number; // 1-12
  year?: number; // 4-digit year
};

export type Profile = {
  type?: ProfileType;
  url?: string;
  label?: string;
  profile_photo_url?: string;
  tags?: string[];
  more_context?: string;
};

export type PersonalInfo = {
  full_name?: string;
  headline?: string;
  summary?: string;
  email?: string;
  phone?: string;
  location?: string;
  profiles?: Profile[];
};

export type WorkExperience = {
  organization?: string;
  title?: string;
  location?: string;
  start_date?: DateInfo;
  end_date?: DateInfo;
  is_current?: boolean;
  highlights?: string[];
  technologies?: string[];
  more_context?: string;
};

export type Project = {
  name?: string;
  role?: string;
  highlights?: string[];
  technologies?: string[];
  github?: string;
  live_link?: string;
  more_context?: string;
};

export type Education = {
  institution?: string;
  degree?: string;
  branch?: string;
  start_date?: DateInfo;
  end_date?: DateInfo;
  is_current?: boolean;
  location?: string;
  grade?: string;
};

export type Certification = {
  name?: string;
  link?: string;
};

export type TextBlobs = {
  achievements?: string;
  additional_context?: string;
};

export type PortfolioMetadata = {
  source_type?: string;
  extracted_at?: string;
  notes?: string;
};

// Main portfolio data structure (backend-aligned)
export type BackendPortfolioData = {
  personal_info?: PersonalInfo;
  work_experiences?: WorkExperience[];
  projects?: Project[];
  education?: Education[];
  certifications?: Certification[];
  text_blobs?: TextBlobs;
  metadata?: PortfolioMetadata;
};

// Legacy frontend types for backward compatibility
export type PortfolioProject = {
  name?: string;
  role?: string;
  one_line_description?: string;
  highlights?: string[];
  technologies?: string[];
  github?: string;
  live_link?: string;
};

export type EducationItem = {
  school?: string;
  degree?: string;
  start?: string;
  end?: string;
  location?: string;
};

export type ExperienceItem = {
  companyName?: string;
  role?: string;
  location?: string;
  start?: string;
  end?: string;
  points?: string[];
};

export type TemplatePortfolioProfile = {
  name?: string;
  headline?: string;
  location?: string;
  avatarUrl?: string;
  profile_photo_url?: string;
  summary?: string;
  email?: string;
  socials?: SocialLink[];
};

export type PortfolioData = {
  profile?: TemplatePortfolioProfile;
  projects: PortfolioProject[];
  education: EducationItem[];
  experience?: ExperienceItem[];
  skills?: string[];
  achievements?: string[];
  certificates?: string[];
};
