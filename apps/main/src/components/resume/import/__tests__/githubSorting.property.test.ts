/**
 * Property-Based Tests for GitHub Repository Sorting
 *
 * **Feature: linkedin-github-resume-builder, Property 2: GitHub Repositories Sorted by Stars**
 * **Validates: Requirements 2.2**
 *
 * Tests that GitHub repositories are always sorted in descending order by star count.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { sortReposByStars } from "../GitHubImport";
import type { GitHubRepo } from "@/lib/api/upload";

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
  private: fc.constant(false),
  created_at: fc
    .integer({ min: 946684800000, max: Date.now() })
    .map((ms) => new Date(ms).toISOString()),
  updated_at: fc
    .integer({ min: 946684800000, max: Date.now() })
    .map((ms) => new Date(ms).toISOString()),
});

const gitHubReposArb = fc.array(gitHubRepoArb, {
  minLength: 0,
  maxLength: 50,
});

describe("GitHub Repository Sorting Property Tests", () => {
  /**
   * **Feature: linkedin-github-resume-builder, Property 2: GitHub Repositories Sorted by Stars**
   * **Validates: Requirements 2.2**
   *
   * For any list of GitHub repositories, the displayed list SHALL be sorted
   * in descending order by star count.
   */
  describe("Property 2: GitHub Repositories Sorted by Stars", () => {
    it("should sort repositories in descending order by stars", () => {
      fc.assert(
        fc.property(gitHubReposArb, (repos) => {
          const sorted = sortReposByStars(repos);

          // Verify descending order by stars
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].stars).toBeGreaterThanOrEqual(sorted[i + 1].stars);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve all repositories after sorting", () => {
      fc.assert(
        fc.property(gitHubReposArb, (repos) => {
          const sorted = sortReposByStars(repos);

          // Same length
          expect(sorted.length).toBe(repos.length);

          // All original repos should be present
          const sortedIds = sorted.map((r) => r.id);
          repos.forEach((repo) => {
            expect(sortedIds).toContain(repo.id);
          });
        }),
        { numRuns: 100 }
      );
    });

    it("should not modify the original array", () => {
      fc.assert(
        fc.property(gitHubReposArb, (repos) => {
          // Create a copy of original order
          const originalOrder = repos.map((r) => r.id);

          // Sort
          sortReposByStars(repos);

          // Original array should be unchanged
          const currentOrder = repos.map((r) => r.id);
          expect(currentOrder).toEqual(originalOrder);
        }),
        { numRuns: 100 }
      );
    });

    it("should handle empty array", () => {
      const sorted = sortReposByStars([]);
      expect(sorted).toEqual([]);
    });

    it("should handle single element array", () => {
      fc.assert(
        fc.property(gitHubRepoArb, (repo) => {
          const sorted = sortReposByStars([repo]);
          expect(sorted.length).toBe(1);
          expect(sorted[0]).toEqual(repo);
        }),
        { numRuns: 100 }
      );
    });

    it("should handle repos with equal star counts", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.array(gitHubRepoArb, { minLength: 2, maxLength: 10 }),
          (starCount, repos) => {
            // Set all repos to same star count
            const sameStarRepos = repos.map((r) => ({
              ...r,
              stars: starCount,
            }));

            const sorted = sortReposByStars(sameStarRepos);

            // All should have same star count
            sorted.forEach((repo) => {
              expect(repo.stars).toBe(starCount);
            });

            // Length should be preserved
            expect(sorted.length).toBe(sameStarRepos.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should place highest star repos first", () => {
      fc.assert(
        fc.property(
          gitHubReposArb.filter((repos) => repos.length > 0),
          (repos) => {
            const sorted = sortReposByStars(repos);

            // Find max stars in original
            const maxStars = Math.max(...repos.map((r) => r.stars));

            // First element should have max stars
            expect(sorted[0].stars).toBe(maxStars);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should place lowest star repos last", () => {
      fc.assert(
        fc.property(
          gitHubReposArb.filter((repos) => repos.length > 0),
          (repos) => {
            const sorted = sortReposByStars(repos);

            // Find min stars in original
            const minStars = Math.min(...repos.map((r) => r.stars));

            // Last element should have min stars
            expect(sorted[sorted.length - 1].stars).toBe(minStars);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
