/**
 * Resume API service for communicating with the backend
 *
 * Provides CRUD operations for resumes stored in Firebase.
 * Follows the same patterns as portfolio.ts for consistency.
 */

import type {
  ResumeData,
  ResumeSummary,
  CreateResumeRequest,
  UpdateResumeRequest,
} from "@/types/resume";
import { getIdToken } from "../firebase";
import { env } from "@/lib/env";

const API_BASE_URL = env.API_BASE_URL;

export class ResumeAPIError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = "ResumeAPIError";
  }
}

/**
 * Get authorization headers with Firebase ID token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getIdToken();
  if (!token) {
    throw new ResumeAPIError("User not authenticated", 401, "AUTH_REQUIRED");
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
      // Handle cases where detail is an object (validation errors)
      if (typeof errorData.detail === "object") {
        errorMessage = JSON.stringify(errorData.detail);
      } else {
        errorMessage = errorData.detail || errorMessage;
      }
      errorCode = errorData.error_code || errorCode;
      console.error("API Error Details:", errorData);
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new ResumeAPIError(errorMessage, response.status, errorCode);
  }

  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return null as T;
  }

  try {
    return await response.json();
  } catch {
    throw new ResumeAPIError("Invalid response format", response.status);
  }
}

/** Response from list resumes endpoint */
interface ResumeListResponse {
  resumes: ResumeSummary[];
  total: number;
}

/** Response from create resume endpoint */
interface CreateResumeResponse {
  id: string;
  message: string;
}

/** Response from duplicate resume endpoint */
interface DuplicateResumeResponse {
  id: string;
  message: string;
}

/** Response from delete resume endpoint */
interface DeleteResumeResponse {
  success: boolean;
  message: string;
}

/**
 * Ensure resume data has all required fields with defaults
 */
function normalizeResumeData(data: Record<string, unknown>): ResumeData {
  const result = { ...data } as ResumeData;

  // Ensure achievements exists
  result.achievements = (data.achievements as string[]) || [];

  // Ensure profiles exists in personal_info
  if (result.personal_info) {
    result.personal_info = {
      ...result.personal_info,
      profiles: result.personal_info.profiles || {
        linkedin: null,
        github: null,
        leetcode: null,
        codeforces: null,
        codechef: null,
        website: null,
      },
    };
  }

  // Ensure section_order includes achievements
  if (result.section_order && !result.section_order.includes("achievements")) {
    result.section_order = [...result.section_order, "achievements"];
  }

  return result;
}

/**
 * Create a new resume
 * @param data - Resume data to create
 * @returns The ID of the created resume
 */
export async function createResume(data: CreateResumeRequest): Promise<string> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/resumes/`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    const result = await handleResponse<CreateResumeResponse>(response);
    return result.id;
  } catch (error) {
    if (error instanceof ResumeAPIError) {
      throw error;
    }

    console.error("Error creating resume:", error);
    throw new ResumeAPIError(
      "Failed to create resume",
      undefined,
      "CREATE_ERROR"
    );
  }
}

/**
 * Get a single resume by ID
 * @param resumeId - The ID of the resume to retrieve
 * @returns The full resume data
 */
export async function getResume(resumeId: string): Promise<ResumeData> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}`, {
      method: "GET",
      headers,
    });

    const data = await handleResponse<Record<string, unknown>>(response);
    return normalizeResumeData(data);
  } catch (error) {
    if (error instanceof ResumeAPIError) {
      throw error;
    }

    console.error("Error fetching resume:", error);
    throw new ResumeAPIError(
      "Failed to fetch resume",
      undefined,
      "FETCH_ERROR"
    );
  }
}

/**
 * List all resumes for the current user
 * @returns List of resume summaries with total count
 */
export async function listResumes(): Promise<ResumeListResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/resumes/`, {
      method: "GET",
      headers,
    });

    return await handleResponse<ResumeListResponse>(response);
  } catch (error) {
    if (error instanceof ResumeAPIError) {
      throw error;
    }

    console.error("Error listing resumes:", error);
    throw new ResumeAPIError("Failed to list resumes", undefined, "LIST_ERROR");
  }
}

/**
 * Update an existing resume
 * @param resumeId - The ID of the resume to update
 * @param data - Partial resume data to update
 */
export async function updateResume(
  resumeId: string,
  data: UpdateResumeRequest
): Promise<void> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });

    await handleResponse<{ message: string }>(response);
  } catch (error) {
    if (error instanceof ResumeAPIError) {
      throw error;
    }

    console.error("Error updating resume:", error);
    throw new ResumeAPIError(
      "Failed to update resume",
      undefined,
      "UPDATE_ERROR"
    );
  }
}

/**
 * Delete a resume
 * @param resumeId - The ID of the resume to delete
 */
export async function deleteResume(resumeId: string): Promise<void> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}`, {
      method: "DELETE",
      headers,
    });

    await handleResponse<DeleteResumeResponse>(response);
  } catch (error) {
    if (error instanceof ResumeAPIError) {
      throw error;
    }

    console.error("Error deleting resume:", error);
    throw new ResumeAPIError(
      "Failed to delete resume",
      undefined,
      "DELETE_ERROR"
    );
  }
}

/**
 * Duplicate an existing resume
 * @param resumeId - The ID of the resume to duplicate
 * @param newName - Optional new name for the duplicated resume
 * @returns The ID of the new resume
 */
export async function duplicateResume(
  resumeId: string,
  newName?: string
): Promise<string> {
  try {
    const headers = await getAuthHeaders();

    const body = newName ? { new_name: newName } : {};

    const response = await fetch(
      `${API_BASE_URL}/api/resumes/${resumeId}/duplicate`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }
    );

    const result = await handleResponse<DuplicateResumeResponse>(response);
    return result.id;
  } catch (error) {
    if (error instanceof ResumeAPIError) {
      throw error;
    }

    console.error("Error duplicating resume:", error);
    throw new ResumeAPIError(
      "Failed to duplicate resume",
      undefined,
      "DUPLICATE_ERROR"
    );
  }
}
