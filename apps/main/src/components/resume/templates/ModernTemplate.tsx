/**
 * Modern Resume Template
 *
 * Clean, modern layout with sans-serif fonts, optimized for ATS compatibility.
 * Features multi-page support with visual page separation in preview mode.
 *
 * _Requirements: 4.1, 7.1, 7.2, 7.3, 7.4_
 */

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import type { ResumeTemplateProps } from "./types";
import type { ResumeData, SectionType } from "@/types/resume";
import { registerTemplate } from "./registry";
import {
  renderHighlight,
  renderMarkdown,
  formatDateRange,
  getProfileDisplayName,
} from "./utils";

// Page dimensions in pixels (96 DPI) - Letter size
const PAGE_WIDTH_PX = 8.5 * 96;
const PAGE_HEIGHT_PX = 11 * 96;
const PAGE_PADDING_PX = 0.5 * 96;
const CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - PAGE_PADDING_PX * 2;

/**
 * Load Inter font via link element
 */
function ensureFontLoaded(): void {
  if (typeof document === "undefined") return;

  const fontId = "modern-template-inter-font";
  if (document.getElementById(fontId)) return;

  const link = document.createElement("link");
  link.id = fontId;
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
  document.head.appendChild(link);
}

/**
 * Get URL for a profile
 */
function getProfileUrl(key: string, url: string): string {
  if (url.startsWith("http")) return url;

  const prefixes: Record<string, string> = {
    linkedin: "https://linkedin.com/in/",
    github: "https://github.com/",
    leetcode: "https://leetcode.com/",
    codeforces: "https://codeforces.com/profile/",
    codechef: "https://codechef.com/users/",
    website: "https://",
  };

  return url.startsWith("http") ? url : `${prefixes[key] || "https://"}${url}`;
}

/**
 * Build header section content
 */
function buildHeaderContent(data: ResumeData): React.ReactNode {
  const { personal_info } = data;
  const contactItems: React.ReactNode[] = [];

  if (personal_info.email) {
    contactItems.push(
      <span key="email" className="modern-contact-item">
        {personal_info.email}
      </span>
    );
  }
  if (personal_info.phone) {
    contactItems.push(
      <span key="phone" className="modern-contact-item">
        {personal_info.phone}
      </span>
    );
  }
  if (personal_info.location) {
    contactItems.push(
      <span key="location" className="modern-contact-item">
        {personal_info.location}
      </span>
    );
  }

  // Profile links
  if (personal_info.profiles) {
    const profileKeys = [
      "linkedin",
      "github",
      "leetcode",
      "codeforces",
      "codechef",
      "website",
    ] as const;
    for (const key of profileKeys) {
      const url = personal_info.profiles[key];
      if (url) {
        contactItems.push(
          <a
            key={key}
            href={getProfileUrl(key, url)}
            target="_blank"
            rel="noopener noreferrer"
            className="modern-contact-item modern-link"
          >
            {getProfileDisplayName(key, url)}
          </a>
        );
      }
    }
  }

  return (
    <header className="modern-header">
      <h1>{personal_info.full_name}</h1>
      {contactItems.length > 0 && (
        <div className="modern-contact">{contactItems}</div>
      )}
    </header>
  );
}

/**
 * Build section content items for pagination
 */
