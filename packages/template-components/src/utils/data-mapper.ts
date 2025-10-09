/**
 * Data transformation utilities for mapping backend data to frontend format
 */

import {
  BackendPortfolioData,
  PortfolioData,
  Profile,
  SocialLink,
  DateInfo,
  WorkExperience,
  Project,
  Education,
} from "../types/portfolio";

/**
 * Maps backend Profile array to frontend SocialLink array
 */
export function mapProfilesToSocials(profiles: Profile[] = []): SocialLink[] {
  const socialTypeMap: Record<string, string> = {
    linkedin: "linkedin",
    github: "github",
    website: "website",
    portfolio: "website",
    twitter: "x",
    youtube: "link",
    scholar: "link",
    other: "link",
  };

  return profiles
    .filter((profile) => profile.url)
    .map((profile) => ({
      type: (socialTypeMap[profile.type || "other"] || "link") as any,
      href: profile.url!,
      label: profile.label || profile.type || "Link",
    }));
}

/**
 * Formats DateInfo to string representation
 */
export function formatDateInfo(dateInfo?: DateInfo): string {
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
 * Maps backend WorkExperience to frontend ExperienceItem
 */
export function mapWorkExperience(workExp: WorkExperience) {
  return {
    companyName: workExp.organization || "",
    role: workExp.title || "",
    location: workExp.location || "",
    start: formatDateInfo(workExp.start_date),
    end: workExp.is_current ? "Present" : formatDateInfo(workExp.end_date),
    // highlights is now a markdown string in the new schema
    points: workExp.highlights || "",
  };
}

/**
 * Maps backend Project to frontend PortfolioProject
 */
export function mapProject(project: Project) {
  // Extract first line from highlights string for one_line_description
  const getFirstLine = (highlights?: string): string => {
    if (!highlights) return "";
    const lines = highlights.split("\n").filter((line) => line.trim());
    return lines[0]?.replace(/^[-*+]\s+/, "").trim() || "";
  };

  return {
    name: project.name || "",
    role: "", // role field removed from new schema
    one_line_description: getFirstLine(project.highlights),
    // highlights is now a markdown string in the new schema
    highlights: project.highlights || "",
    technologies: project.technologies || [],
    github: project.github || "",
    live_link: project.live_link || "",
    // New schema fields
    demo_video: project.demo_video || "",
    more_context: project.more_context || "",
    images: project.images || [], // ProjectImage[] with url, caption, order
  };
}

/**
 * Maps backend Education to frontend EducationItem
 */
export function mapEducation(education: Education) {
  return {
    school: education.institution || "",
    degree: `${education.degree || ""}${
      education.branch ? ` in ${education.branch}` : ""
    }`.trim(),
    start: formatDateInfo(education.start_date),
    end: education.is_current ? "Present" : formatDateInfo(education.end_date),
    location: education.location || "",
  };
}

/**
 * Main transformation function: maps backend portfolio data to frontend format
 */
export function mapBackendToFrontend(
  backendData: BackendPortfolioData
): PortfolioData {
  try {
    const personalInfo = backendData.personal_info || {};
    const profiles = personalInfo.profiles || [];

    return {
      profile: {
        name: personalInfo.full_name || "",
        headline: personalInfo.headline || "",
        location: personalInfo.location || "",
        profile_photo_url: personalInfo.profile_photo_url,
        socials: mapProfilesToSocials(profiles),
      },
      projects: (backendData.projects || []).map(mapProject),
      education: (backendData.education || []).map(mapEducation),
      experience: (backendData.work_experiences || []).map(mapWorkExperience),
      skills: [], // Extract from technologies in projects/experience if needed
      // achievements is now a markdown string in the new schema
      achievements: backendData.text_blobs?.achievements
        ? [backendData.text_blobs.achievements]
        : [],
      // certifications now include issuer field
      certificates: (backendData.certifications || [])
        .map((cert) => {
          const parts = [cert.name, cert.issuer].filter(Boolean);
          return parts.length > 0 ? parts.join(" - ") : "";
        })
        .filter(Boolean),
      layout_settings: backendData.layout_settings || {
        layout_mode: "both",
        default_layout: "chat",
      },
    };
  } catch (error) {
    console.error("Error mapping backend data to frontend:", error);
    throw new Error("Failed to transform portfolio data");
  }
}

/**
 * Validates that the API response has the expected structure
 */
export function validateApiResponse(data: any): data is BackendPortfolioData {
  if (!data || typeof data !== "object") {
    return false;
  }

  // Basic validation - check if it has expected optional fields
  const validFields = [
    "personal_info",
    "work_experiences",
    "projects",
    "education",
    "certifications",
    "text_blobs",
    "metadata",
    "layout_settings",
  ];

  // If it has any of the expected fields, consider it valid
  return validFields.some((field) => field in data);
}
