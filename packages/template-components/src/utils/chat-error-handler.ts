/**
 * Chat error handling utilities.
 *
 * Maps backend error codes to user-friendly messages and handles
 * special cases like demo portfolio rate limits.
 */

// Demo portfolio usernames - used for special error handling
const DEMO_USERNAMES = ["nikhilajmera2005", "demo2005"];

/**
 * Check if a username is a demo portfolio
 */
export function isDemoUsername(username?: string): boolean {
  return username ? DEMO_USERNAMES.includes(username) : false;
}

/**
 * Error codes returned by the chat API
 */
export type ChatErrorCode =
  | "INPUT_LENGTH_EXCEEDED"
  | "CHAT_IP_RATE_LIMIT_EXCEEDED"
  | "PORTFOLIO_OWNER_LIMIT_EXCEEDED"
  | "UNKNOWN";

/**
 * Parsed error response from the chat API
 */
export interface ChatApiError {
  message: string;
  error_code?: ChatErrorCode;
  retry_after?: number;
}

/**
 * User-friendly error messages for each error code
 */
const ERROR_MESSAGES: Record<ChatErrorCode, string> = {
  INPUT_LENGTH_EXCEEDED: "Message is too long. Please shorten your message.",
  CHAT_IP_RATE_LIMIT_EXCEEDED:
    "Too many requests. Please wait a moment and try again.",
  PORTFOLIO_OWNER_LIMIT_EXCEEDED: "AI services are currently unavailable.",
  UNKNOWN: "Something went wrong. Please try again.",
};

/**
 * Special error message for demo portfolio
 */
const DEMO_CHAT_ERROR_MESSAGE = "Chat is not enabled for the demo.";

/**
 * Parse error from AI SDK error object or Response
 */
export function parseApiError(error: Error | unknown): ChatApiError {
  // AI SDK wraps errors - try to extract the original error
  if (error instanceof Error) {
    try {
      // AI SDK error messages sometimes contain JSON
      const jsonMatch = error.message.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          message: parsed.message || error.message,
          error_code: parsed.error_code || "UNKNOWN",
          retry_after: parsed.retry_after,
        };
      }
    } catch {
      // Not JSON, use raw message
    }
    return {
      message: error.message,
      error_code: "UNKNOWN",
    };
  }

  return {
    message: "Something went wrong. Please try again.",
    error_code: "UNKNOWN",
  };
}

/**
 * Get user-friendly error message based on error code and context
 *
 * @param error - Parsed error from API
 * @param username - Portfolio username (for demo detection)
 * @returns User-friendly error message
 */
export function getChatErrorMessage(
  error: ChatApiError,
  username?: string
): string {
  // Special case: Demo portfolio - show chat not enabled message for any error
  if (isDemoUsername(username)) {
    return DEMO_CHAT_ERROR_MESSAGE;
  }

  const errorCode = error.error_code || "UNKNOWN";

  // Return user-friendly message for known error codes
  return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.UNKNOWN;
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: ChatApiError): boolean {
  return (
    error.error_code === "CHAT_IP_RATE_LIMIT_EXCEEDED" ||
    error.error_code === "PORTFOLIO_OWNER_LIMIT_EXCEEDED"
  );
}

/**
 * Check if error is an input validation error
 */
export function isInputError(error: ChatApiError): boolean {
  return error.error_code === "INPUT_LENGTH_EXCEEDED";
}
