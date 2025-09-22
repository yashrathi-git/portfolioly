import { toast } from "sonner";
import { getUserErrorMessage, formatErrorForLogging } from "./errorHandling";

// Deduplicate identical error toasts shown within a short time window
const RECENT_ERROR_TOASTS = new Map<string, number>();
const TOAST_DEDUP_WINDOW_MS = 1500;

function shouldShowErrorToast(message: string): boolean {
  const now = Date.now();
  const last = RECENT_ERROR_TOASTS.get(message) || 0;
  if (now - last < TOAST_DEDUP_WINDOW_MS) {
    return false;
  }
  RECENT_ERROR_TOASTS.set(message, now);
  return true;
}

/**
 * Simple error handler that shows user-friendly messages via Sonner
 * and logs errors appropriately for production
 */
export function handleError(error: unknown, context?: string) {
  const userMessage = getUserErrorMessage(error);

  // Show user-friendly message
  if (shouldShowErrorToast(userMessage)) {
    toast.error(userMessage);
  }

  // Log error details
  const logData = formatErrorForLogging(error);
  console.error(`Error${context ? ` in ${context}` : ""}:`, logData);

  // In production, you could send to error reporting service
  if (process.env.NODE_ENV === "production") {
    // Example: Send to error reporting service
    // errorReportingService.captureException(error, {
    //   context,
    //   ...logData
    // });
  }
}

/**
 * Handle async operations with automatic error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    handleError(error, context);
    return null;
  }
}

/**
 * Handle success messages
 */
export function handleSuccess(message: string) {
  toast.success(message);
}

/**
 * Handle validation errors with direct message display
 * Bypasses the structured error handling for client-side validation
 */
export function handleValidationError(message: string, context?: string) {
  // Show the validation message directly
  if (shouldShowErrorToast(message)) {
    toast.error(message);
  }

  // Log validation error
  console.error(`Validation error${context ? ` in ${context}` : ""}:`, message);
}
