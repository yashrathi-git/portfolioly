/**
 * API client for public portfolio operations
 * Uses existing backend endpoints: /public/portfolio/{username} and /public/chat/{username}
 */

import type { BackendPortfolioData } from "@portfolioly/template-components";

export interface PortfolioConfig {
  username: string;
  publicToken: string;
}

/**
 * Fetch public portfolio data by username with PSK token authentication
 * @param apiBaseUrl - Base URL for API calls
 * @param username - Portfolio username
 * @param pskToken - Pre-shared key token for authentication
 * @returns Portfolio data from backend
 */
export async function fetchPublicPortfolio(
  apiBaseUrl: string,
  username: string,
  pskToken: string
): Promise<BackendPortfolioData | null> {
  if (!username) {
    throw new Error("Username is required");
  }

  if (!pskToken) {
    throw new Error("PSK token is required");
  }

  try {
    const response = await fetch(
      `${apiBaseUrl}/public/portfolio/${encodeURIComponent(username)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pskToken}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Invalid or expired PSK token");
      } else if (response.status === 404) {
        throw new Error("Portfolio not found");
      } else if (response.status === 403) {
        throw new Error("Access denied to this portfolio");
      } else {
        throw new Error(`Failed to fetch portfolio: ${response.status}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching public portfolio:", error);
    throw error;
  }
}
