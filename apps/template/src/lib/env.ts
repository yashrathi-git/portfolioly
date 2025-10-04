/**
 * Environment variable configuration for template app
 */

/**
 * Get the PSK token from environment variables
 * This token is used to authenticate with the backend API
 */
export function getPSKToken(): string {
  const token = process.env.NEXT_PUBLIC_PSK_TOKEN;

  if (!token) {
    throw new Error(
      "NEXT_PUBLIC_PSK_TOKEN environment variable is not set. Please add it to your .env.local file."
    );
  }

  return token;
}

/**
 * Get the portfolio username from environment variables
 */
export function getUsername(): string {
  const username = process.env.NEXT_PUBLIC_USERNAME;

  if (!username) {
    throw new Error(
      "NEXT_PUBLIC_USERNAME environment variable is not set. Please add it to your .env.local file."
    );
  }

  return username;
}

/**
 * Get the API base URL from environment variables
 */
export function getAPIBaseURL(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
}
