// Portfolio schema and example data used across Chat and Traditional portfolios

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
  // New optional direct profile photo url
  profile_url?: string;
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
