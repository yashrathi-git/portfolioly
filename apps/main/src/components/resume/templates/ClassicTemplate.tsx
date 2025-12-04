/**
 * Classic Resume Template
 *
 * Traditional resume layout with serif fonts, optimized for ATS compatibility.
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
    return start ? `${start} - Present` : "Present";
  }
  const end = formatDate(endDate);
  if (start && end) {
    return `${start} - ${end}`;
  }
  return start || end || "";
}

/**
 * Contact Info Section
 */
function ContactInfo({ data }: { data: ResumeData }) {
  const { personal_info } = data;
  const contactItems: string[] = [];

  if (personal_info.email) contactItems.push(personal_info.email);
  if (personal_info.phone) contactItems.push(personal_info.phone);
  if (personal_info.location) contactItems.push(personal_info.location);

  const links: { label: string; url: string }[] = [];
  if (personal_info.linkedin_url)
    links.push({ label: "LinkedIn", url: personal_info.linkedin_url });
  if (personal_info.github_url)
    links.push({ label: "GitHub", url: personal_info.github_url });
  if (personal_info.website_url)
    links.push({ label: "Website", url: personal_info.website_url });

  return (
    <div className="classic-contact">
      {contactItems.length > 0 && (
        <p className="classic-contact-line">{contactItems.join(" | ")}</p>
      )}
      {links.length > 0 && (
        <p className="classic-contact-links">
          {links.map((link, i) => (
            <span key={link.label}>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
              {i < links.length - 1 && " | "}
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
    <section className="classic-section">
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
    <section className="classic-section">
      <h2>Experience</h2>
      {data.work_experiences.map((exp) => (
        <div key={exp.id} className="classic-entry">
          <div className="classic-entry-header">
            <h3>{exp.title}</h3>
            <span className="classic-date">
              {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
            </span>
          </div>
          <div className="classic-entry-subheader">
            <span className="classic-company">{exp.company}</span>
            {exp.location && (
              <span className="classic-location">{exp.location}</span>
            )}
          </div>
          {exp.highlights && exp.highlights.length > 0 && (
            <ul className="classic-highlights">
              {exp.highlights.map((highlight, i) => (
                <li key={i}>{highlight}</li>
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
    <section className="classic-section">
      <h2>Education</h2>
      {data.education.map((edu) => (
        <div key={edu.id} className="classic-entry">
          <div className="classic-entry-header">
            <h3>
              {edu.degree}
              {edu.field ? ` in ${edu.field}` : ""}
            </h3>
            <span className="classic-date">
              {formatDateRange(edu.start_date, edu.end_date)}
            </span>
          </div>
          <div className="classic-entry-subheader">
            <span className="classic-institution">{edu.institution}</span>
            {edu.location && (
              <span className="classic-location">{edu.location}</span>
            )}
            {edu.gpa && <span className="classic-gpa">GPA: {edu.gpa}</span>}
          </div>
          {edu.highlights && edu.highlights.length > 0 && (
            <ul className="classic-highlights">
              {edu.highlights.map((highlight, i) => (
                <li key={i}>{highlight}</li>
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
    <section className="classic-section">
      <h2>Projects</h2>
      {data.projects.map((project) => (
        <div key={project.id} className="classic-entry">
          <div className="classic-entry-header">
            <h3>
              {project.url ? (
                <a href={project.url} target="_blank" rel="noopener noreferrer">
                  {project.name}
                </a>
              ) : (
                project.name
              )}
            </h3>
          </div>
          {project.description && (
            <p className="classic-description">{project.description}</p>
          )}
          {project.technologies && project.technologies.length > 0 && (
            <p className="classic-technologies">
              <strong>Technologies:</strong> {project.technologies.join(", ")}
            </p>
          )}
          {project.highlights && project.highlights.length > 0 && (
            <ul className="classic-highlights">
              {project.highlights.map((highlight, i) => (
                <li key={i}>{highlight}</li>
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
    <section className="classic-section">
      <h2>Skills</h2>
      <div className="classic-skills">
        {data.skills.categories.map((category, i) => (
          <p key={i} className="classic-skill-category">
            <strong>{category.name}:</strong> {category.items.join(", ")}
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
    <section className="classic-section">
      <h2>Certifications</h2>
      <ul className="classic-certifications">
        {data.certifications.map((cert) => (
          <li key={cert.id}>
            <strong>{cert.name}</strong>
            {cert.issuer && <span> - {cert.issuer}</span>}
            {cert.date && <span> ({cert.date})</span>}
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
 * Classic Resume Template Component
 */
export function ClassicTemplate({
  data,
  sectionOrder,
  isPrintMode,
}: ResumeTemplateProps) {
  return (
    <div className={`classic-template ${isPrintMode ? "print-mode" : ""}`}>
      <style>{classicStyles}</style>
      <header className="classic-header">
        <h1>{data.personal_info.full_name}</h1>
        <ContactInfo data={data} />
      </header>
      <main className="classic-main">
        {sectionOrder.map((section) => sectionRenderers[section](data))}
      </main>
    </div>
  );
}

/**
 * CSS styles for the Classic Template
 * Uses serif fonts and traditional resume styling
 * Includes @media print for PDF export
 */
const classicStyles = `
  .classic-template {
    font-family: "Times New Roman", Times, Georgia, serif;
    font-size: 11pt;
    line-height: 1.4;
    color: #000;
    max-width: 8.5in;
    margin: 0 auto;
    padding: 0.5in;
    background: #fff;
  }

  .classic-template.print-mode {
    padding: 0;
  }

  .classic-header {
    text-align: center;
    margin-bottom: 0.5em;
    border-bottom: 1px solid #000;
    padding-bottom: 0.5em;
  }

  .classic-header h1 {
    font-size: 18pt;
    font-weight: bold;
    margin: 0 0 0.25em 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .classic-contact {
    font-size: 10pt;
  }

  .classic-contact-line {
    margin: 0.25em 0;
  }

  .classic-contact-links {
    margin: 0.25em 0;
  }

  .classic-contact-links a {
    color: #000;
    text-decoration: none;
  }

  .classic-contact-links a:hover {
    text-decoration: underline;
  }

  .classic-section {
    margin-bottom: 0.75em;
  }

  .classic-section h2 {
    font-size: 12pt;
    font-weight: bold;
    text-transform: uppercase;
    border-bottom: 1px solid #000;
    margin: 0 0 0.5em 0;
    padding-bottom: 0.1em;
    letter-spacing: 0.05em;
  }

  .classic-entry {
    margin-bottom: 0.5em;
  }

  .classic-entry-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .classic-entry-header h3 {
    font-size: 11pt;
    font-weight: bold;
    margin: 0;
  }

  .classic-entry-header h3 a {
    color: #000;
    text-decoration: none;
  }

  .classic-entry-header h3 a:hover {
    text-decoration: underline;
  }

  .classic-date {
    font-size: 10pt;
    font-style: italic;
  }

  .classic-entry-subheader {
    display: flex;
    gap: 0.5em;
    font-size: 10pt;
    margin-bottom: 0.25em;
  }

  .classic-company,
  .classic-institution {
    font-style: italic;
  }

  .classic-location::before {
    content: "| ";
  }

  .classic-gpa::before {
    content: "| ";
  }

  .classic-highlights {
    margin: 0.25em 0 0 1.5em;
    padding: 0;
  }

  .classic-highlights li {
    margin-bottom: 0.1em;
  }

  .classic-description {
    margin: 0.25em 0;
    font-size: 10pt;
  }

  .classic-technologies {
    margin: 0.25em 0;
    font-size: 10pt;
  }

  .classic-skills {
    margin: 0;
  }

  .classic-skill-category {
    margin: 0.25em 0;
  }

  .classic-certifications {
    margin: 0 0 0 1.5em;
    padding: 0;
  }

  .classic-certifications li {
    margin-bottom: 0.25em;
  }

  /* Print styles */
  @media print {
    .classic-template {
      padding: 0;
      font-size: 10pt;
    }

    .classic-header h1 {
      font-size: 16pt;
    }

    .classic-section h2 {
      font-size: 11pt;
    }

    .classic-contact-links a {
      text-decoration: none;
    }

    .classic-entry-header h3 a {
      text-decoration: none;
    }
  }
`;

// Register the template
registerTemplate({
  id: "classic",
  name: "Classic",
  description:
    "Traditional resume layout with serif fonts, ideal for conservative industries",
  thumbnail: "/templates/classic-thumb.png",
  component: ClassicTemplate,
});

export default ClassicTemplate;
