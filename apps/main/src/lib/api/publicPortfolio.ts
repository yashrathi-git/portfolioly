/**
 * Public Portfolio API Client
 *
 * Handles fetching publicly accessible portfolios by username.
 * This client is used for the public portfolio pages (/p/[username]).
 */

import { env } from "@/lib/env";
import type { PortfolioData } from "@portfolioly/schema";

export class PublicPortfolioError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = "PublicPortfolioError";
  }
}

/**
 * Fetch a public portfolio by username
 *
 * This function:
 * 1. Calls the ensure-token endpoint with only the username
 * 2. Receives a public token if the portfolio is public
 * 3. Fetches the portfolio data using the public token
 *
 * @param username - The portfolio username
 * @returns Portfolio data
 * @throws PublicPortfolioError with status 404 if portfolio not found or is private
 * @throws PublicPortfolioError for other errors
 */
export async function fetchPublicPortfolio(
  username: string
): Promise<PortfolioData> {
  try {
    // Step 1: Get public token by calling ensure-token with username only
    const tokenResponse = await fetch(
      `${env.API_BASE_URL}/public/ensure-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      }
    );

    // Handle 404 - portfolio not found or is private
    if (tokenResponse.status === 404) {
      throw new PublicPortfolioError("Portfolio not found", 404);
    }

    if (!tokenResponse.ok) {
      throw new PublicPortfolioError(
        `Failed to access portfolio: ${tokenResponse.statusText}`,
        tokenResponse.status
      );
    }

    const { token } = await tokenResponse.json();

    // Step 2: Fetch portfolio data with the public token
    const portfolioResponse = await fetch(
      `${env.API_BASE_URL}/public/portfolio/${encodeURIComponent(username)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (portfolioResponse.status === 404) {
      throw new PublicPortfolioError("Portfolio not found", 404);
    }

    if (!portfolioResponse.ok) {
      throw new PublicPortfolioError(
        `Failed to load portfolio: ${portfolioResponse.statusText}`,
        portfolioResponse.status
      );
    }

    const portfolioData = await portfolioResponse.json();
    return portfolioData;
  } catch (error) {
    if (error instanceof PublicPortfolioError) {
      throw error;
    }
    throw new PublicPortfolioError(
      "Failed to fetch public portfolio",
      undefined,
      error as Error
    );
  }
}
