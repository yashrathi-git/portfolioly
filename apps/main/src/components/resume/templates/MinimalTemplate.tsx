/**
 * Minimal Resume Template
 *
 * Minimalist layout with maximum whitespace, optimized for ATS compatibility.
 * Uses semantic HTML (h1, h2, h3) and avoids complex layouts.
 *
 * _Requirements: 4.1, 7.1, 7.2, 7.3, 7.4_
 */

"use client";

import React from "react";
import type { ResumeTemplateProps } from "./types";
import type { ResumeData, SectionType } from "@/types/resume";
import { registerTemplate } from "./registry";

/**
 * Strip bullet prefix from highlight text
 * Removes leading -, *, / and whitespace
 */
function stripBulletPrefix(text: string): string {
  return text.replace(/^[-*/]\s*/, "").trim();
}

/**
 * Format a date for display (e.g., "Jan 2020" or "2020")
 */
function formatDate(
  date: { month?: number | null; year?: number | null } | null | undefined
): string {
  if (!date) return "";
  const months = [
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
  if (date.month && date.year) {
    return `${months[date.month - 1]} ${date.year}`;
  }
  if (date.year) {
    return `${date.year}`;
  }
  return "";
}

/**
 * Format date range for display
 */
function formatDateRange(
  startDate: { month?: number | null; year?: number | null } | null | undefined,
  endDate: { month?: number | null; year?: number | null } | null | undefined,
  isCurrent?: boolean
): string {
  const start = formatDate(startDate);
  if (isCurrent) {
    return start ? `${start} — Present` : "Present";
  }
  const end = formatDate(endDate);
  if (start && end) {
    return `${start} — ${end}`;
  }
  return start || end || "";
}

/**
 * Contact Info Section
 */
function ContactInfo({ data }: { data: ResumeData }) {
  const { personal_info } = data;
  const items: string[] = [];

  if (personal_info.email) items.push(personal_info.email);
  if (personal_info.phone) items.push(personal_info.phone);
  if (personal_info.location) items.push(personal_info.location);

  const links: { label: string; url: string }[] = [];
  if (personal_info.linkedin_url)
    links.push({ label: "LinkedIn", url: personal_info.linkedin_url });
  if (personal_info.github_url)
    links.push({ label: "GitHub", url: personal_info.github_url });
  if (personal_info.website_url)
    links.push({ label: "Portfolio", url: personal_info.website_url });

  return (
    <div className="minimal-contact">
      {items.length > 0 && (
        <p className="minimal-contact-line">{items.join("  ·  ")}</p>
      )}
      {links.length > 0 && (
        <p className="minimal-contact-links">
          {links.map((link, i) => (
            <span key={link.label}>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
              {i < links.length - 1 && "  ·  "}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

/**
 * Summary Section
 */
function SummarySection({ data }: { data: ResumeData }) {
  if (!data.summary) return null;
  return (
    <section className="minimal-section">
      <h2>Summary</h2>
      <p>{data.summary}</p>
    </section>
  );
}

/**
 * Experience Section
 */
function ExperienceSection({ data }: { data: ResumeData }) {
  if (!data.work_experiences || data.work_experiences.length === 0) return null;
  return (
    <section className="minimal-section">
      <h2>Experience</h2>
      {data.work_experiences.map((exp) => (
        <div key={exp.id} className="minimal-entry">
          <div className="minimal-entry-line">
            <h3>{exp.title}</h3>
            <span className="minimal-separator">at</span>
            <span className="minimal-org">{exp.company}</span>
            <span className="minimal-date">
              {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
            </span>
          </div>
          {exp.highlights && exp.highlights.filter(h => h.trim()).length > 0 && (
            <ul className="minimal-highlights">
              {exp.highlights.filter(h => h.trim()).map((highlight, i) => (
                <li key={i}>{stripBulletPrefix(highlight)}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}

/**
 * Education Section
 */
function EducationSection({ data }: { data: ResumeData }) {
  if (!data.education || data.education.length === 0) return null;
  return (
    <section className="minimal-section">
      <h2>Education</h2>
      {data.education.map((edu) => (
        <div key={edu.id} className="minimal-entry">
          <div className="minimal-entry-line">
            <h3>
              {edu.degree}
              {edu.field ? `, ${edu.field}` : ""}
            </h3>
            <span className="minimal-separator">—</span>
            <span className="minimal-org">{edu.institution}</span>
            <span className="minimal-date">
              {formatDateRange(edu.start_date, edu.end_date)}
            </span>
          </div>
          {edu.gpa && <p className="minimal-meta">GPA: {edu.gpa}</p>}
        </div>
      ))}
    </section>
  );
}

/**
 * Projects Section
 */
function ProjectsSection({ data }: { data: ResumeData }) {
  if (!data.projects || data.projects.length === 0) return null;
  return (
    <section className="minimal-section">
      <h2>Projects</h2>
      {data.projects.map((project) => (
        <div key={project.id} className="minimal-entry">
          <div className="minimal-entry-line">
            <h3>
              {project.url ? (
                <a href={project.url} target="_blank" rel="noopener noreferrer">
                  {project.name}
                </a>
              ) : (
                project.name
              )}
            </h3>
            {project.technologies && project.technologies.length > 0 && (
              <span className="minimal-tech">
                {project.technologies.join(", ")}
              </span>
            )}
          </div>
          {project.description && (
            <p className="minimal-description">{project.description}</p>
          )}
          {project.highlights && project.highlights.filter(h => h.trim()).length > 0 && (
            <ul className="minimal-highlights">
              {project.highlights.filter(h => h.trim()).map((highlight, i) => (
                <li key={i}>{stripBulletPrefix(highlight)}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}

/**
 * Skills Section
 */
function SkillsSection({ data }: { data: ResumeData }) {
  if (
    !data.skills ||
    !data.skills.categories ||
    data.skills.categories.length === 0
  )
    return null;
  return (
    <section className="minimal-section">
      <h2>Skills</h2>
      <div className="minimal-skills">
        {data.skills.categories.map((category, i) => (
          <p key={i}>
            <span className="minimal-skill-label">{category.name}:</span>{" "}
            {category.items.join(", ")}
          </p>
        ))}
      </div>
    </section>
  );
}

/**
 * Certifications Section
 */
function CertificationsSection({ data }: { data: ResumeData }) {
  if (!data.certifications || data.certifications.length === 0) return null;
  return (
    <section className="minimal-section">
      <h2>Certifications</h2>
      <ul className="minimal-list">
        {data.certifications.map((cert) => (
          <li key={cert.id}>
            {cert.name}
            {cert.issuer && ` — ${cert.issuer}`}
            {cert.date && ` (${cert.date})`}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Section renderer map for dynamic section ordering
 */
const sectionRenderers: Record<
  SectionType,
  (data: ResumeData) => React.ReactNode
> = {
  summary: (data) => <SummarySection key="summary" data={data} />,
  experience: (data) => <ExperienceSection key="experience" data={data} />,
  education: (data) => <EducationSection key="education" data={data} />,
  projects: (data) => <ProjectsSection key="projects" data={data} />,
  skills: (data) => <SkillsSection key="skills" data={data} />,
  certifications: (data) => (
    <CertificationsSection key="certifications" data={data} />
  ),
};

/**
 * Minimal Resume Template Component
 */
export function MinimalTemplate({
  data,
  sectionOrder,
  isPrintMode,
}: ResumeTemplateProps) {
  return (
    <div className={`minimal-template ${isPrintMode ? "print-mode" : ""}`}>
      <style>{minimalStyles}</style>
      <header className="minimal-header">
        <h1>{data.personal_info.full_name}</h1>
        <ContactInfo data={data} />
      </header>
      <main className="minimal-main">
        {sectionOrder.map((section) => sectionRenderers[section](data))}
      </main>
    </div>
  );
}

/**
 * CSS styles for the Minimal Template
 * Uses clean typography with maximum whitespace
 * Includes @media print for PDF export
 */
const minimalStyles = `
  .minimal-template {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 10pt;
    line-height: 1.6;
    color: #333;
    max-width: 8.5in;
    margin: 0 auto;
    padding: 0.75in;
    background: #fff;
  }

  .minimal-template.print-mode {
    padding: 0.5in;
  }

  .minimal-header {
    margin-bottom: 2em;
    text-align: center;
  }

  .minimal-header h1 {
    font-size: 28pt;
    font-weight: 300;
    margin: 0 0 0.5em 0;
    color: #111;
    letter-spacing: 0.02em;
  }

  .minimal-contact {
    font-size: 9pt;
    color: #666;
  }

  .minimal-contact-line {
    margin: 0.25em 0;
  }

  .minimal-contact-links {
    margin: 0.25em 0;
  }

  .minimal-contact-links a {
    color: #666;
    text-decoration: none;
    border-bottom: 1px solid #ddd;
  }

  .minimal-contact-links a:hover {
    color: #111;
    border-bottom-color: #111;
  }

  .minimal-section {
    margin-bottom: 2em;
  }

  .minimal-section h2 {
    font-size: 9pt;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #999;
    margin: 0 0 1em 0;
    padding-bottom: 0.5em;
    border-bottom: 1px solid #eee;
  }

  .minimal-section > p {
    margin: 0;
    color: #555;
  }

  .minimal-entry {
    margin-bottom: 1.5em;
  }

  .minimal-entry-line {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5em;
    margin-bottom: 0.25em;
  }

  .minimal-entry-line h3 {
    font-size: 11pt;
    font-weight: 500;
    margin: 0;
    color: #111;
  }

  .minimal-entry-line h3 a {
    color: #111;
    text-decoration: none;
    border-bottom: 1px solid #ddd;
  }

  .minimal-entry-line h3 a:hover {
    border-bottom-color: #111;
  }

  .minimal-separator {
    color: #999;
    font-size: 9pt;
  }

  .minimal-org {
    color: #555;
    font-size: 10pt;
  }

  .minimal-date {
    margin-left: auto;
    color: #999;
    font-size: 9pt;
  }

  .minimal-tech {
    font-size: 9pt;
    color: #888;
  }

  .minimal-meta {
    font-size: 9pt;
    color: #888;
    margin: 0.25em 0;
  }

  .minimal-description {
    font-size: 9.5pt;
    color: #555;
    margin: 0.5em 0;
  }

  .minimal-highlights {
    margin: 0.5em 0 0 1.25em;
    padding: 0;
    color: #444;
  }

  .minimal-highlights li {
    margin-bottom: 0.25em;
    font-size: 9.5pt;
  }

  .minimal-skills p {
    margin: 0.25em 0;
    font-size: 9.5pt;
    color: #555;
  }

  .minimal-skill-label {
    font-weight: 500;
    color: #333;
  }

  .minimal-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .minimal-list li {
    margin-bottom: 0.5em;
    font-size: 9.5pt;
    color: #555;
  }

  /* Print styles */
  @media print {
    .minimal-template {
      padding: 0.5in;
      font-size: 9pt;
    }

    .minimal-header h1 {
      font-size: 24pt;
    }

    .minimal-contact-links a {
      border-bottom: none;
      color: #333;
    }

    .minimal-entry-line h3 a {
      border-bottom: none;
    }
  }
`;

// Register the template
registerTemplate({
  id: "minimal",
  name: "Minimal",
  description:
    "Clean, minimalist design with generous whitespace for a sophisticated look",
  thumbnail: "/templates/minimal-thumb.png",
  component: MinimalTemplate,
});

export default MinimalTemplate;
