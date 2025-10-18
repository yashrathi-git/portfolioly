/**
 * Data validation utilities
 *
 * Note: Data transformation functions have been moved to @portfolioly/schema package.
 * Use mapBackendToDisplay from @portfolioly/schema instead of mapBackendToFrontend.
 */

import type { PortfolioData } from "@portfolioly/schema";

/**
 * Validates that the API response has the expected structure
 */
export function validateApiResponse(data: any): data is PortfolioData {
  if (!data || typeof data !== "object") {
    return false;
  }

  // Basic validation - check if it has expected optional fields
  const validFields = [
    "personal_info",
    "work_experiences",
    "projects",
    "education",
    "certifications",
    "text_blobs",
    "metadata",
    "layout_settings",
  ];

  // If it has any of the expected fields, consider it valid
  return validFields.some((field) => field in data);
}

// Re-export transformation utilities from shared schema package
export {
  mapBackendToDisplay,
  mapBackendToDisplay as mapBackendToFrontend,
} from "@portfolioly/schema";
