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
  name: string;
  role?: string;
  one_line_description: string;
  highlights?: string[];
  technologies?: string[];
  github?: string;
  live_link?: string;
};

export type EducationItem = {
  school: string;
  degree: string;
  start: string;
  end: string;
  location?: string;
};

export type ExperienceItem = {
  companyName: string;
  role: string;
  location?: string;
  start: string;
  end: string;
  points: string[];
};

export type PortfolioProfile = {
  name: string;
  headline: string;
  location?: string;
  avatarUrl?: string;
  profile_photo_url?: string;
  socials: SocialLink[];
};

export type PortfolioData = {
  profile: PortfolioProfile;
  projects: PortfolioProject[];
  education: EducationItem[];
  experience?: ExperienceItem[];
  skills?: string[];
  achievements?: string[];
  certificates?: string[];
};

// Example data for quick demos and local rendering
export const examplePortfolioData: PortfolioData = {
  profile: {
    name: "Alex Chen",
    headline: "Frontend Engineer · Crafting calm, fast UIs",
    location: "San Francisco, CA",
    // profile_url intentionally omitted in demo to avoid broken images
    socials: [
      { type: "github", href: "#", label: "alexchen" },
      { type: "linkedin", href: "#", label: "alex-chen" },
      { type: "leetcode", href: "#", label: "alex_codes" },
      { type: "mail", href: "mailto:alex@example.com", label: "Email" },
      { type: "website", href: "#", label: "alexchen.dev" },
    ],
  },
  projects: [
    {
      name: "Aura",
      role: "Creator",
      one_line_description: "A minimalist AI notes app with semantic search.",
      highlights: [
        "Fast, offline-first editor with sync",
        "Semantic search and tagging",
        "Beautiful motion and keyboard-first UX",
      ],
      technologies: ["Next.js", "TypeScript", "Tailwind", "RSC"],
      github: "#",
      live_link: "#",
    },
    {
      name: "Kino",
      role: "Frontend",
      one_line_description: "Film discovery site with delightful transitions.",
      highlights: [
        "Cinematic transitions and micro-interactions",
        "Accessible by design",
      ],
      technologies: ["React", "Framer Motion", "TMDB API"],
      github: "#",
      live_link: "#",
    },
    {
      name: "Loomis",
      role: "Frontend",
      one_line_description: "Finance dashboard with realtime charts.",
      highlights: [
        "Realtime streaming charts",
        "Design system built with Shadcn/UI",
      ],
      technologies: ["Next.js", "TypeScript", "Tailwind", "Charts"],
      github: "#",
      live_link: "#",
    },
  ],
  education: [
    {
      school: "University of Somewhere",
      degree: "B.S. in Computer Science",
      start: "2015",
      end: "2019",
      location: "Somewhere, USA",
    },
  ],
  experience: [
    {
      companyName: "Acme Inc.",
      role: "Senior Frontend Engineer",
      location: "San Francisco, CA (Hybrid)",
      start: "Jan 2022",
      end: "Present",
      points: [
        "Led migration to Next.js App Router and RSC, improving TTI by 38%",
        "Built design system components with Shadcn/UI + Tailwind v4",
        "Partnered with Design to craft micro-interactions using Framer Motion",
      ],
    },
  ],
  skills: [
    "React",
    "Next.js (App Router)",
    "TypeScript",
    "Tailwind v4",
    "Shadcn/UI",
    "Framer Motion",
  ],
  achievements: ["Winner – Hackathon XYZ 2024", "Speaker – JSConf Mini on RSC"],
  certificates: [
    "AWS Certified Cloud Practitioner",
    "Google UX Design Certificate",
  ],
};
