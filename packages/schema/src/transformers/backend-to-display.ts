/**
 * Main transformation function for converting backend portfolio data to display format.
 * Orchestrates all entity mappers and handles skill extraction and certification formatting.
 */

import type { PortfolioData } from "../schemas/portfolio";
import type { DisplayPortfolioData } from "../types/display";
import { mapProfilesToSocials } from "./profile-mapper";
import { mapWorkExperience, mapProject, mapEducation } from "./entity-mappers";

/**
 * Transforms backend PortfolioData to DisplayPortfolioData format.
 * This is the main entry point for converting validated backend data
 * into the flattened, string-based format expected by UI components.
 *
 * Key transformations:
 * - Extracts and deduplicates skills from work experiences and projects
 * - Maps certifications to formatted strings with issuer
 * - Converts all dates to formatted strings
 * - Flattens nested structures for easier UI consumption
 * - Handles optional fields gracefully
 *
 * @param backendData - Validated portfolio data from backend
 * @returns Display-formatted portfolio data ready for UI rendering
 *
 * @example
 * ```typescript
 * const backendData: PortfolioData = {
 *   personal_info: {
 *     full_name: "John Doe",
 *     headline: "Software Engineer",
 *     profiles: [
 *       { type: "github", url: "https://github.com/johndoe" }
 *     ]
 *   },
 *   work_experiences: [{
 *     organization: "Tech Corp",
 *     title: "Engineer",
 *     technologies: ["React", "Node.js"]
 *   }],
 *   projects: [{
 *     name: "My App",
 *     technologies: ["React", "TypeScript"]
 *   }]
 * };
 *
 * const displayData = mapBackendToDisplay(backendData);
 * // {
 * //   profile: {
 * //     name: "John Doe",
 * //     headline: "Software Engineer",
 * //     socials: [{ type: "github", href: "https://github.com/johndoe", label: "github" }]
 * //   },
 * //   skills: ["React", "Node.js", "TypeScript"],
 * //   experience: [...],
 * //   projects: [...]
 * // }
 * ```
 */
export function mapBackendToDisplay(
  backendData: PortfolioData
): DisplayPortfolioData {
  const personalInfo = backendData.personal_info;

  // Extract and deduplicate skills from technologies across work and projects
  const skills = new Set<string>();
  backendData.work_experiences?.forEach((exp) => {
    exp.technologies?.forEach((tech) => skills.add(tech));
  });
  backendData.projects?.forEach((project) => {
    project.technologies?.forEach((tech) => skills.add(tech));
  });

  // Map certifications to formatted strings with issuer
  const certificates = (backendData.certifications || [])
    .map((cert) => {
      const parts = [cert.name, cert.issuer].filter(Boolean);
      return parts.length > 0 ? parts.join(" - ") : "";
    })
    .filter(Boolean);

  return {
    profile: {
      name: personalInfo?.full_name,
      headline: personalInfo?.headline,
      location: personalInfo?.location,
      email: personalInfo?.email,
      summary: personalInfo?.summary,
      avatarUrl: personalInfo?.profile_photo_url,
      socials: mapProfilesToSocials(personalInfo?.profiles),
    },
    projects: (backendData.projects || []).map(mapProject),
    education: (backendData.education || []).map(mapEducation),
    experience: (backendData.work_experiences || []).map(mapWorkExperience),
    skills: Array.from(skills),
    achievements: backendData.text_blobs?.achievements
      ? [backendData.text_blobs.achievements]
      : [],
    certificates,
    layout_settings: backendData.layout_settings,
  };
}
