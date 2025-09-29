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
    points: exp.highlights?.filter((highlight) => Boolean(highlight?.trim())),
  }));
}

/**
 * Maps projects to portfolio projects
 */
function mapProjects(
  projects: MainPortfolioData["projects"] = []
): PortfolioProject[] {
  return projects.map((project) => ({
    name: project.name,
    role: project.role,
    one_line_description: project.highlights?.find((highlight) =>
      Boolean(highlight?.trim())
    ),
    highlights: project.highlights?.filter((highlight) =>
      Boolean(highlight?.trim())
    ),
    technologies: project.technologies?.filter((technology) =>
      Boolean(technology?.trim())
    ),
    github: project.github,
    live_link: project.live_link,
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
      // Prefer explicit profile photo URLs if provided
      avatarUrl: personalInfo.profiles?.find(
        (profile) => profile.profile_photo_url
      )?.profile_photo_url,
      socials: mapProfilesToSocials(personalInfo.profiles),
    },
    projects: mapProjects(data.projects),
    education: mapEducation(data.education),
    experience: mapWorkExperiences(data.work_experiences),
    skills: extractSkills(data),
    achievements: data.text_blobs?.achievements
      ? [data.text_blobs.achievements].filter((item) => Boolean(item?.trim()))
      : [],
    certificates: (data.certifications || [])
      .map((cert) => cert.name || "")
      .filter((name) => Boolean(name.trim())),
  };
}
