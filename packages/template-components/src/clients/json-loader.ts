/**
 * JSON file loader for local portfolio data
 */

import type { PortfolioData } from "portfolioly-schema";
import { TemplateConfig } from "../config/template-config";
import { DataProviderError } from "../providers/data-provider";
import { validateApiResponse } from "../utils/data-mapper";

export class JsonFileLoader {
  private config: TemplateConfig;

  constructor(config: TemplateConfig) {
    this.config = config;
  }

  /**
   * Load portfolio data from JSON file
   */
  async loadPortfolioData(): Promise<PortfolioData | null> {
    const jsonPath = this.config.jsonFiles?.portfolioData;

    if (!jsonPath) {
      throw new DataProviderError(
        "No JSON file path configured for portfolio data",
        "validation"
      );
    }

    try {
      this.log("Loading portfolio data from JSON file:", jsonPath);

      // In browser environment, we need to fetch the JSON file
      const response = await fetch(jsonPath);

      if (!response.ok) {
        throw new DataProviderError(
          `Failed to load JSON file: ${response.status} ${response.statusText}`,
          "network"
        );
      }

      const data = await response.json();

      // Validate the JSON structure
      if (!validateApiResponse(data)) {
        throw new DataProviderError(
          "Invalid JSON structure in portfolio data file",
          "validation"
        );
      }

      this.log("Successfully loaded portfolio data from JSON:", data);
      return data as PortfolioData;
    } catch (error) {
      this.log("Error loading JSON file:", error);

      if (error instanceof DataProviderError) {
        throw error;
      }

      // Handle different types of errors
      if (error instanceof SyntaxError) {
        throw new DataProviderError(
          "Invalid JSON format in portfolio data file",
          "validation",
          error
        );
      }

      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new DataProviderError(
          "Failed to fetch JSON file - file may not exist or be accessible",
          "network",
          error
        );
      }

      throw new DataProviderError(
        "Failed to load portfolio data from JSON file",
        "unknown",
        error as Error
      );
    }
  }

  /**
   * Check if JSON file exists and is accessible
   */
  async checkJsonFileExists(): Promise<boolean> {
    const jsonPath = this.config.jsonFiles?.portfolioData;

    if (!jsonPath) {
      return false;
    }

    try {
      this.log("Checking if JSON file exists:", jsonPath);

      const response = await fetch(jsonPath, { method: "HEAD" });
      const exists = response.ok;

      this.log("JSON file exists:", exists);
      return exists;
    } catch (error) {
      this.log("Error checking JSON file existence:", error);
      return false;
    }
  }

  /**
   * Load and validate JSON file with detailed error reporting
   */
  async loadAndValidateJson(): Promise<{
    success: boolean;
    data?: PortfolioData;
    error?: string;
  }> {
    try {
      const data = await this.loadPortfolioData();
      return {
        success: true,
        data: data || undefined,
      };
    } catch (error) {
      let errorMessage = "Unknown error occurred";

      if (error instanceof DataProviderError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Create a sample JSON file structure for reference
   */
  static getSampleJsonStructure(): PortfolioData {
    return {
      personal_info: {
        full_name: "John Doe",
        headline: "Software Engineer",
        summary: "Experienced developer with expertise in web technologies",
        email: "john.doe@example.com",
        location: "San Francisco, CA",
        profiles: [
          {
            type: "github",
            url: "https://github.com/johndoe",
            label: "GitHub Profile",
          },
          {
            type: "linkedin",
            url: "https://linkedin.com/in/johndoe",
            label: "LinkedIn Profile",
          },
        ],
      },
      work_experiences: [
        {
          organization: "Tech Company",
          title: "Senior Software Engineer",
          location: "San Francisco, CA",
          start_date: { month: 1, year: 2020 },
          end_date: { month: 12, year: 2023 },
          is_current: false,
          highlights:
            "- Led development of key features\n- Improved system performance by 40%",
          technologies: ["React", "Node.js", "PostgreSQL"],
        },
      ],
      projects: [
        {
          name: "Portfolio Website",
          highlights: "- Built responsive design\n- Implemented modern UI/UX",
          technologies: ["Next.js", "TypeScript", "Tailwind CSS"],
          github: "https://github.com/johndoe/portfolio",
          live_link: "https://johndoe.dev",
          images: [],
        },
      ],
      education: [
        {
          institution: "University of Technology",
          degree: "Bachelor of Science",
          branch: "Computer Science",
          start_date: { month: 9, year: 2016 },
          end_date: { month: 6, year: 2020 },
          location: "San Francisco, CA",
          grade: "3.8 GPA",
        },
      ],
      certifications: [
        {
          name: "AWS Certified Developer",
          link: "https://aws.amazon.com/certification/",
        },
      ],
      text_blobs: {
        achievements:
          "Winner of Hackathon 2023, Speaker at Tech Conference 2024",
        additional_context: "Passionate about open source and mentoring",
      },
      metadata: {
        source_type: "json_file",
        extracted_at: new Date().toISOString(),
        notes: "Manually created portfolio data",
      },
    };
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.enableDebugLogging) {
      console.log(`[JsonFileLoader] ${message}`, ...args);
    }
  }
}
