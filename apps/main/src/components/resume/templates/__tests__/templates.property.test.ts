/**
 * Property-Based Tests for Resume Templates
 *
 * Feature: linkedin-github-resume-builder
 * Property 7: ATS-Friendly HTML Structure - Validates: Requirements 7.1, 7.2
 * Property 8: All Template Content is Selectable Text - Validates: Requirements 7.3
 * Property 9: Standard Section Headings - Validates: Requirements 7.4
 * Property 13: Registered Templates Appear in Selector - Validates: Requirements 9.3
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import type { ResumeData } from "@/types/resume";
import { DEFAULT_SECTION_ORDER } from "@/types/resume";
import type { ResumeTemplateProps } from "../types";
import { TemplateRegistry } from "../registry";
import { ClassicTemplate } from "../ClassicTemplate";
import { ModernTemplate } from "../ModernTemplate";
import { MinimalTemplate } from "../MinimalTemplate";

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
  profiles: fc.record({
    linkedin: fc.option(fc.webUrl(), { nil: null }),
    github: fc.option(fc.webUrl(), { nil: null }),
    leetcode: fc.option(fc.webUrl(), { nil: null }),
    codeforces: fc.option(fc.webUrl(), { nil: null }),
    codechef: fc.option(fc.webUrl(), { nil: null }),
    website: fc.option(fc.webUrl(), { nil: null }),
  }),
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
    minLength: 0,
    maxLength: 3,
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
    minLength: 0,
    maxLength: 5,
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
  categories: fc.array(skillCategoryArb, { minLength: 0, maxLength: 3 }),
});

const certificationArb = fc.record({
  id: fc.uuid(),
  name: fc
    .string({ minLength: 2, maxLength: 50 })
    .filter((s) => /^[a-zA-Z]/.test(s)),
  issuer: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  date: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
});

const resumeDataArb: fc.Arbitrary<ResumeData> = fc.record({
  id: fc.uuid().map((id) => `resume_${id}`),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  template_id: fc.constantFrom("modern", "jake"),
  section_order: fc.constant(DEFAULT_SECTION_ORDER),
  personal_info: personalInfoArb,
  summary: fc.option(fc.string({ minLength: 10, maxLength: 200 }), {
    nil: null,
  }),
  work_experiences: fc.array(workExperienceArb, { minLength: 0, maxLength: 2 }),
  education: fc.array(educationArb, { minLength: 0, maxLength: 2 }),
  projects: fc.array(projectArb, { minLength: 0, maxLength: 2 }),
  skills: skillsArb,
  certifications: fc.array(certificationArb, { minLength: 0, maxLength: 2 }),
  achievements: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { minLength: 0, maxLength: 3 }),
  created_at: fc.constant("2024-01-01T00:00:00.000Z"),
  updated_at: fc.constant("2024-01-01T00:00:00.000Z"),
});

function renderTemplate(
  Template: React.ComponentType<ResumeTemplateProps>,
  data: ResumeData
): string {
  const element = createElement(Template, {
    data,
    sectionOrder: data.section_order,
    isPrintMode: false,
  });
  return renderToString(element);
}

describe("Resume Template Property Tests", () => {
  describe("Property 7: ATS-Friendly HTML Structure", () => {
    it("Classic Template should have exactly one h1 element", () => {
      fc.assert(
        fc.property(resumeDataArb, (data) => {
          const html = renderTemplate(ClassicTemplate, data);
          expect(html).toContain("classic-template");
          const h1Matches = html.match(/<h1[^>]*>/g) || [];
          expect(h1Matches.length).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it("Modern Template should have exactly one h1 element", () => {
      fc.assert(
        fc.property(resumeDataArb, (data) => {
          const html = renderTemplate(ModernTemplate, data);
          expect(html).toContain("modern-template");
          const h1Matches = html.match(/<h1[^>]*>/g) || [];
          expect(h1Matches.length).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it("Minimal Template should have exactly one h1 element", () => {
      fc.assert(
        fc.property(resumeDataArb, (data) => {
          const html = renderTemplate(MinimalTemplate, data);
          expect(html).toContain("minimal-template");
          const h1Matches = html.match(/<h1[^>]*>/g) || [];
          expect(h1Matches.length).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it("Templates should NOT use table elements for layout", () => {
      fc.assert(
        fc.property(resumeDataArb, (data) => {
          [ClassicTemplate, ModernTemplate, MinimalTemplate].forEach(
            (Template) => {
              const html = renderTemplate(Template, data);
              expect(html).not.toMatch(/<table[^>]*>/i);
              expect(html).not.toMatch(/<tr[^>]*>/i);
              expect(html).not.toMatch(/<td[^>]*>/i);
            }
          );
        }),
        { numRuns: 100 }
      );
    });

    it("Templates should have h1 before h2 in heading hierarchy", () => {
      fc.assert(
        fc.property(resumeDataArb, (data) => {
          [ClassicTemplate, ModernTemplate, MinimalTemplate].forEach(
            (Template) => {
              const html = renderTemplate(Template, data);
              const h1Index = html.indexOf("<h1");
              const h2Index = html.indexOf("<h2");
              if (h1Index !== -1 && h2Index !== -1) {
                expect(h1Index).toBeLessThan(h2Index);
              }
            }
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 8: All Template Content is Selectable Text", () => {
    it("Templates should NOT use img elements", () => {
      fc.assert(
        fc.property(resumeDataArb, (data) => {
          [ClassicTemplate, ModernTemplate, MinimalTemplate].forEach(
            (Template) => {
              const html = renderTemplate(Template, data);
              expect(html).not.toMatch(/<img[^>]*>/i);
            }
          );
        }),
        { numRuns: 100 }
      );
    });

    it("Templates should NOT use canvas elements", () => {
      fc.assert(
        fc.property(resumeDataArb, (data) => {
          [ClassicTemplate, ModernTemplate, MinimalTemplate].forEach(
            (Template) => {
              const html = renderTemplate(Template, data);
              expect(html).not.toMatch(/<canvas[^>]*>/i);
            }
          );
        }),
        { numRuns: 100 }
      );
    });

    it("Templates should contain the full name as text", () => {
      fc.assert(
        fc.property(resumeDataArb, (data) => {
          [ClassicTemplate, ModernTemplate, MinimalTemplate].forEach(
            (Template) => {
              const html = renderTemplate(Template, data);
              expect(html).toContain(data.personal_info.full_name);
            }
          );
        }),
        { numRuns: 100 }
      );
    });

    it("Templates should contain work experience data as text", () => {
      fc.assert(
        fc.property(resumeDataArb, (data) => {
          [ClassicTemplate, ModernTemplate, MinimalTemplate].forEach(
            (Template) => {
              const html = renderTemplate(Template, data);
              data.work_experiences.forEach((exp) => {
                expect(html).toContain(exp.title);
                expect(html).toContain(exp.company);
              });
            }
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 9: Standard Section Headings", () => {
    const atsHeadingPatterns = {
      experience: /experience/i,
      education: /education/i,
    };

    it("Templates should use ATS-recognized heading for experience", () => {
      fc.assert(
        fc.property(resumeDataArb, (data) => {
          if (data.work_experiences.length === 0) return;
          [ClassicTemplate, ModernTemplate, MinimalTemplate].forEach(
            (Template) => {
              const html = renderTemplate(Template, data);
              const h2Pattern = /<h2[^>]*>(.*?)<\/h2>/gi;
              const h2Contents: string[] = [];
              let match;
              while ((match = h2Pattern.exec(html)) !== null) {
                h2Contents.push(match[1]);
              }
              const hasHeading = h2Contents.some((c) =>
                atsHeadingPatterns.experience.test(c)
              );
              expect(hasHeading).toBe(true);
            }
          );
        }),
        { numRuns: 100 }
      );
    });

    it("Templates should use ATS-recognized heading for education", () => {
      fc.assert(
        fc.property(resumeDataArb, (data) => {
          if (data.education.length === 0) return;
          [ClassicTemplate, ModernTemplate, MinimalTemplate].forEach(
            (Template) => {
              const html = renderTemplate(Template, data);
              const h2Pattern = /<h2[^>]*>(.*?)<\/h2>/gi;
              const h2Contents: string[] = [];
              let match;
              while ((match = h2Pattern.exec(html)) !== null) {
                h2Contents.push(match[1]);
              }
              const hasHeading = h2Contents.some((c) =>
                atsHeadingPatterns.education.test(c)
              );
              expect(hasHeading).toBe(true);
            }
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 13: Registered Templates Appear in Selector", () => {
    it("should have all expected templates registered", () => {
      const registeredTemplates = TemplateRegistry.templates;
      const templateIds = registeredTemplates.map((t) => t.id);
      expect(templateIds).toContain("classic");
      expect(templateIds).toContain("modern");
      expect(templateIds).toContain("minimal");
    });

    it("should return template by ID for all registered templates", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("classic", "modern", "minimal"),
          (templateId) => {
            const template = TemplateRegistry.getTemplate(templateId);
            expect(template).toBeDefined();
            expect(template!.id).toBe(templateId);
            expect(template!.component).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should have valid template definitions", () => {
      const registeredTemplates = TemplateRegistry.templates;
      registeredTemplates.forEach((template) => {
        expect(template.id).toBeDefined();
        expect(template.id.length).toBeGreaterThan(0);
        expect(template.name).toBeDefined();
        expect(template.name.length).toBeGreaterThan(0);
        expect(template.description).toBeDefined();
        expect(template.component).toBeDefined();
        expect(typeof template.component).toBe("function");
      });
    });

    it("should return a default template", () => {
      const defaultTemplate = TemplateRegistry.getDefaultTemplate();
      expect(defaultTemplate).toBeDefined();
      expect(defaultTemplate.id).toBe("classic");
    });

    it("should have unique IDs for all registered templates", () => {
      const registeredTemplates = TemplateRegistry.templates;
      const ids = registeredTemplates.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
