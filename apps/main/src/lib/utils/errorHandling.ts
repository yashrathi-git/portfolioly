/**
 * Comprehensive error handling utilities for upload functionality.
 *
 * This module provides utilities for handling, formatting, and displaying
 * errors in a user-friendly way throughout the upload flow.
 */

/**
 * Known error codes from the backend API
 */
export enum ErrorCode {
  // Authentication errors
  AUTH_ERROR = "AUTH_ERROR",
  MISSING_TOKEN = "MISSING_TOKEN",
  INVALID_TOKEN = "INVALID_TOKEN",
  EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",

  // File validation errors
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
  INVALID_PDF_FORMAT = "INVALID_PDF_FORMAT",
  EMPTY_FILE = "EMPTY_FILE",
  CORRUPTED_PDF = "CORRUPTED_PDF",
  EMPTY_PDF = "EMPTY_PDF",

  // PDF processing errors
  PDF_PROCESSING_FAILED = "PDF_PROCESSING_FAILED",
  NO_TEXT_EXTRACTED = "NO_TEXT_EXTRACTED",

  // GitHub API errors
  INVALID_USERNAME = "INVALID_USERNAME",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  REPO_NOT_FOUND = "REPO_NOT_FOUND",
  GITHUB_RATE_LIMIT = "GITHUB_RATE_LIMIT",
  GITHUB_FORBIDDEN = "GITHUB_FORBIDDEN",
  GITHUB_SERVICE_ERROR = "GITHUB_SERVICE_ERROR",

  // Rate limiting errors
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // Repository import errors
  TOO_MANY_REPOS = "TOO_MANY_REPOS",
  NO_REPOS_SELECTED = "NO_REPOS_SELECTED",

  // Generic errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Structured error interface
 */
export interface StructuredError {
  code: ErrorCode;
  message: string;
  severity: ErrorSeverity;
  retryable: boolean;
  userMessage: string;
  actionable: boolean;
  suggestedAction?: string;
  details?: unknown;
}

/**
 * Error message mappings for user-friendly display
 */
const ERROR_MESSAGES: Record<ErrorCode, Partial<StructuredError>> = {
  // Authentication errors
  [ErrorCode.AUTH_ERROR]: {
    severity: ErrorSeverity.HIGH,
    retryable: false,
    userMessage: "Authentication failed. Please sign in again.",
    actionable: true,
    suggestedAction: "Sign in again",
  },
  [ErrorCode.MISSING_TOKEN]: {
    severity: ErrorSeverity.HIGH,
    retryable: false,
    userMessage: "You need to be signed in to upload files.",
    actionable: true,
    suggestedAction: "Sign in",
  },
  [ErrorCode.INVALID_TOKEN]: {
    severity: ErrorSeverity.HIGH,
    retryable: false,
    userMessage: "Your session has expired. Please sign in again.",
    actionable: true,
    suggestedAction: "Sign in again",
  },
  [ErrorCode.EMAIL_NOT_VERIFIED]: {
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    userMessage: "Please verify your email address to continue.",
    actionable: true,
    suggestedAction: "Verify email",
  },

  // File validation errors
  [ErrorCode.FILE_TOO_LARGE]: {
    severity: ErrorSeverity.LOW,
    retryable: false,
    userMessage: "File is too large. Please choose a smaller file.",
    actionable: true,
    suggestedAction: "Choose a smaller file",
  },
  [ErrorCode.INVALID_FILE_TYPE]: {
    severity: ErrorSeverity.LOW,
    retryable: false,
    userMessage: "Please upload a PDF file.",
    actionable: true,
    suggestedAction: "Choose a PDF file",
  },
  [ErrorCode.INVALID_PDF_FORMAT]: {
    severity: ErrorSeverity.LOW,
    retryable: false,
    userMessage: "The file appears to be corrupted or not a valid PDF.",
    actionable: true,
    suggestedAction: "Try a different PDF file",
  },
  [ErrorCode.EMPTY_FILE]: {
    severity: ErrorSeverity.LOW,
    retryable: false,
    userMessage: "The file is empty. Please choose a different file.",
    actionable: true,
    suggestedAction: "Choose a different file",
  },
  [ErrorCode.CORRUPTED_PDF]: {
    severity: ErrorSeverity.LOW,
    retryable: false,
    userMessage: "The PDF file is corrupted or damaged.",
    actionable: true,
    suggestedAction: "Try a different PDF file",
  },
  [ErrorCode.EMPTY_PDF]: {
    severity: ErrorSeverity.LOW,
    retryable: false,
    userMessage: "The PDF file contains no pages.",
    actionable: true,
    suggestedAction: "Choose a different PDF file",
  },

  // PDF processing errors
  [ErrorCode.PDF_PROCESSING_FAILED]: {
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    userMessage: "Failed to process the PDF. Please try again.",
    actionable: true,
    suggestedAction: "Try again or use a different file",
  },
  [ErrorCode.NO_TEXT_EXTRACTED]: {
    severity: ErrorSeverity.LOW,
    retryable: false,
    userMessage:
      "No text could be extracted from this PDF. It might be an image-only file.",
    actionable: true,
    suggestedAction: "Try a different PDF with text content",
  },

  // GitHub API errors
  [ErrorCode.INVALID_USERNAME]: {
    severity: ErrorSeverity.LOW,
    retryable: false,
    userMessage: "Please enter a valid GitHub username.",
    actionable: true,
    suggestedAction: "Check the username format",
  },
  [ErrorCode.USER_NOT_FOUND]: {
    severity: ErrorSeverity.LOW,
    retryable: false,
    userMessage: "GitHub user not found. Please check the username.",
    actionable: true,
    suggestedAction: "Verify the username",
  },
  [ErrorCode.REPO_NOT_FOUND]: {
    severity: ErrorSeverity.LOW,
    retryable: false,
    userMessage: "Repository not found or is private.",
    actionable: false,
  },
  [ErrorCode.GITHUB_RATE_LIMIT]: {
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    userMessage: "GitHub API rate limit reached. Please try again later.",
    actionable: true,
    suggestedAction: "Wait a few minutes and try again",
  },
  [ErrorCode.GITHUB_FORBIDDEN]: {
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    userMessage: "Access to GitHub API is restricted.",
    actionable: false,
  },
  [ErrorCode.GITHUB_SERVICE_ERROR]: {
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    userMessage: "GitHub service is temporarily unavailable.",
    actionable: true,
    suggestedAction: "Try again in a few minutes",
  },

  // Rate limiting errors
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    userMessage: "You've reached the upload limit. Please try again later.",
    actionable: true,
    suggestedAction: "Wait before trying again",
  },

