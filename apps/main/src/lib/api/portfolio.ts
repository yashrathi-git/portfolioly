/**
 * Portfolio API service for communicating with the backend
 */

import type { PortfolioData } from "portfolioly-schema";
import { getIdToken } from "../firebase";
import { env } from "@/lib/env";

const API_BASE_URL = env.API_BASE_URL;

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

/**
 * Upload profile photo
 * @param file - Image file to upload (JPEG, PNG, WebP, or GIF, max 800KB)
 * @returns URL of the uploaded photo
 */
export async function uploadProfilePhoto(file: File): Promise<string> {
  try {
    const token = await getIdToken();
    if (!token) {
      throw new PortfolioAPIError(
        "User not authenticated",
        401,
        "AUTH_REQUIRED"
      );
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/portfolio/profile-photo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await handleResponse<{ photo_url: string }>(response);
    return result.photo_url;
  } catch (error) {
    if (error instanceof PortfolioAPIError) {
      throw error;
    }

    console.error("Error uploading profile photo:", error);
    throw new PortfolioAPIError(
      "Failed to upload profile photo",
      undefined,
      "UPLOAD_ERROR"
    );
  }
}

/**
 * Delete profile photo
 */
export async function deleteProfilePhoto(): Promise<void> {
  try {
    const token = await getIdToken();
    if (!token) {
      throw new PortfolioAPIError(
        "User not authenticated",
        401,
        "AUTH_REQUIRED"
      );
    }

    const response = await fetch(`${API_BASE_URL}/portfolio/profile-photo`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await handleResponse<{ success: boolean }>(response);
  } catch (error) {
    if (error instanceof PortfolioAPIError) {
      throw error;
    }

    console.error("Error deleting profile photo:", error);
    throw new PortfolioAPIError(
      "Failed to delete profile photo",
      undefined,
      "DELETE_ERROR"
    );
  }
}

/**
 * Upload multiple project images
 * @param files - Array of image files to upload (max 5 images, each max 800KB)
 * @returns Array of URLs for the uploaded images
 */
export async function uploadProjectImages(files: File[]): Promise<string[]> {
  try {
    const token = await getIdToken();
    if (!token) {
      throw new PortfolioAPIError(
        "User not authenticated",
        401,
        "AUTH_REQUIRED"
      );
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch(`${API_BASE_URL}/portfolio/project-images`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await handleResponse<{ image_urls: string[] }>(response);
    return result.image_urls;
  } catch (error) {
    if (error instanceof PortfolioAPIError) {
      throw error;
    }

    console.error("Error uploading project images:", error);
    throw new PortfolioAPIError(
      "Failed to upload project images",
      undefined,
      "UPLOAD_ERROR"
    );
  }
}

/**
 * Delete a specific project image
 * @param imageUrl - Full URL of the image to delete
 */
export async function deleteProjectImage(imageUrl: string): Promise<void> {
  try {
    const token = await getIdToken();
    if (!token) {
      throw new PortfolioAPIError(
        "User not authenticated",
        401,
        "AUTH_REQUIRED"
      );
    }

    // Encode the URL for use in the path
    const encodedUrl = encodeURIComponent(imageUrl);

    const response = await fetch(
      `${API_BASE_URL}/portfolio/project-images/${encodedUrl}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    await handleResponse<{ success: boolean }>(response);
  } catch (error) {
    if (error instanceof PortfolioAPIError) {
      throw error;
    }

    console.error("Error deleting project image:", error);
    throw new PortfolioAPIError(
      "Failed to delete project image",
      undefined,
      "DELETE_ERROR"
    );
  }
}
