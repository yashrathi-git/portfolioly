/**
 * Modern Resume Template
 *
 * Clean, modern layout with sans-serif fonts, optimized for ATS compatibility.
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
    return start ? `${start} – Present` : "Present";
  }
  const end = formatDate(endDate);
  if (start && end) {
    return `${start} – ${end}`;
  }
  return start || end || "";
}

/**
 * Contact Info Section
 */
function ContactInfo({ data }: { data: ResumeData }) {
  const { personal_info } = data;
  const items: React.ReactNode[] = [];

  if (personal_info.email) {
    items.push(
      <span key="email" className="modern-contact-item">
        <span className="modern-icon">✉</span>
        {personal_info.email}
      </span>
    );
  }
  if (personal_info.phone) {
    items.push(
      <span key="phone" className="modern-contact-item">
        <span className="modern-icon">☎</span>
        {personal_info.phone}
      </span>
    );
  }
  if (personal_info.location) {
    items.push(
      <span key="location" className="modern-contact-item">
        <span className="modern-icon">📍</span>
        {personal_info.location}
      </span>
    );
  }
  if (personal_info.linkedin_url) {
    items.push(
      <a
        key="linkedin"
        href={personal_info.linkedin_url}
        target="_blank"
        rel="noopener noreferrer"
        className="modern-contact-item modern-link"
      >
        <span className="modern-icon">in</span>
        LinkedIn
      </a>
    );
  }
  if (personal_info.github_url) {
    items.push(
      <a
        key="github"
        href={personal_info.github_url}
        target="_blank"
        rel="noopener noreferrer"
        className="modern-contact-item modern-link"
      >
        <span className="modern-icon">⌘</span>
        GitHub
      </a>
    );
  }
  if (personal_info.website_url) {
    items.push(
      <a
        key="website"
        href={personal_info.website_url}
        target="_blank"
        rel="noopener noreferrer"
        className="modern-contact-item modern-link"
      >
        <span className="modern-icon">🌐</span>
        Website
      </a>
    );
  }

  if (items.length === 0) return null;

  return <div className="modern-contact">{items}</div>;
}

/**
 * Summary Section
 */
function SummarySection({ data }: { data: ResumeData }) {
  if (!data.summary) return null;
  return (
    <section className="modern-section">
      <h2>Summary</h2>
      <p className="modern-summary-text">{data.summary}</p>
    </section>
  );
}

/**
 * Experience Section
 */
