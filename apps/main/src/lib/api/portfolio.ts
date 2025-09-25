/**
 * Portfolio API service for communicating with the backend
 */

import type { PortfolioData } from "@/types/portfolio";
import { getIdToken } from "../firebase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class PortfolioAPIError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = "PortfolioAPIError";
  }
}

/**
 * Get authorization headers with Firebase ID token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getIdToken();
  if (!token) {
    throw new PortfolioAPIError("User not authenticated", 401, "AUTH_REQUIRED");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Handle API response and errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    let errorCode = "API_ERROR";

    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
      errorCode = errorData.error_code || errorCode;
    } catch {
      // If we can't parse error JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new PortfolioAPIError(errorMessage, response.status, errorCode);
  }

  // Handle empty responses (like 204 No Content)
  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return null as T;
  }

  try {
    return await response.json();
  } catch {
    throw new PortfolioAPIError("Invalid response format", response.status);
  }
}

/**
 * Fetch user's portfolio data from the backend
 * Returns null if no portfolio exists
 */
export async function getUserPortfolio(): Promise<PortfolioData | null> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/portfolio/`, {
      method: "GET",
      headers,
    });

    return await handleResponse<PortfolioData | null>(response);
  } catch (error) {
    if (error instanceof PortfolioAPIError) {
      throw error;
    }

    console.error("Error fetching portfolio:", error);
    throw new PortfolioAPIError(
      "Failed to fetch portfolio data",
      undefined,
      "FETCH_ERROR"
    );
  }
}

/**
 * Save user's portfolio data to the backend
 */
export async function saveUserPortfolio(
  portfolioData: PortfolioData
): Promise<void> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/portfolio/`, {
      method: "PUT",
      headers,
      body: JSON.stringify(portfolioData),
    });

    await handleResponse<{ message: string }>(response);
  } catch (error) {
    if (error instanceof PortfolioAPIError) {
      throw error;
    }

    console.error("Error saving portfolio:", error);
    throw new PortfolioAPIError(
      "Failed to save portfolio data",
      undefined,
      "SAVE_ERROR"
    );
  }
}

/**
 * Check if user has an existing portfolio
 */
export async function hasUserPortfolio(): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/portfolio/exists`, {
      method: "GET",
      headers,
    });

    const result = await handleResponse<{ exists: boolean }>(response);
    return result?.exists || false;
  } catch (error) {
    if (error instanceof PortfolioAPIError && error.code === "AUTH_REQUIRED") {
      throw error;
    }
    // For other errors, assume no portfolio exists
    return false;
  }
}

/**
 * Delete user's portfolio data
 * Note: This is a destructive operation
 */
export async function deleteUserPortfolio(): Promise<void> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/portfolio/`, {
      method: "DELETE",
      headers,
    });

    await handleResponse<{ message: string }>(response);
  } catch (error) {
    if (error instanceof PortfolioAPIError) {
      throw error;
    }

    console.error("Error deleting portfolio:", error);
    throw new PortfolioAPIError(
      "Failed to delete portfolio data",
      undefined,
      "DELETE_ERROR"
    );
  }
}