  // Repository import errors
  [ErrorCode.TOO_MANY_REPOS]: {
    severity: ErrorSeverity.LOW,
    retryable: false,
    userMessage: "You can select up to 10 repositories.",
    actionable: true,
    suggestedAction: "Reduce your selection",
  },
  [ErrorCode.NO_REPOS_SELECTED]: {
    severity: ErrorSeverity.LOW,
    retryable: false,
    userMessage: "Please select at least one repository.",
    actionable: true,
    suggestedAction: "Select repositories to import",
  },

  // Generic errors
  [ErrorCode.INTERNAL_ERROR]: {
    severity: ErrorSeverity.HIGH,
    retryable: true,
    userMessage: "An unexpected error occurred. Please try again.",
    actionable: true,
    suggestedAction: "Try again or contact support",
  },
  [ErrorCode.NETWORK_ERROR]: {
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    userMessage:
      "Network connection failed. Please check your internet connection.",
    actionable: true,
    suggestedAction: "Check your connection and try again",
  },
  [ErrorCode.TIMEOUT_ERROR]: {
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    userMessage: "The request timed out. Please try again.",
    actionable: true,
    suggestedAction: "Try again",
  },
};

/**
 * Parse error from API response or JavaScript error
 */
export function parseError(error: unknown): StructuredError {
  // Handle API errors with structured format
  if (error?.details?.error_code) {
    const code = error.details.error_code as ErrorCode;
    const template = ERROR_MESSAGES[code];

    return {
      code,
      message: error.message || error.details.message || "Unknown error",
      severity: template?.severity || ErrorSeverity.MEDIUM,
      retryable: template?.retryable || false,
      userMessage:
        template?.userMessage || error.details.message || "An error occurred",
      actionable: template?.actionable || false,
      suggestedAction: template?.suggestedAction,
      details: error.details,
    };
  }

  // Handle network errors
  if (error?.name === "TypeError" && error?.message?.includes("fetch")) {
    return {
      code: ErrorCode.NETWORK_ERROR,
      message: error.message,
      ...ERROR_MESSAGES[ErrorCode.NETWORK_ERROR],
    } as StructuredError;
  }

  // Handle timeout errors
  if (error?.name === "AbortError" || error?.message?.includes("timeout")) {
    return {
      code: ErrorCode.TIMEOUT_ERROR,
      message: error.message,
      ...ERROR_MESSAGES[ErrorCode.TIMEOUT_ERROR],
    } as StructuredError;
  }

  // Handle generic JavaScript errors
  return {
    code: ErrorCode.INTERNAL_ERROR,
    message: error?.message || "Unknown error",
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    userMessage: "An unexpected error occurred. Please try again.",
    actionable: true,
    suggestedAction: "Try again or contact support",
    details: error,
  };
}

/**
 * Get user-friendly error message
 */
export function getUserErrorMessage(error: unknown): string {
  const structured = parseError(error);
  return structured.userMessage;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const structured = parseError(error);
  return structured.retryable;
}

/**
 * Get suggested action for error
 */
export function getSuggestedAction(error: unknown): string | undefined {
  const structured = parseError(error);
  return structured.suggestedAction;
}

/**
 * Get error severity
 */
export function getErrorSeverity(error: unknown): ErrorSeverity {
  const structured = parseError(error);
  return structured.severity;
}

/**
 * Check if error is actionable by user
 */
export function isActionableError(error: unknown): boolean {
  const structured = parseError(error);
  return structured.actionable;
}

/**
 * Format error for logging (removes sensitive information)
 */
export function formatErrorForLogging(error: unknown): Record<string, unknown> {
  const structured = parseError(error);

  return {
    code: structured.code,
    message: structured.message,
    severity: structured.severity,
    timestamp: new Date().toISOString(),
    userAgent:
      typeof window !== "undefined" ? window.navigator.userAgent : undefined,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    // Don't include sensitive details in logs
  };
}

/**
 * Create a retry delay based on error type and attempt number
 */
export function getRetryDelay(error: unknown, attempt: number): number {
  const structured = parseError(error);

  if (!structured.retryable) {
    return 0;
  }

  // Base delay in milliseconds
  let baseDelay = 1000;

  // Adjust delay based on error type
  switch (structured.code) {
    case ErrorCode.RATE_LIMIT_EXCEEDED:
    case ErrorCode.GITHUB_RATE_LIMIT:
      baseDelay = 60000; // 1 minute for rate limits
      break;
    case ErrorCode.GITHUB_SERVICE_ERROR:
      baseDelay = 5000; // 5 seconds for service errors
      break;
    case ErrorCode.NETWORK_ERROR:
    case ErrorCode.TIMEOUT_ERROR:
      baseDelay = 2000; // 2 seconds for network issues
      break;
  }

  // Exponential backoff with jitter
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 1000; // Add up to 1 second of jitter

  return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
}
