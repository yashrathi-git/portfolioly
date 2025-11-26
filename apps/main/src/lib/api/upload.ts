/**
 * API integration utilities for upload onboarding flow.
 *
 * This module provides client-side functions for interacting with the
 * upload API endpoints, including PDF upload and GitHub integration.
 */

import { getFirebaseAuth } from "@/lib/firebase";
import { env } from "@/lib/env";
// Simple in-memory cache and in-flight dedupe for config and other GETs
const memoryCache = new Map<string, unknown>();
// const inflightRequests = new Map<string, Promise<unknown>>();

function cacheKey(url: string, method: string = "GET"): string {
  return `${method}:${url}`;
}

// Reserved for future use; currently getUploadConfig uses manual caching

// API Base URL
const API_BASE_URL = env.API_BASE_URL;

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
 * Upload submission request interface
 */
export interface UploadSubmissionRequest {
  linkedin_pdf?: {
    text: string;
    source: string;
    filename: string;
    pages: number;
    size: number;
    checksum: string;
    processed_at: string;
  };
  resume_pdf?: {
    text: string;
    source: string;
    filename: string;
    pages: number;
    size: number;
    checksum: string;
    processed_at: string;
  };
  github_repos: GitHubRepo[];
}

/**
 * Upload submission response interface
 */
export interface UploadSubmissionResponse {
  success: boolean;
  message: string;
  data: {
    user_id: string;
    processing_type:
      | "ai_extraction"
      | "github_only"
      | "placeholder"
      | "no_data";
    linkedin_pdf_submitted: boolean;
    resume_pdf_submitted: boolean;
    github_repos_count: number;
    submitted_at: string;
    ai_processing_failed?: boolean;
    error_message?: string;
  };
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
    [key: string]: unknown;
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
 * Extended error type with API error details
 */
interface ExtendedError extends Error {
  code?: string;
  status?: number;
  details?: {
    message?: string;
    error_code?: string;
    [key: string]: unknown;
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
      const error = new Error(
        `HTTP ${response.status}: ${response.statusText}`
      ) as ExtendedError;
      error.status = response.status;
      throw error;
    }

    // Use the backend message directly for user-facing errors
    const message = errorData.detail?.message || `HTTP ${response.status}`;
    const error = new Error(message) as ExtendedError;
    error.code = errorData.detail?.error_code;
    error.status = response.status;
    error.details = errorData.detail;
    throw error;
  }

  return response.json();
}

/**
 * Optionally retry a request once if backend returns 403 with EMAIL_VERIFICATION_REQUIRED.
 * This performs a one-time forced token refresh and retries the request.
 */
