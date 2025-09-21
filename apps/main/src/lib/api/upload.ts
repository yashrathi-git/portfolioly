/**
 * API integration utilities for upload onboarding flow.
 *
 * This module provides client-side functions for interacting with the
 * upload API endpoints, including PDF upload and GitHub integration.
 */

import { getFirebaseAuth } from "@/lib/firebase";

// API Base URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * PDF upload response interface
 */
export interface PDFUploadResponse {
  text: string;
  meta: {
    source: "linkedin" | "resume";
    pages: number;
    filename: string;
    size: number;
    checksum: string;
    processed_at: string;
    blob_url?: string;
  };
  user_id: string;
  success: boolean;
}

/**
 * GitHub repository interface
 */
export interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  stars: number;
  url: string;
  language: string | null;
  fork: boolean;
  private: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Paginated repository response interface
 */
export interface PaginatedRepoResponse {
  repos: GitHubRepo[];
  total_count: number;
  page: number;
  per_page: number;
  has_next: boolean;
}

/**
 * GitHub import response interface
 */
export interface GitHubImportResponse {
  imported: number;
  message: string;
}

/**
 * Upload configuration interface
 */
export interface UploadConfig {
  max_file_size_mb: number;
  allowed_file_types: string[];
  max_github_repos: number;
  github_repos_per_page: number;
  rate_limits: {
    pdf_uploads_per_hour: number;
    github_requests_per_hour: number;
  };
}

/**
 * API error interface
 */
export interface APIError {
  detail: {
    message: string;
    error_code: string;
    [key: string]: any;
  };
}

/**
 * Get authentication headers with Firebase ID token
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not authenticated");
  }

  const token = await user.getIdToken();

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Get authentication headers for file upload (without Content-Type)
 */
async function getAuthHeadersForUpload(): Promise<Record<string, string>> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not authenticated");
  }

  const token = await user.getIdToken();

  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Handle API response and throw errors for non-2xx status codes
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: APIError;
    try {
      errorData = await response.json();
    } catch {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const error = new Error(
      errorData.detail?.message || `HTTP ${response.status}`
    );
    (error as any).code = errorData.detail?.error_code;
    (error as any).status = response.status;
    (error as any).details = errorData.detail;
    throw error;
  }

  return response.json();
}

/**
 * Validate file before upload
 */
export function validateFile(file: File, config: UploadConfig): string | null {
  // Check file size
  const maxSizeBytes = config.max_file_size_mb * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `File too large. Maximum size is ${config.max_file_size_mb}MB.`;
  }

  // Check file type
  if (!config.allowed_file_types.includes(file.type)) {
    return "Please upload a PDF file.";
  }

  // Check file extension as fallback
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return "Please upload a PDF file.";
  }

  return null; // No validation errors
}

/**
 * Upload PDF file for text extraction
 */
export async function uploadPDF(
  file: File,
  source: "linkedin" | "resume",
  onProgress?: (progress: number) => void
): Promise<PDFUploadResponse> {
  const headers = await getAuthHeadersForUpload();

  const formData = new FormData();
  formData.append("file", file);

  const url = `${API_BASE_URL}/api/ingest/pdf?source=${source}`;

  // Create XMLHttpRequest for progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener("load", async () => {
      try {
        const response = new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
        });
        const result = await handleResponse<PDFUploadResponse>(response);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during file upload"));
    });

    xhr.addEventListener("timeout", () => {
      reject(new Error("Upload timeout"));
    });

    xhr.open("POST", url);

    // Set headers (don't set Content-Type for FormData)
    Object.entries(headers).forEach(([key, value]) => {
      if (key !== "Content-Type") {
        xhr.setRequestHeader(key, value);
      }
    });

    xhr.timeout = 60000; // 60 second timeout
    xhr.send(formData);
  });
}

/**
 * Fetch GitHub repositories for a user
 */
export async function fetchGitHubRepos(
  username: string,
  page: number = 1,
  perPage: number = 20
): Promise<PaginatedRepoResponse> {
  const headers = await getAuthHeaders();

  const url = `${API_BASE_URL}/api/github/repos?username=${encodeURIComponent(
    username
  )}&page=${page}&per_page=${perPage}`;

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  const raw = await handleResponse<PaginatedRepoResponse & { repos: any[] }>(
    response
  );

  // Normalize repo fields to match client expectations
  const normalizedRepos: GitHubRepo[] = (raw.repos || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    stars:
      typeof r?.stars === "number"
        ? r.stars
        : typeof r?.stargazers_count === "number"
        ? r.stargazers_count
        : 0,
    url: r.url ?? r.html_url,
    language: r.language ?? null,
    fork: Boolean(r.fork),
    private: Boolean(r.private),
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));

  return {
    repos: normalizedRepos,
    total_count: raw.total_count,
    page: raw.page,
    per_page: raw.per_page,
    has_next: raw.has_next,
  };
}

/**
 * Import selected GitHub repositories
 */
export async function importGitHubRepos(
  repoIds: number[]
): Promise<GitHubImportResponse> {
  const headers = await getAuthHeaders();

  const url = `${API_BASE_URL}/api/github/import`;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ repo_ids: repoIds }),
  });

  return handleResponse<GitHubImportResponse>(response);
}

/**
 * Get upload configuration
 */
export async function getUploadConfig(): Promise<UploadConfig> {
  const headers = await getAuthHeaders();

  const url = `${API_BASE_URL}/api/upload/config`;

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  return handleResponse<UploadConfig>(response);
}

/**
 * Check upload service health
 */
export async function checkUploadHealth(): Promise<any> {
  const url = `${API_BASE_URL}/api/upload/health`;

  const response = await fetch(url, {
    method: "GET",
  });

  return handleResponse<any>(response);
}

/**
 * Retry wrapper for API calls with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (
        (error as any).status >= 400 &&
        (error as any).status < 500 &&
        (error as any).status !== 429
      ) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Create a debounced version of a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
