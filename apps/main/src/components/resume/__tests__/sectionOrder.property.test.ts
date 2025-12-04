/**
 * Property-Based Tests for Section Ordering
 *
 * **Feature: linkedin-github-resume-builder, Property 6: Section Order Determines Render Order**
 * **Validates: Requirements 8.2, 8.3**
 *
 * Tests that the rendered HTML sections appear in the same order as specified
 * in the section_order array.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import type { ResumeData, SectionType } from "@/types/resume";
import { DEFAULT_SECTION_ORDER } from "@/types/resume";
import type { ResumeTemplateProps } from "../templates/types";
import { ClassicTemplate } from "../templates/ClassicTemplate";
import { ModernTemplate } from "../templates/ModernTemplate";
import { MinimalTemplate } from "../templates/MinimalTemplate";

// Arbitraries for generating test data
const dateInfoArb = fc.record({
  month: fc.option(fc.integer({ min: 1, max: 12 }), { nil: null }),
  year: fc.option(fc.integer({ min: 1900, max: 2100 }), { nil: null }),
});

const personalInfoArb = fc.record({
  full_name: fc
    .stringMatching(/^[a-zA-Z][a-zA-Z ]{1,49}$/)
    .filter((s) => s.trim().length >= 2),
  email: fc.option(fc.emailAddress(), { nil: null }),
  phone: fc.option(fc.string({ minLength: 5, maxLength: 20 }), { nil: null }),
  location: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
    nil: null,
  }),
  linkedin_url: fc.option(fc.webUrl(), { nil: null }),
  github_url: fc.option(fc.webUrl(), { nil: null }),
  website_url: fc.option(fc.webUrl(), { nil: null }),
});

const workExperienceArb = fc.record({
  id: fc.uuid(),
  company: fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{1,49}$/),
  title: fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{1,49}$/),
  location: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
    nil: null,
  }),
  start_date: dateInfoArb,
  end_date: fc.option(dateInfoArb, { nil: null }),
  is_current: fc.boolean(),
  highlights: fc.array(fc.string({ minLength: 5, maxLength: 100 }), {
    minLength: 1,
    maxLength: 2,
  }),
});

const educationArb = fc.record({
  id: fc.uuid(),
  institution: fc
    .string({ minLength: 2, maxLength: 50 })
    .filter((s) => /^[a-zA-Z]/.test(s)),
  degree: fc
    .string({ minLength: 2, maxLength: 50 })
    .filter((s) => /^[a-zA-Z]/.test(s)),
  field: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  location: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
    nil: null,
  }),
  start_date: dateInfoArb,
  end_date: fc.option(dateInfoArb, { nil: null }),
  gpa: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: null }),
  highlights: fc.array(fc.string({ minLength: 5, maxLength: 100 }), {
    minLength: 0,
    maxLength: 2,
  }),
});

const projectArb = fc.record({
  id: fc.uuid(),
  name: fc
    .string({ minLength: 2, maxLength: 50 })
    .filter((s) => /^[a-zA-Z]/.test(s)),
  description: fc.option(fc.string({ minLength: 5, maxLength: 200 }), {
    nil: null,
  }),
  technologies: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
    minLength: 1,
    maxLength: 3,
  }),
  url: fc.option(fc.webUrl(), { nil: null }),
  highlights: fc.array(fc.string({ minLength: 5, maxLength: 100 }), {
    minLength: 0,
    maxLength: 2,
  }),
});

const skillCategoryArb = fc.record({
  name: fc
    .string({ minLength: 2, maxLength: 30 })
    .filter((s) => /^[a-zA-Z]/.test(s)),
  items: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
    minLength: 1,
    maxLength: 5,
  }),
});

const skillsArb = fc.record({
  categories: fc.array(skillCategoryArb, { minLength: 1, maxLength: 2 }),
});

const certificationArb = fc.record({
  id: fc.uuid(),
  name: fc
    .string({ minLength: 2, maxLength: 50 })
    .filter((s) => /^[a-zA-Z]/.test(s)),
  issuer: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  date: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
});

/**
 * Generate a shuffled section order to test different orderings
 */
const sectionOrderArb: fc.Arbitrary<SectionType[]> = fc.shuffledSubarray(
  DEFAULT_SECTION_ORDER,
  {
    minLength: DEFAULT_SECTION_ORDER.length,
    maxLength: DEFAULT_SECTION_ORDER.length,
  }
);

/**
 * Generate resume data with all sections populated to ensure they render
 */
const resumeDataWithAllSectionsArb: fc.Arbitrary<ResumeData> = fc.record({
  id: fc.uuid().map((id) => `resume_${id}`),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  template_id: fc.constantFrom("classic", "modern", "minimal"),
  section_order: fc.constant(DEFAULT_SECTION_ORDER),
  personal_info: personalInfoArb,
  summary: fc.string({ minLength: 10, maxLength: 200 }), // Always have summary
  work_experiences: fc.array(workExperienceArb, { minLength: 1, maxLength: 2 }),
  education: fc.array(educationArb, { minLength: 1, maxLength: 2 }),
  projects: fc.array(projectArb, { minLength: 1, maxLength: 2 }),
  skills: skillsArb,
  certifications: fc.array(certificationArb, { minLength: 1, maxLength: 2 }),
  created_at: fc.constant("2024-01-01T00:00:00.000Z"),
  updated_at: fc.constant("2024-01-01T00:00:00.000Z"),
});

