/**
 * Utility to map main app's portfolio data to template component's expected format
 * This now uses the shared transformation utilities from @portfolioly/schema
 */

import type {
  PortfolioData as MainPortfolioData,
  DisplayPortfolioData,
} from "@portfolioly/schema";
import { mapBackendToDisplay } from "@portfolioly/schema";

/**
 * Main transformation function: maps main app's portfolio data to template component format
 * Uses the shared transformation utilities from @portfolioly/schema
 */
export function mapPortfolioDataToTemplate(
  data: MainPortfolioData
): DisplayPortfolioData {
  // Use the shared transformation function from schema package
  return mapBackendToDisplay(data);
}
