import { toast } from "sonner";
import { getUserErrorMessage, formatErrorForLogging } from "./errorHandling";

/**
 * Simple error handler that shows user-friendly messages via Sonner
 * and logs errors appropriately for production
 */
export function handleError(error: any, context?: string) {
  const userMessage = getUserErrorMessage(error);

  // Show user-friendly message
  toast.error(userMessage);

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
