/**
 * ResumeTransformer - Transforms extracted data into ResumeData format.
 *
 * Converts LinkedIn extracted data, GitHub repos, and existing PortfolioData
 * into the ResumeData schema optimized for resume formatting.
 *
 * @module resumeTransformer
 */

import type {
  ResumeData,
  ResumePersonalInfo,
  ResumeWorkExperience,
  ResumeEducation,
  ResumeProject,
  ResumeSkills,
  ResumeCertification,
  SkillCategory,
  DateInfo,
} from "@/types/resume";
import { DEFAULT_SECTION_ORDER } from "@/types/resume";
import type { PortfolioData } from "portfolioly-schema";

/**
 * GitHub repository data structure from the backend API.
 */
export interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  stars: number;
  url: string;
  language: string | null;
  fork: boolean;
  private: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Generates a unique ID for resume entries.
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 9)}`;
}

/**
 * Converts a DateInfo from PortfolioData format to ResumeData format.
 * Both formats are compatible, but this ensures proper typing.
 */
function convertDateInfo(
  date: { month?: number | null; year?: number | null } | null | undefined
): DateInfo {
  return {
    month: date?.month ?? null,
    year: date?.year ?? null,
  };
}

/**
 * Parses markdown-formatted highlights into an array of bullet points.
 * Handles both markdown bullet points and plain text lines.
 */
function parseHighlights(highlights: string | null | undefined): string[] {
  if (!highlights) return [];

  return highlights
    .split("\n")
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter((line) => line.length > 0);
}

/**
 * Extracts profile URL by type from PortfolioData profiles array.
 */
function getProfileUrl(
  profiles:
    | Array<{ type?: string | null; url?: string | null }>
    | null
    | undefined,
  type: string
): string | null {
  if (!profiles) return null;
  const profile = profiles.find(
    (p) => p.type?.toLowerCase() === type.toLowerCase()
  );
  return profile?.url ?? null;
}

/**
 * Categorizes skills/tags into predefined categories.
 * Uses heuristics to group skills into Languages, Frameworks, Tools, and Other.
 */
function categorizeSkills(tags: string[] | null | undefined): ResumeSkills {
  if (!tags || tags.length === 0) {
    return { categories: [] };
  }

  // Common programming languages
  const languageKeywords = new Set([
    "python",
    "javascript",
    "typescript",
    "java",
    "c++",
    "c#",
    "c",
    "go",
    "rust",
    "ruby",
    "php",
    "swift",
    "kotlin",
    "scala",
    "r",
    "matlab",
    "perl",
    "haskell",
    "elixir",
    "clojure",
    "dart",
    "lua",
    "sql",
    "html",
    "css",
    "sass",
    "less",
    "shell",
    "bash",
    "powershell",
    "objective-c",
    "assembly",
    "fortran",
    "cobol",
    "groovy",
    "julia",
  ]);

  // Common frameworks and libraries
  const frameworkKeywords = new Set([
    "react",
    "angular",
    "vue",
    "svelte",
    "next.js",
    "nextjs",
    "nuxt",
    "gatsby",
    "express",
    "fastapi",
    "django",
    "flask",
    "spring",
    "rails",
    "laravel",
    "asp.net",
    ".net",
    "node.js",
    "nodejs",
    "deno",
    "tensorflow",
    "pytorch",
    "keras",
    "scikit-learn",
    "pandas",
    "numpy",
    "jquery",
    "bootstrap",
    "tailwind",
    "material-ui",
    "chakra",
    "redux",
    "mobx",
    "graphql",
    "apollo",
    "prisma",
    "sequelize",
    "mongoose",
    "hibernate",
    "spring boot",
    "nest.js",
    "nestjs",
    "fastify",
    "koa",
    "hapi",
    "electron",
    "react native",
    "flutter",
    "ionic",
    "xamarin",
    "unity",
    "unreal",
  ]);

  // Common tools and platforms
  const toolKeywords = new Set([
    "git",
    "github",
    "gitlab",
    "bitbucket",
    "docker",
    "kubernetes",
    "k8s",
    "aws",
    "azure",
    "gcp",
    "google cloud",
    "firebase",
    "heroku",
    "vercel",
    "netlify",
    "jenkins",
    "travis",
    "circleci",
    "github actions",
    "terraform",
    "ansible",
    "puppet",
    "chef",
    "vagrant",
    "nginx",
    "apache",
    "redis",
    "mongodb",
    "postgresql",
    "mysql",
    "sqlite",
    "elasticsearch",
    "kafka",
    "rabbitmq",
    "graphql",
    "rest",
    "grpc",
    "webpack",
    "vite",
    "babel",
    "eslint",
    "prettier",
    "jest",
    "mocha",
    "cypress",
    "selenium",
    "postman",
    "swagger",
    "jira",
    "confluence",
    "slack",
    "figma",
    "sketch",
    "adobe xd",
    "linux",
    "unix",
    "windows",
    "macos",
    "vim",
    "vscode",
    "intellij",
  ]);

  const languages: string[] = [];
  const frameworks: string[] = [];
  const tools: string[] = [];
  const other: string[] = [];

  for (const tag of tags) {
    const lowerTag = tag.toLowerCase();

    if (languageKeywords.has(lowerTag)) {
      languages.push(tag);
    } else if (frameworkKeywords.has(lowerTag)) {
      frameworks.push(tag);
    } else if (toolKeywords.has(lowerTag)) {
      tools.push(tag);
    } else {
      other.push(tag);
    }
  }

  const categories: SkillCategory[] = [];

  if (languages.length > 0) {
    categories.push({ name: "Languages", items: languages });
  }
  if (frameworks.length > 0) {
    categories.push({ name: "Frameworks", items: frameworks });
  }
  if (tools.length > 0) {
    categories.push({ name: "Tools", items: tools });
  }
  if (other.length > 0) {
    categories.push({ name: "Other", items: other });
  }

  return { categories };
}

/**
 * ResumeTransformer provides methods to convert various data sources
 * into the ResumeData format optimized for resume generation.
 */
export const ResumeTransformer = {
  /**
   * Converts LinkedIn extracted data (PortfolioData) to ResumeData format.
   *
   * LinkedIn data is extracted by the backend and returned as PortfolioData.
   * This method transforms it into the ResumeData schema with array-based
   * highlights and categorized skills.
   *
   * @param linkedInData - Portfolio data extracted from LinkedIn PDF
   * @param options - Optional configuration
   * @returns Complete ResumeData object
   *
   * Requirements: 1.1, 1.2
   */
  fromLinkedIn(
    linkedInData: PortfolioData,
    options: {
      resumeName?: string;
      templateId?: string;
    } = {}
  ): ResumeData {
    const now = new Date().toISOString();
    const personalInfo = linkedInData.personal_info;

    // Transform personal info
    const resumePersonalInfo: ResumePersonalInfo = {
      full_name: personalInfo?.full_name ?? "Unnamed",
      email: personalInfo?.email ?? null,
      phone: personalInfo?.phone ?? null,
      location: personalInfo?.location ?? null,
      linkedin_url: getProfileUrl(personalInfo?.profiles, "linkedin"),
      github_url: getProfileUrl(personalInfo?.profiles, "github"),
      website_url: getProfileUrl(personalInfo?.profiles, "website"),
    };

    // Transform work experiences
    const workExperiences: ResumeWorkExperience[] = (
      linkedInData.work_experiences ?? []
    ).map((exp) => ({
      id: generateId("exp"),
      company: exp.organization ?? "Unknown Company",
      title: exp.title ?? "Unknown Title",
      location: exp.location ?? null,
      start_date: convertDateInfo(exp.start_date),
      end_date: convertDateInfo(exp.end_date),
      is_current: exp.is_current ?? false,
      highlights: parseHighlights(exp.highlights),
    }));

    // Transform education
    const education: ResumeEducation[] = (linkedInData.education ?? []).map(
      (edu) => ({
        id: generateId("edu"),
        institution: edu.institution ?? "Unknown Institution",
        degree: edu.degree ?? "Unknown Degree",
        field: edu.branch ?? null,
        location: edu.location ?? null,
        start_date: convertDateInfo(edu.start_date),
        end_date: convertDateInfo(edu.end_date),
        gpa: edu.grade ?? null,
        highlights: [],
      })
    );

    // Transform projects (if any from LinkedIn)
    const projects: ResumeProject[] = (linkedInData.projects ?? []).map(
      (proj) => ({
        id: generateId("proj"),
        name: proj.name ?? "Unnamed Project",
        description: proj.highlights ?? null,
        technologies: proj.technologies ?? [],
        url: proj.live_link ?? proj.github ?? null,
        highlights: parseHighlights(proj.more_context),
      })
    );

    // Transform certifications
    const certifications: ResumeCertification[] = (
      linkedInData.certifications ?? []
    ).map((cert) => ({
      id: generateId("cert"),
      name: cert.name ?? "Unknown Certification",
      issuer: cert.issuer ?? null,
      date: null, // LinkedIn certifications don't have dates in our schema
    }));

    // Categorize skills from tags
    const skills = categorizeSkills(personalInfo?.tags);

    // Build summary from headline and summary
    let summary: string | null = null;
    if (personalInfo?.summary) {
      summary = personalInfo.summary;
    } else if (personalInfo?.headline) {
      summary = personalInfo.headline;
    }

    return {
      id: generateId("resume"),
      name: options.resumeName ?? `${resumePersonalInfo.full_name}'s Resume`,
      template_id: options.templateId ?? "classic",
      section_order: [...DEFAULT_SECTION_ORDER],
      personal_info: resumePersonalInfo,
      summary,
      work_experiences: workExperiences,
      education,
      projects,
      skills,
      certifications,
      created_at: now,
      updated_at: now,
    };
  },

  /**
   * Converts GitHub repositories to partial ResumeData (projects only).
   *
   * This method creates a partial ResumeData containing only the projects
   * section populated from GitHub repositories. Useful for adding GitHub
   * projects to an existing resume.
   *
   * @param repos - Array of GitHub repositories
   * @returns Partial ResumeData with projects section populated
   *
   * Requirements: 2.3
   */
  fromGitHub(repos: GitHubRepo[]): Partial<ResumeData> {
    const projects: ResumeProject[] = repos.map((repo) => {
      // Build highlights from repo metadata
      const highlights: string[] = [];
      if (repo.stars > 0) {
        highlights.push(`⭐ ${repo.stars} stars on GitHub`);
      }
      if (repo.language) {
        highlights.push(`Built with ${repo.language}`);
      }

      return {
        id: generateId("proj"),
        name: repo.name,
        description: repo.description,
        technologies: repo.language ? [repo.language] : [],
        url: repo.url,
        highlights,
      };
    });

    return {
      projects,
    };
  },

  /**
   * Converts existing PortfolioData to ResumeData format.
   *
   * This method transforms a complete PortfolioData object (from an existing
   * portfolio) into ResumeData format. Useful when users want to create a
   * resume from their existing portfolio.
   *
   * @param portfolio - Existing portfolio data
   * @param options - Optional configuration
   * @returns Complete ResumeData object
   *
   * Requirements: 1.4
   */
  fromPortfolio(
    portfolio: PortfolioData,
    options: {
      resumeName?: string;
      templateId?: string;
    } = {}
  ): ResumeData {
    // fromPortfolio uses the same transformation logic as fromLinkedIn
    // since both work with PortfolioData format
    return ResumeTransformer.fromLinkedIn(portfolio, options);
  },

  /**
   * Merges GitHub repositories into an existing resume's projects section.
   *
   * This method adds GitHub repositories as projects to an existing resume,
   * preserving all other resume data. GitHub projects are appended to
   * existing projects.
   *
   * @param resume - Existing ResumeData to merge into
   * @param repos - GitHub repositories to add as projects
   * @returns Updated ResumeData with merged projects
   *
   * Requirements: 2.3
   */
  mergeGitHubProjects(resume: ResumeData, repos: GitHubRepo[]): ResumeData {
    const githubProjects = ResumeTransformer.fromGitHub(repos).projects ?? [];

    return {
      ...resume,
      projects: [...resume.projects, ...githubProjects],
      updated_at: new Date().toISOString(),
    };
  },
};

export default ResumeTransformer;