function ExperienceSection({ data }: { data: ResumeData }) {
  if (!data.work_experiences || data.work_experiences.length === 0) return null;
  return (
    <section className="modern-section">
      <h2>Work Experience</h2>
      {data.work_experiences.map((exp) => (
        <div key={exp.id} className="modern-entry">
          <div className="modern-entry-header">
            <div className="modern-entry-title">
              <h3>{exp.title}</h3>
              <span className="modern-company">{exp.company}</span>
            </div>
            <div className="modern-entry-meta">
              <span className="modern-date">
                {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
              </span>
              {exp.location && (
                <span className="modern-location">{exp.location}</span>
              )}
            </div>
          </div>
          {exp.highlights && exp.highlights.filter(h => h.trim()).length > 0 && (
            <ul className="modern-highlights">
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
    <section className="modern-section">
      <h2>Education</h2>
      {data.education.map((edu) => (
        <div key={edu.id} className="modern-entry">
          <div className="modern-entry-header">
            <div className="modern-entry-title">
              <h3>
                {edu.degree}
                {edu.field ? ` in ${edu.field}` : ""}
              </h3>
              <span className="modern-institution">{edu.institution}</span>
            </div>
            <div className="modern-entry-meta">
              <span className="modern-date">
                {formatDateRange(edu.start_date, edu.end_date)}
              </span>
              {edu.location && (
                <span className="modern-location">{edu.location}</span>
              )}
            </div>
          </div>
          {edu.gpa && <p className="modern-gpa">GPA: {edu.gpa}</p>}
          {edu.highlights && edu.highlights.filter(h => h.trim()).length > 0 && (
            <ul className="modern-highlights">
              {edu.highlights.filter(h => h.trim()).map((highlight, i) => (
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
 * Projects Section
 */
function ProjectsSection({ data }: { data: ResumeData }) {
  if (!data.projects || data.projects.length === 0) return null;
  return (
    <section className="modern-section">
      <h2>Projects</h2>
      {data.projects.map((project) => (
        <div key={project.id} className="modern-entry">
          <div className="modern-entry-header">
            <div className="modern-entry-title">
              <h3>
                {project.url ? (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {project.name}
                  </a>
                ) : (
                  project.name
                )}
              </h3>
              {project.technologies && project.technologies.length > 0 && (
                <span className="modern-tech-stack">
                  {project.technologies.join(" • ")}
                </span>
              )}
            </div>
          </div>
          {project.description && (
            <p className="modern-description">{project.description}</p>
          )}
          {project.highlights && project.highlights.filter(h => h.trim()).length > 0 && (
            <ul className="modern-highlights">
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
    <section className="modern-section">
      <h2>Skills</h2>
      <div className="modern-skills">
        {data.skills.categories.map((category, i) => (
          <div key={i} className="modern-skill-category">
            <span className="modern-skill-label">{category.name}</span>
            <span className="modern-skill-items">
              {category.items.join(" • ")}
            </span>
          </div>
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
    <section className="modern-section">
      <h2>Certifications</h2>
      <ul className="modern-certifications">
        {data.certifications.map((cert) => (
          <li key={cert.id}>
            <span className="modern-cert-name">{cert.name}</span>
            {cert.issuer && (
              <span className="modern-cert-issuer">{cert.issuer}</span>
            )}
            {cert.date && <span className="modern-cert-date">{cert.date}</span>}
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
 * Modern Resume Template Component
 */
export function ModernTemplate({
  data,
  sectionOrder,
  isPrintMode,
}: ResumeTemplateProps) {
  return (
    <div className={`modern-template ${isPrintMode ? "print-mode" : ""}`}>
      <style>{modernStyles}</style>
      <header className="modern-header">
        <h1>{data.personal_info.full_name}</h1>
        <ContactInfo data={data} />
      </header>
      <main className="modern-main">
        {sectionOrder.map((section) => sectionRenderers[section](data))}
      </main>
    </div>
  );
}

/**
 * CSS styles for the Modern Template
 * Uses sans-serif fonts and clean, modern styling
 * Includes @media print for PDF export
 */
const modernStyles = `
  .modern-template {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.5;
    color: #1a1a1a;
    max-width: 8.5in;
    margin: 0 auto;
    padding: 0.5in;
    background: #fff;
  }

  .modern-template.print-mode {
    padding: 0;
  }

  .modern-header {
    margin-bottom: 1em;
    padding-bottom: 0.75em;
    border-bottom: 2px solid #2563eb;
  }

  .modern-header h1 {
    font-size: 24pt;
    font-weight: 700;
    margin: 0 0 0.25em 0;
    color: #1a1a1a;
    letter-spacing: -0.02em;
  }

  .modern-contact {
    display: flex;
    flex-wrap: wrap;
    gap: 1em;
    font-size: 9pt;
    color: #4b5563;
  }

  .modern-contact-item {
    display: inline-flex;
    align-items: center;
    gap: 0.25em;
  }

  .modern-icon {
    font-size: 8pt;
    opacity: 0.7;
  }

  .modern-link {
    color: #2563eb;
    text-decoration: none;
  }

  .modern-link:hover {
    text-decoration: underline;
  }

  .modern-section {
    margin-bottom: 1em;
  }

  .modern-section h2 {
    font-size: 11pt;
    font-weight: 600;
    text-transform: uppercase;
    color: #2563eb;
    margin: 0 0 0.5em 0;
    padding-bottom: 0.25em;
    border-bottom: 1px solid #e5e7eb;
    letter-spacing: 0.05em;
  }

  .modern-summary-text {
    margin: 0;
    color: #4b5563;
  }

  .modern-entry {
    margin-bottom: 0.75em;
  }

  .modern-entry-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.25em;
  }

  .modern-entry-title {
    flex: 1;
  }

  .modern-entry-title h3 {
    font-size: 11pt;
    font-weight: 600;
    margin: 0;
    color: #1a1a1a;
  }

  .modern-entry-title h3 a {
    color: #1a1a1a;
    text-decoration: none;
  }

  .modern-entry-title h3 a:hover {
    color: #2563eb;
  }

  .modern-company,
  .modern-institution {
    font-size: 10pt;
    color: #4b5563;
  }

  .modern-tech-stack {
    font-size: 9pt;
    color: #6b7280;
    display: block;
    margin-top: 0.1em;
  }

  .modern-entry-meta {
    text-align: right;
    flex-shrink: 0;
  }

  .modern-date {
    font-size: 9pt;
    color: #6b7280;
    display: block;
  }

  .modern-location {
    font-size: 9pt;
    color: #9ca3af;
    display: block;
  }

  .modern-gpa {
    font-size: 9pt;
    color: #6b7280;
    margin: 0.25em 0;
  }

  .modern-highlights {
    margin: 0.25em 0 0 1.25em;
    padding: 0;
    color: #374151;
  }

  .modern-highlights li {
    margin-bottom: 0.15em;
    font-size: 9.5pt;
  }

  .modern-description {
    margin: 0.25em 0;
    font-size: 9.5pt;
    color: #4b5563;
  }

  .modern-skills {
    display: flex;
    flex-direction: column;
    gap: 0.25em;
  }

  .modern-skill-category {
    display: flex;
    gap: 0.5em;
    font-size: 9.5pt;
  }

  .modern-skill-label {
    font-weight: 600;
    color: #374151;
    min-width: 100px;
  }

  .modern-skill-items {
    color: #4b5563;
  }

  .modern-certifications {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .modern-certifications li {
    display: flex;
    gap: 0.5em;
    margin-bottom: 0.25em;
    font-size: 9.5pt;
  }

  .modern-cert-name {
    font-weight: 500;
    color: #1a1a1a;
  }

  .modern-cert-issuer {
    color: #4b5563;
  }

  .modern-cert-issuer::before {
    content: "– ";
  }

  .modern-cert-date {
    color: #6b7280;
  }

  /* Print styles */
  @media print {
    .modern-template {
      padding: 0;
      font-size: 9pt;
    }

    .modern-header h1 {
      font-size: 20pt;
    }

    .modern-header {
      border-bottom-color: #000;
    }

    .modern-section h2 {
      color: #000;
      border-bottom-color: #ccc;
    }

    .modern-link {
      color: #000;
      text-decoration: none;
    }

    .modern-entry-title h3 a {
      color: #000;
    }
  }
`;

// Register the template
registerTemplate({
  id: "modern",
  name: "Modern",
  description:
    "Clean, contemporary design with sans-serif fonts, perfect for tech and creative roles",
  thumbnail: "/templates/modern-thumb.png",
  component: ModernTemplate,
});

export default ModernTemplate;
