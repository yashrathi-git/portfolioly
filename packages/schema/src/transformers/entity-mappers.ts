/**
 * Entity mapping utilities for converting backend types to display format.
 * Handles work experience, projects, and education transformations.
 */

import type { WorkExperience } from "../schemas/work";
import type { Project } from "../schemas/project";
import type { Education } from "../schemas/education";
import type {
  DisplayWorkExperience,
  DisplayProject,
  DisplayEducation,
} from "../types/display";
import { formatDateInfo } from "./date-formatter";

/**
 * Maps a WorkExperience object to DisplayWorkExperience format.
 * Flattens organization to companyName and formats dates as strings.
 *
 * @param exp - Work experience from backend
 * @returns Display-formatted work experience
 *
 * @example
 * ```typescript
 * const exp = {
 *   organization: "Tech Corp",
 *   title: "Senior Engineer",
 *   start_date: { month: 1, year: 2020 },
 *   end_date: { month: 12, year: 2022 },
 *   is_current: false
 * };
 * const display = mapWorkExperience(exp);
 * // {
 * //   companyName: "Tech Corp",
 * //   role: "Senior Engineer",
 * //   start: "Jan 2020",
 * //   end: "Dec 2022"
 * // }
 * ```
 */
export function mapWorkExperience(exp: WorkExperience): DisplayWorkExperience {
  return {
    companyName: exp.organization ?? undefined,
    role: exp.title ?? undefined,
    location: exp.location ?? undefined,
    start: formatDateInfo(exp.start_date),
    end: exp.is_current ? "Present" : formatDateInfo(exp.end_date),
    points: exp.highlights ?? undefined,
    technologies: exp.technologies,
    logoUrl: exp.logo_url ?? undefined,
  };
}

/**
 * Extracts the first line from markdown highlights for one-line description.
 * Removes markdown list markers and trims whitespace.
 *
 * @param highlights - Markdown string with highlights
 * @returns First line without markdown markers, or undefined if no highlights
 */
function getFirstLine(highlights?: string): string | undefined {
  if (!highlights) return undefined;
  const lines = highlights.split("\n").filter((line) => line.trim());
  return lines[0]?.replace(/^[-*+]\s+/, "").trim() || undefined;
}

/**
 * Maps a Project object to DisplayProject format.
 * Extracts first line from highlights for one_line_description.
 *
 * @param project - Project from backend
 * @returns Display-formatted project
 *
 * @example
 * ```typescript
 * const project = {
 *   name: "My App",
 *   highlights: "- Built a web app\n- Used React and Node.js",
 *   technologies: ["React", "Node.js"]
 * };
 * const display = mapProject(project);
 * // {
 * //   name: "My App",
 * //   one_line_description: "Built a web app",
 * //   highlights: "- Built a web app\n- Used React and Node.js",
 * //   technologies: ["React", "Node.js"]
 * // }
 * ```
 */
export function mapProject(project: Project): DisplayProject {
  return {
    name: project.name ?? undefined,
    one_line_description: getFirstLine(project.highlights ?? undefined),
    highlights: project.highlights ?? undefined,
    technologies: project.technologies,
    github: project.github ?? undefined,
    live_link: project.live_link ?? undefined,
    demo_video: project.demo_video ?? undefined,
    more_context: project.more_context ?? undefined,
    images: project.images,
  };
}

/**
 * Maps an Education object to DisplayEducation format.
 * Combines degree and branch fields with "in" separator.
 *
 * @param edu - Education from backend
 * @returns Display-formatted education
 *
 * @example
 * ```typescript
 * const edu = {
 *   institution: "MIT",
 *   degree: "Bachelor of Science",
 *   branch: "Computer Science",
 *   start_date: { year: 2016 },
 *   end_date: { year: 2020 },
 *   is_current: false
 * };
 * const display = mapEducation(edu);
 * // {
 * //   school: "MIT",
 * //   degree: "Bachelor of Science in Computer Science",
 * //   start: "2016",
 * //   end: "2020"
 * // }
 * ```
 */
export function mapEducation(edu: Education): DisplayEducation {
  // Combine degree and branch
  const degreeParts = [edu.degree, edu.branch].filter(Boolean);
  const degree =
    degreeParts.length > 1
      ? `${degreeParts[0]} in ${degreeParts[1]}`
      : degreeParts[0];

  return {
    school: edu.institution ?? undefined,
    degree: degree ?? undefined,
    start: formatDateInfo(edu.start_date),
    end: edu.is_current ? "Present" : formatDateInfo(edu.end_date),
    location: edu.location ?? undefined,
    grade: edu.grade ?? undefined,
    logoUrl: edu.logo_url ?? undefined,
  };
}
