/**
 * Environment variable configuration for template app
 */

/**
 * Get the portfolio username from environment variables
 * @throws Error if username is not set
 */
export function getUsername(): string {
  const username = process.env.NEXT_PUBLIC_USERNAME;

  if (!username) {
    throw new Error(
      "NEXT_PUBLIC_USERNAME is required. Please add it to your .env file."
    );
  }

  return username;
}

/**
 * Get the API base URL from environment variables
 * Defaults to http://localhost:8000 if not set
 */
export function getAPIBaseURL(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
}

/**
 * Get the public token from environment variables
 * Returns undefined if not set (token is optional)
 */
export function getPublicToken(): string | undefined {
  return process.env.NEXT_PUBLIC_PUBLIC_TOKEN;
}
