/**
 * Jake's Resume Template
 *
 * A classic ATS-friendly resume template inspired by Jake Ryan's design.
 * Features EB Garamond font, clean layout, and proper multi-page support
 * with visual page separation in preview mode.
 *
 * _Requirements: 4.1, 7.1, 7.2, 7.3, 7.4_
 */

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import type { ResumeTemplateProps } from "./types";
import type { ResumeData, SectionType } from "@/types/resume";
import { registerTemplate } from "./registry";

// Page dimensions in pixels (96 DPI) - Letter size
const PAGE_WIDTH_PX = 8.5 * 96;
const PAGE_HEIGHT_PX = 11 * 96;
const PAGE_PADDING_PX = 0.5 * 96;
const CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - PAGE_PADDING_PX * 2;

interface PageContent {
  startIndex: number;
  endIndex: number;
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
    return `${months[date.month - 1]}. ${date.year}`;
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
 * Extract domain from URL for display
 */
function extractDomain(url: string): string {
  try {
    const domain = new URL(
      url.startsWith("http") ? url : `https://${url}`
    ).hostname;
    return domain.replace("www.", "");
  } catch {
    return url;
  }
}

/**
 * Strip bullet prefix from highlight text
 * Removes leading -, *, / and whitespace
 */
function stripBulletPrefix(text: string): string {
  return text.replace(/^[-*/]\s*/, "").trim();
}

/**
 * Get display text for a project link
 * If GitHub URL, return "GitHub", otherwise return titlecase domain
 */
function getProjectLinkText(url: string): string {
  try {
    const fullUrl = url.startsWith("http") ? url : `https://${url}`;
    const hostname = new URL(fullUrl).hostname.toLowerCase().replace("www.", "");
    
    if (hostname.includes("github.com")) {
      return "GitHub";
    }
    
    // Extract root domain and title case it
    const parts = hostname.split(".");
    const rootDomain = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    return rootDomain.charAt(0).toUpperCase() + rootDomain.slice(1);
  } catch {
    return "Link";
  }
}

/**
 * Load Computer Modern Serif font via link element
 */
function ensureFontLoaded(): void {
  if (typeof document === "undefined") return;
  
  const fontId = "jake-template-cm-serif-font";
  if (document.getElementById(fontId)) return;
  
  const style = document.createElement("style");
  style.id = fontId;
  style.textContent = `@import url('https://cdn.jsdelivr.net/gh/aaaakshat/cm-web-fonts@latest/fonts.css');`;
  document.head.appendChild(style);
}

/**
 * Jake's template styles - embedded for self-contained rendering
 * Font is loaded via style element in ensureFontLoaded()
 */
const jakeStyles = `
  .jake-template {
    font-family: "Computer Modern Serif", "Times New Roman", Georgia, serif;
    font-size: 11pt;
    line-height: 1.4;
    color: #000;
    background: transparent;
  }

  .jake-template * {
    box-sizing: border-box;
  }

  .jake-pages-container {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .jake-pages-container.print-mode {
    gap: 0;
  }

  .jake-page-wrapper {
    position: relative;
  }

  .jake-page-label {
    position: absolute;
    top: -24px;
    left: 0;
    font-size: 12px;
    color: #6b7280;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .jake-page {
    width: ${PAGE_WIDTH_PX}px;
    height: ${PAGE_HEIGHT_PX}px;
    padding: ${PAGE_PADDING_PX}px;
    background: white;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    box-sizing: border-box;
  }

  .jake-page.print-mode {
    box-shadow: none;
    height: auto;
    min-height: ${PAGE_HEIGHT_PX}px;
  }

  .jake-header {
    text-align: center;
    margin-bottom: 12px;
  }

  .jake-header h1 {
    font-size: 24pt;
    font-weight: bold;
    letter-spacing: 0;
    text-transform: uppercase;
    margin: 0;
  }

  .jake-contact {
    font-size: 10pt;
    margin-top: 4px;
  }

  .jake-contact a {
    text-decoration: underline;
    color: black;
  }

  .jake-contact a:hover {
    color: #333;
  }

  .jake-section {
    margin-bottom: 12px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .jake-section-title {
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0;
    border-bottom: 1px solid black;
    padding-bottom: 2px;
    margin: 0 0 8px 0;
    page-break-after: avoid;
    break-after: avoid;
  }

  .jake-entry {
    margin-bottom: 12px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .jake-entry:last-child {
    margin-bottom: 0;
  }

  .jake-entry-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .jake-entry-title {
    font-weight: bold;
    margin: 0;
    font-size: 11pt;
  }

  .jake-entry-date {
    font-size: 10pt;
  }

  .jake-entry-subheader {
    display: flex;
    justify-content: space-between;
    font-style: italic;
    font-size: 10pt;
  }

  .jake-entry-bullets {
    list-style-type: disc;
    margin: 4px 0 0 16px;
    padding-left: 0;
    font-size: 10pt;
  }

  .jake-entry-bullets li {
    margin-left: 16px;
    margin-bottom: 1px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .jake-project-title {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  .jake-project-tech {
    font-style: italic;
    font-size: 10pt;
    font-weight: normal;
  }

  .jake-project-link {
    font-size: 10pt;
    text-decoration: underline;
    color: black;
  }

  .jake-project-link:hover {
    color: #333;
  }

  .jake-skills {
    font-size: 10pt;
  }

  .jake-skill-row {
    margin: 2px 0;
  }

  .jake-skill-category {
    font-weight: bold;
  }

  /* Hidden measurement container */
  .jake-measure-container {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    width: ${PAGE_WIDTH_PX - PAGE_PADDING_PX * 2}px;
    font-family: "Computer Modern Serif", "Times New Roman", serif;
    font-size: 11pt;
    line-height: 1.4;
  }

  /* Print styles - critical for proper PDF export */
  @media print {
    @page {
      size: letter;
      margin: 0 !important;
    }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      background: white !important;
    }

    /* Hide page labels during print */
    .jake-page-label {
      display: none !important;
    }

    /* Hide measurement container during print */
    .jake-measure-container {
      display: none !important;
    }
    
    /* Remove gap between pages during print */
    .jake-pages-container {
      gap: 0 !important;
    }

    /* Page styling for print */
    .jake-page {
      width: 8.5in !important;
      height: 11in !important;
      padding: 0.5in !important;
      box-shadow: none !important;
      page-break-after: always;
      break-after: page;
      overflow: visible !important;
    }

    .jake-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    /* Remove link underlines in print */
    .jake-contact a,
    .jake-project-link {
      text-decoration: none !important;
    }

    /* Prevent breaking inside entries */
    .jake-entry {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    .jake-section {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    .jake-entry-bullets li {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* Keep section titles with their content */
    .jake-section-title {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
  }
`;

/**
 * Section component for consistent styling
 */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="jake-section">
      <h2 className="jake-section-title">{title}</h2>
      {children}
    </div>
  );
}

