/**
 * Property-Based Tests for ResumeTransformer
 *
 * **Feature: linkedin-github-resume-builder, Property 1: LinkedIn to ResumeData Transformation Preserves Data**
 * **Validates: Requirements 1.1, 1.2**
 *
 * **Feature: linkedin-github-resume-builder, Property 3: Selected Repos Appear in Projects**
 * **Validates: Requirements 2.3**
 *
 * Tests that transforming LinkedIn extracted data (PortfolioData) to ResumeData
 * preserves all personal information fields, work experiences, education entries,
 * and certifications without data loss.
 *
 * Also tests that selected GitHub repositories appear in the projects section
 * with matching names and descriptions.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { ResumeTransformer, type GitHubRepo } from "../resumeTransformer";
import type { PortfolioData } from "portfolioly-schema";

// Arbitraries for generating valid PortfolioData

const dateInfoArb = fc.record({
  month: fc.option(fc.integer({ min: 1, max: 12 }), { nil: null }),
  year: fc.option(fc.integer({ min: 1900, max: 2100 }), { nil: null }),
});

const profileArb = fc.record({
  type: fc.constantFrom(
    "linkedin",
    "github",
    "website",
    "twitter",
    "other"
  ) as fc.Arbitrary<
    | "linkedin"
    | "github"
    | "website"
    | "twitter"
    | "other"
    | "portfolio"
    | "youtube"
    | "instagram"
    | "codeforces"
    | "codechef"
    | "leetcode"
    | "figma"
    | "stackoverflow"
    | "devto"
    | "medium"
    | "producthunt"
    | "atcoder"
    | "scholar"
    | "dribbble"
    | "behance"
    | null
    | undefined
  >,
  url: fc.option(fc.webUrl(), { nil: null }),
  label: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: null }),
});

const personalInfoArb = fc.record({
  full_name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
    nil: null,
  }),
  headline: fc.option(fc.string({ minLength: 0, maxLength: 200 }), {
    nil: null,
  }),
  summary: fc.option(fc.string({ minLength: 0, maxLength: 1000 }), {
    nil: null,
  }),
  email: fc.option(fc.emailAddress(), { nil: null }),
  phone: fc.option(fc.string({ minLength: 0, maxLength: 20 }), { nil: null }),
  location: fc.option(fc.string({ minLength: 0, maxLength: 100 }), {
    nil: null,
  }),
  profiles: fc.array(profileArb, { minLength: 0, maxLength: 5 }),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 30 }), {
    minLength: 0,
    maxLength: 10,
  }),
});

const workExperienceArb = fc.record({
  organization: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
    nil: null,
  }),
  title: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  location: fc.option(fc.string({ minLength: 0, maxLength: 100 }), {
    nil: null,
  }),
  start_date: dateInfoArb,
  end_date: dateInfoArb,
  is_current: fc.option(fc.boolean(), { nil: null }),
  highlights: fc.option(
    fc
      .array(fc.string({ minLength: 1, maxLength: 200 }), {
        minLength: 0,
        maxLength: 5,
      })
      .map((arr) => arr.join("\n")),
    { nil: null }
  ),
  technologies: fc.array(fc.string({ minLength: 1, maxLength: 30 }), {
    minLength: 0,
    maxLength: 5,
  }),
});

const educationArb = fc.record({
  institution: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
    nil: null,
  }),
  degree: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  branch: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: null }),
  start_date: dateInfoArb,
  end_date: dateInfoArb,
  location: fc.option(fc.string({ minLength: 0, maxLength: 100 }), {
    nil: null,
  }),
  grade: fc.option(fc.string({ minLength: 0, maxLength: 20 }), { nil: null }),
});

const projectArb = fc.record({
  name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  highlights: fc.option(fc.string({ minLength: 0, maxLength: 500 }), {
    nil: null,
  }),
  technologies: fc.array(fc.string({ minLength: 1, maxLength: 30 }), {
    minLength: 0,
    maxLength: 5,
  }),
  github: fc.option(fc.webUrl(), { nil: null }),
  live_link: fc.option(fc.webUrl(), { nil: null }),
  more_context: fc.option(fc.string({ minLength: 0, maxLength: 500 }), {
    nil: null,
  }),
});

const certificationArb = fc.record({
  name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  issuer: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: null }),
  link: fc.option(fc.webUrl(), { nil: null }),
});

const portfolioDataArb: fc.Arbitrary<PortfolioData> = fc.record({
  personal_info: personalInfoArb,
  work_experiences: fc.array(workExperienceArb, { minLength: 0, maxLength: 5 }),
  education: fc.array(educationArb, { minLength: 0, maxLength: 3 }),
  projects: fc.array(projectArb, { minLength: 0, maxLength: 5 }),
  certifications: fc.array(certificationArb, { minLength: 0, maxLength: 5 }),
  text_blobs: fc.constant({}),
  metadata: fc.constant({}),
  layout_settings: fc.constant({
    layout_mode: "both" as const,
    default_layout: "chat" as const,
    chat_mode_footer: true,
  }),
});

describe("ResumeTransformer Property Tests", () => {
  /**
   * **Feature: linkedin-github-resume-builder, Property 1: LinkedIn to ResumeData Transformation Preserves Data**
   * **Validates: Requirements 1.1, 1.2**
   *
   * For any valid LinkedIn extracted data, transforming it to ResumeData SHALL
   * preserve all personal information fields, work experiences, education entries,
   * and certifications without data loss.
   */
  describe("Property 1: LinkedIn to ResumeData Transformation Preserves Data", () => {
    it("should preserve personal info full_name", () => {
      fc.assert(
        fc.property(portfolioDataArb, (linkedInData) => {
          const result = ResumeTransformer.fromLinkedIn(linkedInData);

          // full_name should be preserved (or default to "Unnamed" if null)
          const expectedName =
            linkedInData.personal_info?.full_name ?? "Unnamed";
          expect(result.personal_info.full_name).toBe(expectedName);
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve personal info email", () => {
      fc.assert(
        fc.property(portfolioDataArb, (linkedInData) => {
          const result = ResumeTransformer.fromLinkedIn(linkedInData);

          // email should be preserved (or null if not present)
          const expectedEmail = linkedInData.personal_info?.email ?? null;
          expect(result.personal_info.email).toBe(expectedEmail);
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve personal info phone", () => {
      fc.assert(
        fc.property(portfolioDataArb, (linkedInData) => {
          const result = ResumeTransformer.fromLinkedIn(linkedInData);

          const expectedPhone = linkedInData.personal_info?.phone ?? null;
          expect(result.personal_info.phone).toBe(expectedPhone);
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve personal info location", () => {
      fc.assert(
        fc.property(portfolioDataArb, (linkedInData) => {
          const result = ResumeTransformer.fromLinkedIn(linkedInData);

          const expectedLocation = linkedInData.personal_info?.location ?? null;
          expect(result.personal_info.location).toBe(expectedLocation);
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve the count of work experiences", () => {
      fc.assert(
        fc.property(portfolioDataArb, (linkedInData) => {
          const result = ResumeTransformer.fromLinkedIn(linkedInData);

          // Number of work experiences should be preserved
          const expectedCount = linkedInData.work_experiences?.length ?? 0;
          expect(result.work_experiences.length).toBe(expectedCount);
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve work experience company names", () => {
      fc.assert(
        fc.property(portfolioDataArb, (linkedInData) => {
          const result = ResumeTransformer.fromLinkedIn(linkedInData);

          // Each work experience company should be preserved
          (linkedInData.work_experiences ?? []).forEach((exp, index) => {
            const expectedCompany = exp.organization ?? "Unknown Company";
            expect(result.work_experiences[index].company).toBe(
              expectedCompany
            );
          });
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve work experience titles", () => {
      fc.assert(
        fc.property(portfolioDataArb, (linkedInData) => {
          const result = ResumeTransformer.fromLinkedIn(linkedInData);

          (linkedInData.work_experiences ?? []).forEach((exp, index) => {
            const expectedTitle = exp.title ?? "Unknown Title";
            expect(result.work_experiences[index].title).toBe(expectedTitle);
          });
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve the count of education entries", () => {
      fc.assert(
        fc.property(portfolioDataArb, (linkedInData) => {
          const result = ResumeTransformer.fromLinkedIn(linkedInData);

          const expectedCount = linkedInData.education?.length ?? 0;
          expect(result.education.length).toBe(expectedCount);
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve education institution names", () => {
      fc.assert(
        fc.property(portfolioDataArb, (linkedInData) => {
          const result = ResumeTransformer.fromLinkedIn(linkedInData);

          (linkedInData.education ?? []).forEach((edu, index) => {
            const expectedInstitution =
              edu.institution ?? "Unknown Institution";
            expect(result.education[index].institution).toBe(
              expectedInstitution
            );
          });
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve education degrees", () => {
      fc.assert(
        fc.property(portfolioDataArb, (linkedInData) => {
          const result = ResumeTransformer.fromLinkedIn(linkedInData);

          (linkedInData.education ?? []).forEach((edu, index) => {
            const expectedDegree = edu.degree ?? "Unknown Degree";
            expect(result.education[index].degree).toBe(expectedDegree);
          });
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve the count of certifications", () => {
      fc.assert(
        fc.property(portfolioDataArb, (linkedInData) => {
          const result = ResumeTransformer.fromLinkedIn(linkedInData);

          const expectedCount = linkedInData.certifications?.length ?? 0;
          expect(result.certifications.length).toBe(expectedCount);
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve certification names", () => {
      fc.assert(
        fc.property(portfolioDataArb, (linkedInData) => {
          const result = ResumeTransformer.fromLinkedIn(linkedInData);

          (linkedInData.certifications ?? []).forEach((cert, index) => {
            const expectedName = cert.name ?? "Unknown Certification";
            expect(result.certifications[index].name).toBe(expectedName);
          });
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve certification issuers", () => {
      fc.assert(
        fc.property(portfolioDataArb, (linkedInData) => {
          const result = ResumeTransformer.fromLinkedIn(linkedInData);

          (linkedInData.certifications ?? []).forEach((cert, index) => {
            const expectedIssuer = cert.issuer ?? null;
            expect(result.certifications[index].issuer).toBe(expectedIssuer);
          });
        }),
        { numRuns: 100 }
      );
    });

    it("should extract LinkedIn profile URL from profiles", () => {
      fc.assert(
        fc.property(portfolioDataArb, (linkedInData) => {
          const result = ResumeTransformer.fromLinkedIn(linkedInData);

          // Find LinkedIn profile in input
          const linkedInProfile = linkedInData.personal_info?.profiles?.find(
            (p) => p.type?.toLowerCase() === "linkedin"
          );
          const expectedUrl = linkedInProfile?.url ?? null;

          expect(result.personal_info.profiles?.linkedin).toBe(expectedUrl);
        }),
        { numRuns: 100 }
      );
    });

    it("should extract GitHub profile URL from profiles", () => {
      fc.assert(
        fc.property(portfolioDataArb, (linkedInData) => {
          const result = ResumeTransformer.fromLinkedIn(linkedInData);

          const githubProfile = linkedInData.personal_info?.profiles?.find(
            (p) => p.type?.toLowerCase() === "github"
          );
          const expectedUrl = githubProfile?.url ?? null;

          expect(result.personal_info.profiles?.github).toBe(expectedUrl);
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve summary from personal_info.summary or headline", () => {
      fc.assert(
        fc.property(portfolioDataArb, (linkedInData) => {
          const result = ResumeTransformer.fromLinkedIn(linkedInData);

          // Summary should come from summary field (if non-empty), or headline (if non-empty)
          // Empty strings are treated as "no summary" (null)
          const summary = linkedInData.personal_info?.summary;
          const headline = linkedInData.personal_info?.headline;

          // The implementation uses truthy check, so empty strings become null
          const expectedSummary = summary
            ? summary
            : headline
            ? headline
            : null;

          expect(result.summary).toBe(expectedSummary);
        }),
        { numRuns: 100 }
      );
    });

    it("should generate valid ResumeData structure", () => {
      fc.assert(
        fc.property(portfolioDataArb, (linkedInData) => {
          const result = ResumeTransformer.fromLinkedIn(linkedInData);

          // Verify required fields exist
          expect(result.id).toBeDefined();
          expect(result.id.startsWith("resume_")).toBe(true);
          expect(result.name).toBeDefined();
          expect(result.template_id).toBe("classic");
          expect(result.section_order).toBeDefined();
          expect(Array.isArray(result.section_order)).toBe(true);
          expect(result.personal_info).toBeDefined();
          expect(result.work_experiences).toBeDefined();
          expect(Array.isArray(result.work_experiences)).toBe(true);
          expect(result.education).toBeDefined();
          expect(Array.isArray(result.education)).toBe(true);
          expect(result.projects).toBeDefined();
          expect(Array.isArray(result.projects)).toBe(true);
          expect(result.skills).toBeDefined();
          expect(result.certifications).toBeDefined();
          expect(Array.isArray(result.certifications)).toBe(true);
          expect(result.created_at).toBeDefined();
          expect(result.updated_at).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: linkedin-github-resume-builder, Property 3: Selected Repos Appear in Projects**
   * **Validates: Requirements 2.3**
   *
   * For any set of selected GitHub repositories, all selected repos SHALL appear
   * in the projects section of the resulting ResumeData with matching names and descriptions.
   */
  describe("Property 3: Selected Repos Appear in Projects", () => {
    // Arbitrary for generating valid GitHub repositories
    const gitHubRepoArb: fc.Arbitrary<GitHubRepo> = fc.record({
      id: fc.integer({ min: 1, max: 1000000 }),
      name: fc
        .string({ minLength: 1, maxLength: 100 })
        .filter((s) => s.trim().length > 0),
      description: fc.option(fc.string({ minLength: 0, maxLength: 500 }), {
        nil: null,
      }),
      stars: fc.integer({ min: 0, max: 100000 }),
      url: fc.webUrl(),
      language: fc.option(
        fc.constantFrom(
          "TypeScript",
          "JavaScript",
          "Python",
          "Go",
          "Rust",
          "Java",
          "C++"
        ),
        { nil: null }
      ),
      fork: fc.boolean(),
      private: fc.constant(false), // Only public repos are fetched
      created_at: fc
        .integer({ min: 946684800000, max: Date.now() })
        .map((ms) => new Date(ms).toISOString()),
      updated_at: fc
        .integer({ min: 946684800000, max: Date.now() })
        .map((ms) => new Date(ms).toISOString()),
    });

    const gitHubReposArb = fc.array(gitHubRepoArb, {
      minLength: 1,
      maxLength: 10,
    });

    it("should include all selected repos in projects via fromGitHub", () => {
      fc.assert(
        fc.property(gitHubReposArb, (repos) => {
          const result = ResumeTransformer.fromGitHub(repos);

          // All selected repos should appear in projects
          expect(result.projects).toBeDefined();
          expect(result.projects!.length).toBe(repos.length);

          // Each repo should have a matching project
          repos.forEach((repo, index) => {
            const project = result.projects![index];
            expect(project.name).toBe(repo.name);
            expect(project.description).toBe(repo.description);
          });
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve repo names in projects", () => {
      fc.assert(
        fc.property(gitHubReposArb, (repos) => {
          const result = ResumeTransformer.fromGitHub(repos);

          const projectNames = result.projects!.map((p) => p.name);
          const repoNames = repos.map((r) => r.name);

          // All repo names should be present in project names
          repoNames.forEach((name) => {
            expect(projectNames).toContain(name);
          });
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve repo descriptions in projects", () => {
      fc.assert(
        fc.property(gitHubReposArb, (repos) => {
          const result = ResumeTransformer.fromGitHub(repos);

          repos.forEach((repo, index) => {
            const project = result.projects![index];
            expect(project.description).toBe(repo.description);
          });
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve repo URLs in projects", () => {
      fc.assert(
        fc.property(gitHubReposArb, (repos) => {
          const result = ResumeTransformer.fromGitHub(repos);

          repos.forEach((repo, index) => {
            const project = result.projects![index];
            expect(project.url).toBe(repo.url);
          });
        }),
        { numRuns: 100 }
      );
    });

    it("should include repo language in technologies", () => {
      fc.assert(
        fc.property(gitHubReposArb, (repos) => {
          const result = ResumeTransformer.fromGitHub(repos);

          repos.forEach((repo, index) => {
            const project = result.projects![index];
            if (repo.language) {
              expect(project.technologies).toContain(repo.language);
            } else {
              expect(project.technologies).toEqual([]);
            }
          });
        }),
        { numRuns: 100 }
      );
    });

    it("should merge GitHub projects into existing resume via mergeGitHubProjects", () => {
      fc.assert(
        fc.property(portfolioDataArb, gitHubReposArb, (linkedInData, repos) => {
          // Create a resume from LinkedIn data first
          const baseResume = ResumeTransformer.fromLinkedIn(linkedInData);
          const originalProjectCount = baseResume.projects.length;

          // Merge GitHub projects
          const result = ResumeTransformer.mergeGitHubProjects(
            baseResume,
            repos
          );

          // Total projects should be original + GitHub repos
          expect(result.projects.length).toBe(
            originalProjectCount + repos.length
          );

          // All GitHub repos should appear in the merged projects
          const mergedProjectNames = result.projects.map((p) => p.name);
          repos.forEach((repo) => {
            expect(mergedProjectNames).toContain(repo.name);
          });
        }),
        { numRuns: 100 }
      );
    });

    it("should generate valid project IDs for GitHub repos", () => {
      fc.assert(
        fc.property(gitHubReposArb, (repos) => {
          const result = ResumeTransformer.fromGitHub(repos);

          result.projects!.forEach((project) => {
            expect(project.id).toBeDefined();
            expect(project.id.startsWith("proj_")).toBe(true);
          });
        }),
        { numRuns: 100 }
      );
    });
  });
});