async function fetchWithEmailVerifiedRetry(
  makeRequest: () => Promise<Response>
): Promise<Response> {
  const response = await makeRequest();
  if (response.status !== 403) return response;

  // Force-refresh token once and retry
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) return response;
  try {
    await user.getIdToken(true);
  } catch {
    return response;
  }
  return makeRequest();
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
        // Handle non-2xx responses with proper error parsing
        if (xhr.status >= 400) {
          let errorData: APIError;
          try {
            errorData = JSON.parse(xhr.responseText);
          } catch {
            const error = new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
            (error as Error & { status?: number }).status = xhr.status;
            reject(error);
            return;
          }

          const error = new Error(
            errorData.detail?.message || `HTTP ${xhr.status}`
          );
          (
            error as Error & {
              code?: string;
              status?: number;
              details?: unknown;
            }
          ).code = errorData.detail?.error_code;
          (
            error as Error & {
              code?: string;
              status?: number;
              details?: unknown;
            }
          ).status = xhr.status;
          (
            error as Error & {
              code?: string;
              status?: number;
              details?: unknown;
            }
          ).details = errorData.detail;
          reject(error);
          return;
        }

        // Parse successful response
        try {
          const result = JSON.parse(xhr.responseText) as PDFUploadResponse;
          resolve(result);
        } catch {
          reject(new Error("Invalid response format from server"));
        }
      } catch (error) {
        reject(error);
      }
    });

    xhr.addEventListener("error", () => {
      const error = new Error(
        "Network error during file upload. Please check your connection."
      );
      (error as Error & { code?: string }).code = "NETWORK_ERROR";
      reject(error);
    });

    xhr.addEventListener("timeout", () => {
      const error = new Error(
        "Upload timed out. Please try again with a smaller file or better connection."
      );
      (error as Error & { code?: string }).code = "TIMEOUT_ERROR";
      reject(error);
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
  const url = `${API_BASE_URL}/api/github/repos?username=${encodeURIComponent(
    username
  )}&page=${page}&per_page=${perPage}`;

  const response = await fetchWithEmailVerifiedRetry(async () => {
    const headers = await getAuthHeaders();
    return fetch(url, {
      method: "GET",
      headers,
    });
  });

  const raw = await handleResponse<
    PaginatedRepoResponse & { repos: Record<string, unknown>[] }
  >(response);

  // Normalize repo fields to match client expectations
  const normalizedRepos: GitHubRepo[] = (raw.repos || []).map(
    (r: Record<string, unknown>) => ({
      id: r.id as number,
      name: r.name as string,
      description: (r.description as string) ?? null,
      stars:
        typeof r?.stars === "number"
          ? r.stars
          : typeof r?.stargazers_count === "number"
          ? r.stargazers_count
          : 0,
      url: (r.url ?? r.html_url) as string,
      language: (r.language as string) ?? null,
      fork: Boolean(r.fork),
      private: Boolean(r.private),
      created_at: r.created_at as string,
      updated_at: r.updated_at as string,
    })
  );

  return {
    repos: normalizedRepos,
    total_count: raw.total_count,
    page: raw.page,
    per_page: raw.per_page,
    has_next: raw.has_next,
  };
}

/**
 * Submit complete upload data
 */
export async function submitUploadData(
  request: UploadSubmissionRequest
): Promise<UploadSubmissionResponse> {
  const url = `${API_BASE_URL}/api/submit`;

  const response = await fetchWithEmailVerifiedRetry(async () => {
    const headers = await getAuthHeaders();
    return fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });
  });

  return handleResponse<UploadSubmissionResponse>(response);
}

/**
 * Get upload configuration
 */
export async function getUploadConfig(): Promise<UploadConfig> {
  // In-flight dedupe + memoize successful response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalAny = globalThis as any;
  if (!globalAny.__uploadConfigPromise) {
    globalAny.__uploadConfigPromise = null as Promise<UploadConfig> | null;
  }

  const url = `${API_BASE_URL}/api/upload/config`;
  const key = cacheKey(url);

  const cached = memoryCache.get(key) as UploadConfig | undefined;
  if (cached) return cached;

  if (globalAny.__uploadConfigPromise) {
    return globalAny.__uploadConfigPromise;
  }

  const promise = (async () => {
    const doFetch = async () => {
      const headers = await getAuthHeaders();
      return fetch(url, {
        method: "GET",
        headers,
      });
    };
    const response = await fetchWithEmailVerifiedRetry(doFetch);
    const data = await handleResponse<UploadConfig>(response);
    memoryCache.set(key, data);
    return data;
  })();

  globalAny.__uploadConfigPromise = promise;
  try {
    return await promise;
  } finally {
    globalAny.__uploadConfigPromise = null;
  }
}

/**
 * Check upload service health
 */
export async function checkUploadHealth(): Promise<Record<string, unknown>> {
  const url = `${API_BASE_URL}/api/upload/health`;

  const response = await fetch(url, {
    method: "GET",
  });

  return handleResponse<Record<string, unknown>>(response);
}

/**
 * Retry wrapper for API calls with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 1,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx) except 429 (rate limit)
      const status = (error as Error & { status?: number }).status;
      if (
        typeof status === "number" &&
        status >= 400 &&
        status < 500 &&
        status !== 429
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
export function debounce<A extends unknown[]>(
  func: (...args: A) => void | Promise<void>,
  wait: number
): (...args: A) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: A) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      void func(...args);
    }, wait);
  };
}