/**
 * Build header section
 */
function buildHeaderSection(data: ResumeData): React.ReactNode {
  const { personal_info } = data;
  const contactParts: React.ReactNode[] = [];

  if (personal_info.phone) {
    contactParts.push(<span key="phone">{personal_info.phone}</span>);
  }

  if (personal_info.email) {
    contactParts.push(
      <span key="email">
        <a href={`mailto:${personal_info.email}`}>{personal_info.email}</a>
      </span>
    );
  }

  if (personal_info.linkedin_url) {
    const displayUrl = extractDomain(personal_info.linkedin_url);
    contactParts.push(
      <span key="linkedin">
        <a
          href={
            personal_info.linkedin_url.startsWith("http")
              ? personal_info.linkedin_url
              : `https://${personal_info.linkedin_url}`
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          {displayUrl}
        </a>
      </span>
    );
  }

  if (personal_info.github_url) {
    const displayUrl = extractDomain(personal_info.github_url);
    contactParts.push(
      <span key="github">
        <a
          href={
            personal_info.github_url.startsWith("http")
              ? personal_info.github_url
              : `https://${personal_info.github_url}`
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          {displayUrl}
        </a>
      </span>
    );
  }

  if (personal_info.website_url) {
    const displayUrl = extractDomain(personal_info.website_url);
    contactParts.push(
      <span key="website">
        <a
          href={
            personal_info.website_url.startsWith("http")
              ? personal_info.website_url
              : `https://${personal_info.website_url}`
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          {displayUrl}
        </a>
      </span>
    );
  }

  return (
    <div key="header" className="jake-header">
      <h1>{personal_info.full_name}</h1>
      {contactParts.length > 0 && (
        <p className="jake-contact">
          {contactParts.map((part, i) => (
            <React.Fragment key={i}>
              {part}
              {i < contactParts.length - 1 && " | "}
            </React.Fragment>
          ))}
        </p>
      )}
    </div>
  );
}

/**
 * Build education section
 */
function buildEducationSection(data: ResumeData): React.ReactNode | null {
  if (!data.education || data.education.length === 0) return null;

  return (
    <Section key="education" title="Education">
      {data.education.map((edu) => (
        <div key={edu.id} style={{ marginBottom: "4px" }}>
          <div className="jake-entry-header">
            <span style={{ fontWeight: "bold" }}>{edu.institution}</span>
            <span>{edu.location || ""}</span>
          </div>
          <div className="jake-entry-subheader">
            <span>
              {edu.degree}
              {edu.field ? ` in ${edu.field}` : ""}
              {edu.gpa ? `, GPA: ${edu.gpa}` : ""}
            </span>
            <span>{formatDateRange(edu.start_date, edu.end_date)}</span>
          </div>
          {edu.highlights && edu.highlights.filter(h => h.trim()).length > 0 && (
            <ul className="jake-entry-bullets">
              {edu.highlights.filter(h => h.trim()).map((highlight, i) => (
                <li key={i}>{stripBulletPrefix(highlight)}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </Section>
  );
}

/**
 * Build experience section title
 */
function buildExperienceTitleSection(): React.ReactNode {
  return (
    <div key="experience-title" style={{ marginBottom: "4px" }}>
      <h2 className="jake-section-title">Experience</h2>
    </div>
  );
}

/**
 * Build individual experience entries
 */
function buildExperienceEntries(
  data: ResumeData
): { key: string; content: React.ReactNode }[] {
  if (!data.work_experiences || data.work_experiences.length === 0) return [];

  return data.work_experiences.map((exp, i) => ({
    key: `exp-${i}`,
    content: (
      <div key={`exp-${i}`} className="jake-entry">
        <div className="jake-entry-header">
          <span className="jake-entry-title">{exp.title}</span>
          <span className="jake-entry-date">
            {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
          </span>
        </div>
        <div className="jake-entry-subheader">
          <span>{exp.company}</span>
          <span>{exp.location || ""}</span>
        </div>
        {exp.highlights && exp.highlights.filter(h => h.trim()).length > 0 && (
          <ul className="jake-entry-bullets">
            {exp.highlights.filter(h => h.trim()).map((bullet, j) => (
              <li key={j}>{stripBulletPrefix(bullet)}</li>
            ))}
          </ul>
        )}
      </div>
    ),
  }));
}

/**
 * Build projects section title
 */
function buildProjectsTitleSection(): React.ReactNode {
  return (
    <div key="projects-title" style={{ marginBottom: "4px" }}>
      <h2 className="jake-section-title">Projects</h2>
    </div>
  );
}

/**
 * Build individual project entries
 */
function buildProjectEntries(
  data: ResumeData
): { key: string; content: React.ReactNode }[] {
  if (!data.projects || data.projects.length === 0) return [];

  return data.projects.map((proj, i) => ({
    key: `proj-${i}`,
    content: (
      <div key={`proj-${i}`} className="jake-entry">
        <div className="jake-entry-header">
          <span className="jake-project-title">
            <span className="jake-entry-title">{proj.name}</span>
            {proj.technologies && proj.technologies.length > 0 && (
              <span className="jake-project-tech">
                {" "}
                | {proj.technologies.join(", ")}
              </span>
            )}
          </span>
          {/* Project link on the right - GitHub or domain name */}
          {proj.url && (
            <a
              href={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="jake-project-link"
            >
              {getProjectLinkText(proj.url)}
            </a>
          )}
        </div>
        {proj.description && (
          <div style={{ fontSize: "10pt", marginTop: "2px" }}>
            {proj.description}
          </div>
        )}
        {proj.highlights && proj.highlights.filter(h => h.trim()).length > 0 && (
          <ul className="jake-entry-bullets">
            {proj.highlights.filter(h => h.trim()).map((bullet, j) => (
              <li key={j}>{stripBulletPrefix(bullet)}</li>
            ))}
          </ul>
        )}
      </div>
    ),
  }));
}

/**
 * Build skills section
 */
function buildSkillsSection(data: ResumeData): React.ReactNode | null {
  if (
    !data.skills ||
    !data.skills.categories ||
    data.skills.categories.length === 0
  )
    return null;

  return (
    <Section key="skills" title="Technical Skills">
      <div className="jake-skills">
        {data.skills.categories.map((category, i) => (
          <p key={i} className="jake-skill-row">
            <span className="jake-skill-category">{category.name}:</span>{" "}
            {category.items.join(", ")}
          </p>
        ))}
      </div>
    </Section>
  );
}

/**
 * Build summary section
 */
function buildSummarySection(data: ResumeData): React.ReactNode | null {
  if (!data.summary) return null;

  return (
    <Section key="summary" title="Summary">
      <p style={{ margin: 0, fontSize: "10pt" }}>{data.summary}</p>
    </Section>
  );
}

/**
 * Build certifications section
 */
function buildCertificationsSection(data: ResumeData): React.ReactNode | null {
  if (!data.certifications || data.certifications.length === 0) return null;

  return (
    <Section key="certifications" title="Certifications">
      <ul className="jake-entry-bullets">
        {data.certifications.map((cert) => (
          <li key={cert.id}>
            <strong>{cert.name}</strong>
            {cert.issuer && <span> - {cert.issuer}</span>}
            {cert.date && <span> ({cert.date})</span>}
          </li>
        ))}
      </ul>
    </Section>
  );
}

/**
 * Build all sections based on section order
 */
function buildSections(
  data: ResumeData,
  sectionOrder: SectionType[]
): React.ReactNode[] {
  const sections: React.ReactNode[] = [];

  // Always start with header
  sections.push(buildHeaderSection(data));

  // Process sections based on order
  for (const sectionType of sectionOrder) {
    switch (sectionType) {
      case "summary":
        const summary = buildSummarySection(data);
        if (summary) sections.push(summary);
        break;

      case "education":
        const education = buildEducationSection(data);
        if (education) sections.push(education);
        break;

      case "experience":
        if (data.work_experiences && data.work_experiences.length > 0) {
          sections.push(buildExperienceTitleSection());
          const expEntries = buildExperienceEntries(data);
          expEntries.forEach((entry) => sections.push(entry.content));
        }
        break;

      case "projects":
        if (data.projects && data.projects.length > 0) {
          sections.push(buildProjectsTitleSection());
          const projEntries = buildProjectEntries(data);
          projEntries.forEach((entry) => sections.push(entry.content));
        }
        break;

      case "skills":
        const skills = buildSkillsSection(data);
        if (skills) sections.push(skills);
        break;

      case "certifications":
        const certs = buildCertificationsSection(data);
        if (certs) sections.push(certs);
        break;
    }
  }

  return sections;
}

/**
 * Jake's Resume Template Component
 *
 * Features proper multi-page support with visual page separation.
 * Each page is rendered as a separate visual element.
 */
export function JakeTemplate({
  data,
  sectionOrder,
  isPrintMode,
}: ResumeTemplateProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PageContent[]>([
    { startIndex: 0, endIndex: -1 },
  ]);
  const [fontLoaded, setFontLoaded] = useState(false);

  // Load the EB Garamond font
  useEffect(() => {
    ensureFontLoaded();
    
    // Wait for font to load, then trigger recalculation
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(() => {
        setFontLoaded(true);
      });
    } else {
      // Fallback for browsers without font loading API
      setTimeout(() => setFontLoaded(true), 500);
    }
  }, []);

  const calculatePages = useCallback(() => {
    if (!measureRef.current) return;

    const sections = measureRef.current.querySelectorAll("[data-section]");
    const sectionHeights: number[] = [];

    sections.forEach((section) => {
      sectionHeights.push((section as HTMLElement).offsetHeight);
    });

    const newPages: PageContent[] = [];
    let currentPageHeight = 0;
    let currentPageStart = 0;

    sectionHeights.forEach((height, index) => {
      // Check if adding this section would exceed the content height
      if (currentPageHeight + height > CONTENT_HEIGHT_PX && currentPageHeight > 0) {
        // Save current page and start a new one
        newPages.push({ startIndex: currentPageStart, endIndex: index - 1 });
        currentPageStart = index;
        currentPageHeight = height;
      } else {
        currentPageHeight += height;
      }
    });

    // Don't forget the last page
    newPages.push({
      startIndex: currentPageStart,
      endIndex: sectionHeights.length - 1,
    });

    setPages(newPages);
  }, []);

  // Calculate pages when font is loaded
  useEffect(() => {
    if (!fontLoaded) return;
    
    // Multiple calculation passes to ensure accuracy after font renders
    const timeouts = [
      setTimeout(calculatePages, 50),
      setTimeout(calculatePages, 150),
      setTimeout(calculatePages, 300),
    ];

    return () => timeouts.forEach(clearTimeout);
  }, [fontLoaded, calculatePages]);

  // Recalculate when data changes
  useEffect(() => {
    if (!fontLoaded) return;
    
    // Delay to allow DOM to update
    const timeoutId = setTimeout(calculatePages, 100);
    return () => clearTimeout(timeoutId);
  }, [data, sectionOrder, fontLoaded, calculatePages]);

  // Recalculate on resize
  useEffect(() => {
    window.addEventListener("resize", calculatePages);
    return () => window.removeEventListener("resize", calculatePages);
  }, [calculatePages]);

  const allSections = buildSections(data, sectionOrder);

  return (
    <div className={`jake-template ${isPrintMode ? "print-mode" : ""}`}>
      <style>{jakeStyles}</style>

      {/* Hidden measurement container */}
      <div ref={measureRef} className="jake-measure-container">
        {allSections.map((section, i) => (
          <div key={i} data-section>
            {section}
          </div>
        ))}
      </div>

      {/* Rendered pages */}
      <div className={`jake-pages-container ${isPrintMode ? "print-mode" : ""}`}>
        {pages.map((page, pageIndex) => (
          <div key={pageIndex} className="jake-page-wrapper">
            {!isPrintMode && pages.length > 1 && (
              <div className="jake-page-label">
                Page {pageIndex + 1} of {pages.length}
              </div>
            )}
            <div className={`jake-page ${isPrintMode ? "print-mode" : ""}`}>
              {allSections.slice(page.startIndex, page.endIndex + 1)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Register the template
registerTemplate({
  id: "jake",
  name: "Jake's Template",
  description:
    "Classic ATS-friendly resume with EB Garamond font, clean layout, and proper page breaks",
  thumbnail: "/templates/jake-thumb.png",
  component: JakeTemplate,
});

export default JakeTemplate;

