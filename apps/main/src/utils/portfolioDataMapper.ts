/**
 * Utility to map main app's portfolio data to template component's expected format
 */

import type {
  PortfolioData as MainPortfolioData,
  DateInfo,
  Profile as MainProfile,
} from "@/types/portfolio";
import type {
  PortfolioData as TemplatePortfolioData,
  SocialLink,
  PortfolioProject,
  EducationItem,
  ExperienceItem,
} from "@portfolioly/template-components";

/**
 * Maps main app's profile type to template component's social type
 */
function mapProfileTypeToSocialType(profileType?: string): SocialLink["type"] {
  switch (profileType?.toLowerCase()) {
    case "github":
      return "github";
    case "linkedin":
      return "linkedin";
    case "website":
    case "portfolio":
      return "website";
    case "twitter":
      return "x";
    case "youtube":
    case "scholar":
    case "other":
    default:
      return "link";
  }
}

/**
 * Maps profiles to social links
 */
function mapProfilesToSocials(profiles: MainProfile[] = []): SocialLink[] {
  return profiles
    .filter((profile) => profile.url)
    .map((profile) => ({
      type: mapProfileTypeToSocialType(profile.type),
      href: profile.url!,
      label: profile.label || profile.type || "Link",
    }));
}

/**
 * Formats date info to string
 */
function formatDateInfo(dateInfo?: DateInfo): string {
  if (!dateInfo) return "";

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  if (dateInfo.year && dateInfo.month) {
    return `${monthNames[dateInfo.month - 1]} ${dateInfo.year}`;
  } else if (dateInfo.year) {
    return dateInfo.year.toString();
  }

  return "";
}

/**
 * Maps work experiences to experience items
 */
function mapWorkExperiences(
  workExperiences: MainPortfolioData["work_experiences"] = []
): ExperienceItem[] {
  return workExperiences.map((exp) => ({
    companyName: exp.organization,
    role: exp.title,
    location: exp.location,
    start: formatDateInfo(exp.start_date) || undefined,
    end: exp.is_current ? "Present" : formatDateInfo(exp.end_date) || undefined,
    // highlights is now a markdown string in the new schema
    points: exp.highlights || undefined,
  }));
}

/**
 * Maps projects to portfolio projects
 */
function mapProjects(
  projects: MainPortfolioData["projects"] = []
): PortfolioProject[] {
  // Helper to extract first line from markdown string
  const getFirstLine = (text?: string): string | undefined => {
    if (!text) return undefined;
    const lines = text.split("\n").filter((line) => line.trim());
    return lines[0]?.replace(/^[-*+]\s+/, "").trim() || undefined;
  };

  return projects.map((project) => ({
    name: project.name,
    role: undefined, // role field removed from new schema
    one_line_description: getFirstLine(project.highlights),
    // highlights is now a markdown string in the new schema
    highlights: project.highlights || undefined,
    technologies: project.technologies?.filter((technology) =>
      Boolean(technology?.trim())
    ),
    github: project.github,
    live_link: project.live_link,
    // New schema fields
    demo_video: project.demo_video,
    more_context: project.more_context,
    images: project.images, // ProjectImage[] with url, caption, order
  }));
}

/**
 * Maps education to education items
 */
function mapEducation(
  education: MainPortfolioData["education"] = []
): EducationItem[] {
  return education.map((edu) => {
    const degreeParts = [edu.degree, edu.branch]
      .map((part) => (part && part.trim()) || undefined)
      .filter(Boolean) as string[];

    return {
      school: edu.institution,
      degree: degreeParts.join(degreeParts.length > 1 ? " in " : ""),
      start: formatDateInfo(edu.start_date) || undefined,
      end: edu.is_current
        ? "Present"
        : formatDateInfo(edu.end_date) || undefined,
      location: edu.location,
      grade: edu.grade,
      logoUrl: edu.logo_url,
    };
  });
}

/**
 * Extracts skills from work experiences and projects
 */
function extractSkills(data: MainPortfolioData): string[] {
  const skills = new Set<string>();

  // Add technologies from work experiences
  data.work_experiences?.forEach((exp) => {
    exp.technologies?.forEach((tech) => skills.add(tech));
  });

  // Add technologies from projects
  data.projects?.forEach((project) => {
    project.technologies?.forEach((tech) => skills.add(tech));
  });

  return Array.from(skills);
}

/**
 * Main transformation function: maps main app's portfolio data to template component format
 */
export function mapPortfolioDataToTemplate(
  data: MainPortfolioData
): TemplatePortfolioData {
  const personalInfo = data.personal_info || {};

  return {
    profile: {
      name: personalInfo.full_name,
      headline: personalInfo.headline,
      location: personalInfo.location,
      email: personalInfo.email,
      summary: personalInfo.summary,
      // Use profile_photo_url from personal_info
      avatarUrl: personalInfo.profile_photo_url,
      socials: mapProfilesToSocials(personalInfo.profiles),
    },
    projects: mapProjects(data.projects),
    education: mapEducation(data.education),
    experience: mapWorkExperiences(data.work_experiences),
    skills: extractSkills(data),
    // achievements is now a markdown string in the new schema
    achievements: data.text_blobs?.achievements
      ? [data.text_blobs.achievements].filter((item) => Boolean(item?.trim()))
      : [],
    // certifications now include issuer field
    certificates: (data.certifications || [])
      .map((cert) => {
        const parts = [cert.name, cert.issuer].filter(Boolean);
        return parts.length > 0 ? parts.join(" - ") : "";
      })
      .filter((name) => Boolean(name.trim())),
  };
}
