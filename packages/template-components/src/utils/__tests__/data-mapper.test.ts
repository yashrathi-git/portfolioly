/**
 * Tests for data transformation utilities
 */

import {
  mapProfilesToSocials,
  formatDateInfo,
  mapWorkExperience,
  mapProject,
  mapEducation,
  extractProfilePhotoUrl,
  mapBackendToFrontend,
  validateApiResponse,
} from "../data-mapper";
import {
  Profile,
  DateInfo,
  WorkExperience,
  Project,
  Education,
  BackendPortfolioData,
} from "../../types/portfolio";

describe("Data Mapper Utilities", () => {
  describe("mapProfilesToSocials", () => {
    it("should map backend profiles to frontend social links", () => {
      const profiles: Profile[] = [
        {
          type: "github",
          url: "https://github.com/testuser",
          label: "GitHub Profile",
        },
        {
          type: "linkedin",
          url: "https://linkedin.com/in/testuser",
          label: "LinkedIn",
        },
        {
          type: "website",
          url: "https://testuser.dev",
          label: "Personal Website",
        },
      ];

      const result = mapProfilesToSocials(profiles);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        type: "github",
        href: "https://github.com/testuser",
        label: "GitHub Profile",
      });
      expect(result[1]).toEqual({
        type: "linkedin",
        href: "https://linkedin.com/in/testuser",
        label: "LinkedIn",
      });
      expect(result[2]).toEqual({
        type: "website",
        href: "https://testuser.dev",
        label: "Personal Website",
      });
    });

    it("should handle empty profiles array", () => {
      const result = mapProfilesToSocials([]);
      expect(result).toEqual([]);
    });

    it("should filter out profiles without URLs", () => {
      const profiles: Profile[] = [
        {
          type: "github",
          url: "https://github.com/testuser",
          label: "GitHub",
        },
        {
          type: "linkedin",
          label: "LinkedIn",
          // No URL
        },
      ];

      const result = mapProfilesToSocials(profiles);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("github");
    });

    it('should map unknown profile types to "link"', () => {
      const profiles: Profile[] = [
        {
          type: "unknown" as any,
          url: "https://example.com",
          label: "Unknown Profile",
        },
      ];

      const result = mapProfilesToSocials(profiles);
      expect(result[0].type).toBe("link");
    });
  });

  describe("formatDateInfo", () => {
    it("should format complete date info", () => {
      const dateInfo: DateInfo = { month: 6, year: 2023 };
      const result = formatDateInfo(dateInfo);
      expect(result).toBe("Jun 2023");
    });

    it("should format year-only date info", () => {
      const dateInfo: DateInfo = { year: 2023 };
      const result = formatDateInfo(dateInfo);
      expect(result).toBe("2023");
    });

    it("should handle undefined date info", () => {
      const result = formatDateInfo(undefined);
      expect(result).toBe("");
    });

    it("should handle empty date info", () => {
      const dateInfo: DateInfo = {};
      const result = formatDateInfo(dateInfo);
      expect(result).toBe("");
    });

    it("should handle all months correctly", () => {
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

      months.forEach((month, index) => {
        const dateInfo: DateInfo = { month: index + 1, year: 2023 };
        const result = formatDateInfo(dateInfo);
        expect(result).toBe(`${month} 2023`);
      });
    });
  });

  describe("mapWorkExperience", () => {
    it("should map complete work experience", () => {
      const workExp: WorkExperience = {
        organization: "Tech Corp",
        title: "Senior Engineer",
        location: "San Francisco, CA",
        start_date: { month: 1, year: 2020 },
        end_date: { month: 12, year: 2023 },
        is_current: false,
        highlights: ["Led team", "Improved performance"],
      };

      const result = mapWorkExperience(workExp);

      expect(result).toEqual({
        companyName: "Tech Corp",
        role: "Senior Engineer",
        location: "San Francisco, CA",
        start: "Jan 2020",
        end: "Dec 2023",
        points: ["Led team", "Improved performance"],
      });
    });

    it("should handle current position", () => {
      const workExp: WorkExperience = {
        organization: "Current Corp",
        title: "Engineer",
        is_current: true,
        start_date: { month: 6, year: 2023 },
      };

      const result = mapWorkExperience(workExp);
      expect(result.end).toBe("Present");
    });

    it("should handle missing fields gracefully", () => {
      const workExp: WorkExperience = {};
      const result = mapWorkExperience(workExp);

      expect(result).toEqual({
        companyName: "",
        role: "",
        location: "",
        start: "",
        end: "",
        points: [],
      });
    });
  });

  describe("mapProject", () => {
    it("should map complete project", () => {
      const project: Project = {
        name: "Awesome App",
        role: "Lead Developer",
        highlights: ["Built with React", "Deployed to AWS"],
        technologies: ["React", "Node.js"],
        github: "https://github.com/user/awesome-app",
        live_link: "https://awesome-app.com",
      };

      const result = mapProject(project);

      expect(result).toEqual({
        name: "Awesome App",
        role: "Lead Developer",
        one_line_description: "Built with React",
        highlights: ["Built with React", "Deployed to AWS"],
        technologies: ["React", "Node.js"],
        github: "https://github.com/user/awesome-app",
        live_link: "https://awesome-app.com",
      });
    });

    it("should handle empty highlights", () => {
      const project: Project = {
        name: "Simple App",
        highlights: [],
      };

      const result = mapProject(project);
      expect(result.one_line_description).toBe("");
    });

    it("should handle missing fields", () => {
      const project: Project = {};
      const result = mapProject(project);

      expect(result).toEqual({
        name: "",
        role: "",
        one_line_description: "",
        highlights: [],
        technologies: [],
        github: "",
        live_link: "",
      });
    });
  });

  describe("mapEducation", () => {
    it("should map complete education", () => {
      const education: Education = {
        institution: "University of Tech",
        degree: "Bachelor of Science",
        branch: "Computer Science",
        start_date: { month: 9, year: 2016 },
        end_date: { month: 6, year: 2020 },
        location: "Tech City, CA",
      };

      const result = mapEducation(education);

      expect(result).toEqual({
        school: "University of Tech",
        degree: "Bachelor of Science in Computer Science",
        start: "Sep 2016",
        end: "Jun 2020",
        location: "Tech City, CA",
      });
    });

    it("should handle degree without branch", () => {
      const education: Education = {
        institution: "Simple College",
        degree: "Associate Degree",
      };

      const result = mapEducation(education);
      expect(result.degree).toBe("Associate Degree");
    });

    it("should handle current education", () => {
      const education: Education = {
        institution: "Current University",
        degree: "PhD",
        is_current: true,
        start_date: { year: 2023 },
      };

      const result = mapEducation(education);
      expect(result.end).toBe("Present");
    });
  });

  describe("extractProfilePhotoUrl", () => {
    it("should extract profile photo URL from profiles", () => {
      const profiles: Profile[] = [
        {
          type: "github",
          url: "https://github.com/user",
        },
        {
          type: "linkedin",
          url: "https://linkedin.com/in/user",
          profile_photo_url: "https://example.com/photo.jpg",
        },
      ];

      const result = extractProfilePhotoUrl(profiles);
      expect(result).toBe("https://example.com/photo.jpg");
    });

    it("should return undefined if no photo URL found", () => {
      const profiles: Profile[] = [
        {
          type: "github",
          url: "https://github.com/user",
        },
      ];

      const result = extractProfilePhotoUrl(profiles);
      expect(result).toBeUndefined();
    });

    it("should handle empty profiles array", () => {
      const result = extractProfilePhotoUrl([]);
      expect(result).toBeUndefined();
    });
  });

  describe("mapBackendToFrontend", () => {
    it("should map complete backend data to frontend format", () => {
      const backendData: BackendPortfolioData = {
        personal_info: {
          full_name: "John Doe",
          headline: "Software Engineer",
          location: "San Francisco, CA",
          profiles: [
            {
              type: "github",
              url: "https://github.com/johndoe",
              label: "GitHub",
            },
            {
              type: "linkedin",
              url: "https://linkedin.com/in/johndoe",
              profile_photo_url: "https://example.com/photo.jpg",
            },
          ],
        },
        projects: [
          {
            name: "Test Project",
            role: "Developer",
            highlights: ["Built with React"],
            technologies: ["React", "TypeScript"],
          },
        ],
        education: [
          {
            institution: "Test University",
            degree: "BS",
            branch: "CS",
            start_date: { year: 2020 },
          },
        ],
        work_experiences: [
          {
            organization: "Test Corp",
            title: "Engineer",
            highlights: ["Developed features"],
          },
        ],
        certifications: [
          {
            name: "AWS Certified",
          },
        ],
        text_blobs: {
          achievements: "Won hackathon",
        },
      };

      const result = mapBackendToFrontend(backendData);

      expect(result.profile.name).toBe("John Doe");
      expect(result.profile.headline).toBe("Software Engineer");
      expect(result.profile.location).toBe("San Francisco, CA");
      expect(result.profile.profile_photo_url).toBe(
        "https://example.com/photo.jpg"
      );
      expect(result.profile.socials).toHaveLength(2);

      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].name).toBe("Test Project");

      expect(result.education).toHaveLength(1);
      expect(result.education[0].school).toBe("Test University");

      expect(result.experience).toHaveLength(1);
      expect(result.experience[0].companyName).toBe("Test Corp");

      expect(result.certificates).toEqual(["AWS Certified"]);
      expect(result.achievements).toEqual(["Won hackathon"]);
    });

    it("should handle empty backend data", () => {
      const backendData: BackendPortfolioData = {};
      const result = mapBackendToFrontend(backendData);

      expect(result.profile.name).toBe("");
      expect(result.projects).toEqual([]);
      expect(result.education).toEqual([]);
      expect(result.experience).toEqual([]);
    });

    it("should throw error on invalid data", () => {
      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      // This should trigger the catch block
      const invalidData = null as any;

      expect(() => mapBackendToFrontend(invalidData)).toThrow(
        "Failed to transform portfolio data"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("validateApiResponse", () => {
    it("should validate correct API response structure", () => {
      const validResponse = {
        personal_info: {
          full_name: "Test User",
        },
        projects: [],
        education: [],
      };

      expect(validateApiResponse(validResponse)).toBe(true);
    });

    it("should reject null or undefined responses", () => {
      expect(validateApiResponse(null)).toBe(false);
      expect(validateApiResponse(undefined)).toBe(false);
    });

    it("should reject non-object responses", () => {
      expect(validateApiResponse("string")).toBe(false);
      expect(validateApiResponse(123)).toBe(false);
      expect(validateApiResponse([])).toBe(false);
    });

    it("should reject objects without expected fields", () => {
      const invalidResponse = {
        random_field: "value",
        another_field: 123,
      };

      expect(validateApiResponse(invalidResponse)).toBe(false);
    });

    it("should accept objects with at least one expected field", () => {
      const partialResponse = {
        personal_info: {},
        random_field: "value",
      };

      expect(validateApiResponse(partialResponse)).toBe(true);
    });
  });
});