/**
 * Map section types to their expected h2 heading text patterns
 */
const SECTION_HEADING_PATTERNS: Record<SectionType, RegExp> = {
  summary: /summary/i,
  experience: /experience/i,
  education: /education/i,
  projects: /projects/i,
  skills: /skills/i,
  certifications: /certifications/i,
};

/**
 * Extract section heading positions from rendered HTML
 */
function extractSectionPositions(html: string): Map<SectionType, number> {
  const positions = new Map<SectionType, number>();

  for (const [section, pattern] of Object.entries(SECTION_HEADING_PATTERNS)) {
    // Find h2 elements and check if they match the section pattern
    const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
    let match;
    while ((match = h2Regex.exec(html)) !== null) {
      if (pattern.test(match[1])) {
        positions.set(section as SectionType, match.index);
        break;
      }
    }
  }

  return positions;
}

/**
 * Render a template with given data and section order
 */
function renderTemplate(
  Template: React.ComponentType<ResumeTemplateProps>,
  data: ResumeData,
  sectionOrder: SectionType[]
): string {
  const element = createElement(Template, {
    data,
    sectionOrder,
    isPrintMode: false,
  });
  return renderToString(element);
}

describe("Property 6: Section Order Determines Render Order", () => {
  /**
   * **Feature: linkedin-github-resume-builder, Property 6: Section Order Determines Render Order**
   * **Validates: Requirements 8.2, 8.3**
   */

  const templates = [
    { name: "Classic", component: ClassicTemplate },
    { name: "Modern", component: ModernTemplate },
    { name: "Minimal", component: MinimalTemplate },
  ];

  templates.forEach(({ name, component }) => {
    describe(`${name} Template`, () => {
      it("should render sections in the order specified by sectionOrder", () => {
        fc.assert(
          fc.property(
            resumeDataWithAllSectionsArb,
            sectionOrderArb,
            (data, sectionOrder) => {
              const html = renderTemplate(component, data, sectionOrder);
              const positions = extractSectionPositions(html);

              // Get sections that are actually rendered (have content)
              const renderedSections = sectionOrder.filter((section) =>
                positions.has(section)
              );

              // Verify that rendered sections appear in the correct order
              for (let i = 0; i < renderedSections.length - 1; i++) {
                const currentSection = renderedSections[i];
                const nextSection = renderedSections[i + 1];
                const currentPos = positions.get(currentSection)!;
                const nextPos = positions.get(nextSection)!;

                expect(currentPos).toBeLessThan(nextPos);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it("should maintain relative order when sections are reordered", () => {
        fc.assert(
          fc.property(resumeDataWithAllSectionsArb, (data) => {
            // Test with reversed section order
            const reversedOrder = [
              ...DEFAULT_SECTION_ORDER,
            ].reverse() as SectionType[];
            const html = renderTemplate(component, data, reversedOrder);
            const positions = extractSectionPositions(html);

            // Get sections that are actually rendered
            const renderedSections = reversedOrder.filter((section) =>
              positions.has(section)
            );

            // Verify order matches reversed order
            for (let i = 0; i < renderedSections.length - 1; i++) {
              const currentSection = renderedSections[i];
              const nextSection = renderedSections[i + 1];
              const currentPos = positions.get(currentSection)!;
              const nextPos = positions.get(nextSection)!;

              expect(currentPos).toBeLessThan(nextPos);
            }
          }),
          { numRuns: 100 }
        );
      });
    });
  });

  it("should render experience before education when experience comes first in order", () => {
    fc.assert(
      fc.property(resumeDataWithAllSectionsArb, (data) => {
        const orderWithExperienceFirst: SectionType[] = [
          "summary",
          "experience",
          "education",
          "projects",
          "skills",
          "certifications",
        ];

        templates.forEach(({ component }) => {
          const html = renderTemplate(
            component,
            data,
            orderWithExperienceFirst
          );
          const positions = extractSectionPositions(html);

          const expPos = positions.get("experience");
          const eduPos = positions.get("education");

          if (expPos !== undefined && eduPos !== undefined) {
            expect(expPos).toBeLessThan(eduPos);
          }
        });
      }),
      { numRuns: 100 }
    );
  });

  it("should render education before experience when education comes first in order", () => {
    fc.assert(
      fc.property(resumeDataWithAllSectionsArb, (data) => {
        const orderWithEducationFirst: SectionType[] = [
          "summary",
          "education",
          "experience",
          "projects",
          "skills",
          "certifications",
        ];

        templates.forEach(({ component }) => {
          const html = renderTemplate(component, data, orderWithEducationFirst);
          const positions = extractSectionPositions(html);

          const expPos = positions.get("experience");
          const eduPos = positions.get("education");

          if (expPos !== undefined && eduPos !== undefined) {
            expect(eduPos).toBeLessThan(expPos);
          }
        });
      }),
      { numRuns: 100 }
    );
  });
});