function buildSectionItems(
  data: ResumeData,
  sectionOrder: SectionType[]
): { key: string; content: React.ReactNode }[] {
  const items: { key: string; content: React.ReactNode }[] = [];

  for (const section of sectionOrder) {
    switch (section) {
      case "summary":
        if (data.summary) {
          items.push({
            key: "summary",
            content: (
              <section className="modern-section">
                <h2>Summary</h2>
                <p className="modern-summary-text">{data.summary}</p>
              </section>
            ),
          });
        }
        break;

      case "experience":
        if (data.work_experiences && data.work_experiences.length > 0) {
          items.push({
            key: "experience-title",
            content: (
              <div className="modern-section-title">
                <h2>Work Experience</h2>
              </div>
            ),
          });
          data.work_experiences.forEach((exp, i) => {
            items.push({
              key: `exp-${i}`,
              content: (
                <div className="modern-entry">
                  <div className="modern-entry-header">
                    <div className="modern-entry-title">
                      <h3>{exp.title}</h3>
                      <span className="modern-company">{exp.company}</span>
                    </div>
                    <div className="modern-entry-meta">
                      <span className="modern-date">
                        {formatDateRange(
                          exp.start_date,
                          exp.end_date,
                          exp.is_current
                        )}
                      </span>
                      {exp.location && (
                        <span className="modern-location">{exp.location}</span>
                      )}
                    </div>
                  </div>
                  {exp.highlights &&
                    exp.highlights.filter((h) => h.trim()).length > 0 && (
                      <ul className="modern-highlights">
                        {exp.highlights
                          .filter((h) => h.trim())
                          .map((highlight, j) => (
                            <li key={j}>{renderHighlight(highlight)}</li>
                          ))}
                      </ul>
                    )}
                </div>
              ),
            });
          });
        }
        break;

      case "education":
        if (data.education && data.education.length > 0) {
          items.push({
            key: "education-title",
            content: (
              <div className="modern-section-title">
                <h2>Education</h2>
              </div>
            ),
          });
          data.education.forEach((edu, i) => {
            items.push({
              key: `edu-${i}`,
              content: (
                <div className="modern-entry">
                  <div className="modern-entry-header">
                    <div className="modern-entry-title">
                      <h3>
                        {edu.degree}
                        {edu.field ? ` in ${edu.field}` : ""}
                      </h3>
                      <span className="modern-institution">
                        {edu.institution}
                      </span>
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
                  {edu.highlights &&
                    edu.highlights.filter((h) => h.trim()).length > 0 && (
                      <ul className="modern-highlights">
                        {edu.highlights
                          .filter((h) => h.trim())
                          .map((highlight, j) => (
                            <li key={j}>{renderHighlight(highlight)}</li>
                          ))}
                      </ul>
                    )}
                </div>
              ),
            });
          });
        }
        break;

      case "projects":
        if (data.projects && data.projects.length > 0) {
          items.push({
            key: "projects-title",
            content: (
              <div className="modern-section-title">
                <h2>Projects</h2>
              </div>
            ),
          });
          data.projects.forEach((project, i) => {
            items.push({
              key: `proj-${i}`,
              content: (
                <div className="modern-entry">
                  <div className="modern-entry-header">
                    <div className="modern-entry-title">
                      <h3>
                        {project.url ? (
                          <a
                            href={
                              project.url.startsWith("http")
                                ? project.url
                                : `https://${project.url}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {project.name}
                          </a>
                        ) : (
                          project.name
                        )}
                      </h3>
                      {project.technologies &&
                        project.technologies.filter((t) => t.trim()).length >
                          0 && (
                          <span className="modern-tech-stack">
                            {project.technologies
                              .filter((t) => t.trim())
                              .join(" • ")}
                          </span>
                        )}
                    </div>
                  </div>
                  {project.description && (
                    <p className="modern-description">
                      {renderMarkdown(project.description)}
                    </p>
                  )}
                  {project.highlights &&
                    project.highlights.filter((h) => h.trim()).length > 0 && (
                      <ul className="modern-highlights">
                        {project.highlights
                          .filter((h) => h.trim())
                          .map((highlight, j) => (
                            <li key={j}>{renderHighlight(highlight)}</li>
                          ))}
                      </ul>
                    )}
                </div>
              ),
            });
          });
        }
        break;

      case "skills":
        if (data.skills?.categories && data.skills.categories.length > 0) {
          items.push({
            key: "skills",
            content: (
              <section className="modern-section">
                <h2>Skills</h2>
                <div className="modern-skills">
                  {data.skills.categories.map((category, i) => (
                    <div key={i} className="modern-skill-category">
                      <span className="modern-skill-label">
                        {category.name}
                      </span>
                      <span className="modern-skill-items">
                        {category.items
                          .filter((item) => item.trim())
                          .join(" • ")}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ),
          });
        }
        break;

      case "certifications":
        if (data.certifications && data.certifications.length > 0) {
          items.push({
            key: "certifications",
            content: (
              <section className="modern-section">
                <h2>Certifications</h2>
                <ul className="modern-certifications">
                  {data.certifications.map((cert) => (
                    <li key={cert.id}>
                      <span className="modern-cert-name">{cert.name}</span>
                      {cert.issuer && (
                        <span className="modern-cert-issuer">
                          {" "}
                          – {cert.issuer}
                        </span>
                      )}
                      {cert.date && (
                        <span className="modern-cert-date"> ({cert.date})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ),
          });
        }
        break;

      case "achievements":
        if (
          data.achievements &&
          data.achievements.filter((a) => a.trim()).length > 0
        ) {
          items.push({
            key: "achievements",
            content: (
              <section className="modern-section">
                <h2>Achievements</h2>
                <ul className="modern-highlights">
                  {data.achievements
                    .filter((a) => a.trim())
                    .map((achievement, i) => (
                      <li key={i}>{renderHighlight(achievement)}</li>
                    ))}
                </ul>
              </section>
            ),
          });
        }
        break;
    }
  }

  return items;
}

/**
 * Modern Resume Template Component
 */
export function ModernTemplate({
  data,
  sectionOrder,
  isPrintMode,
}: ResumeTemplateProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<number[][]>([[0]]);

  // Build all content items
  const sectionItems = buildSectionItems(data, sectionOrder);

  // Calculate pages based on content heights
  const calculatePages = useCallback(() => {
    if (!measureRef.current) return;

    const container = measureRef.current;
    const children = Array.from(container.children) as HTMLElement[];

    // Get header height (first element)
    const headerHeight = children[0]?.offsetHeight || 0;

    const newPages: number[][] = [];
    let currentPage: number[] = [];
    let currentHeight = headerHeight;

    // Start from index 1 to skip header
    for (let i = 1; i < children.length; i++) {
      const itemHeight = children[i]?.offsetHeight || 0;

      if (
        currentHeight + itemHeight > CONTENT_HEIGHT_PX &&
        currentPage.length > 0
      ) {
        newPages.push(currentPage);
        currentPage = [i - 1]; // -1 because content items start at index 0
        currentHeight = itemHeight;
      } else {
        currentPage.push(i - 1);
        currentHeight += itemHeight;
      }
    }

    if (currentPage.length > 0) {
      newPages.push(currentPage);
    }

    if (newPages.length === 0) {
      newPages.push([0]);
    }

    setPages(newPages);
  }, [sectionItems.length]);

  // Recalculate on data/section changes
  useEffect(() => {
    ensureFontLoaded();

    // Wait for font to load before calculating
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.load('11pt "Inter"').then(() => {
        const timeoutId = setTimeout(calculatePages, 100);
        return () => clearTimeout(timeoutId);
      });
    } else {
      const timeoutId = setTimeout(calculatePages, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [data, sectionOrder, calculatePages]);

  // Recalculate on resize
  useEffect(() => {
    window.addEventListener("resize", calculatePages);
    return () => window.removeEventListener("resize", calculatePages);
  }, [calculatePages]);

  return (
    <div className={`modern-template ${isPrintMode ? "print-mode" : ""}`}>
      <style>{modernStyles}</style>

      {/* Hidden measurement container */}
      <div ref={measureRef} className="modern-measure-container">
        {buildHeaderContent(data)}
        {sectionItems.map((item) => (
          <div key={item.key}>{item.content}</div>
        ))}
      </div>

      {/* Rendered pages */}
      <div className="modern-pages-container">
        {pages.map((pageItems, pageIndex) => (
          <div key={pageIndex} className="modern-page">
            {!isPrintMode && pages.length > 1 && (
              <div className="modern-page-label">Page {pageIndex + 1}</div>
            )}
            {pageIndex === 0 && buildHeaderContent(data)}
            {pageItems.map((itemIndex) => {
              const item = sectionItems[itemIndex];
              return item ? <div key={item.key}>{item.content}</div> : null;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * CSS styles for the Modern Template
 */
const modernStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  .modern-template {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 10pt;
    line-height: 1.5;
    color: #1a1a1a;
    background: transparent;
  }

  /* Hidden measurement container */
  .modern-measure-container {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    width: ${PAGE_WIDTH_PX - PAGE_PADDING_PX * 2}px;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 10pt;
    line-height: 1.5;
  }

  .modern-pages-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .modern-page {
    width: ${PAGE_WIDTH_PX}px;
    min-height: ${PAGE_HEIGHT_PX}px;
    padding: ${PAGE_PADDING_PX}px;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    position: relative;
    box-sizing: border-box;
  }

  .modern-page-label {
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 9px;
    color: #9ca3af;
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .modern-header {
    margin-bottom: 1.25em;
    padding-bottom: 0.75em;
    border-bottom: 2px solid #2563eb;
    text-align: center;
  }

  .modern-header h1 {
    font-size: 22pt;
    font-weight: 700;
    margin: 0 0 0.5em 0;
    color: #1a1a1a;
    letter-spacing: -0.01em;
  }

  .modern-contact {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 0.4em 0;
    font-size: 9pt;
    color: #4b5563;
    line-height: 1.6;
  }

  .modern-contact-item {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
  }

  .modern-contact-item:not(:last-child)::after {
    content: "•";
    margin: 0 0.5em;
    color: #9ca3af;
    font-weight: 400;
  }

  .modern-link {
    color: #2563eb;
    text-decoration: none;
  }

  .modern-link:hover {
    text-decoration: underline;
  }

  .modern-section {
    margin-bottom: 0.75em;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .modern-section-title {
    margin-bottom: 0.5em;
  }

  .modern-section h2,
  .modern-section-title h2 {
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
    page-break-inside: avoid;
    break-inside: avoid;
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
    margin: 0.25em 0 0 0;
    padding: 0 0 0 1.25em;
    color: #374151;
    list-style-type: disc;
    list-style-position: outside;
  }

  .modern-highlights li {
    margin-bottom: 0.15em;
    font-size: 9.5pt;
    page-break-inside: avoid;
    break-inside: avoid;
    padding-left: 0.25em;
    display: list-item;
  }

  .modern-highlights li::marker {
    color: #6b7280;
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
    list-style-type: disc;
    list-style-position: outside;
    margin: 0;
    padding: 0 0 0 1.25em;
  }

  .modern-certifications li {
    display: list-item;
    margin-bottom: 0.25em;
    font-size: 9.5pt;
    padding-left: 0.25em;
  }

  .modern-certifications li::marker {
    color: #6b7280;
  }

  .modern-cert-name {
    font-weight: 500;
    color: #1a1a1a;
  }

  .modern-cert-issuer {
    color: #4b5563;
  }

  .modern-cert-date {
    color: #6b7280;
  }

  /* Print styles */
  @media print {
    @page {
      size: letter;
      margin: 0 !important;
    }

    .modern-template {
      background: transparent;
    }

    .modern-measure-container {
      display: none !important;
    }

    .modern-pages-container {
      gap: 0;
    }

    .modern-page {
      width: 8.5in !important;
      height: 11in !important;
      min-height: 11in !important;
      padding: 0.5in !important;
      box-shadow: none;
      page-break-after: always;
      break-after: page;
    }

    .modern-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .modern-page-label {
      display: none !important;
    }

    .modern-header {
      border-bottom-color: #000;
    }

    .modern-section h2,
    .modern-section-title h2 {
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
