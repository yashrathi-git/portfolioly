/**
 * Public Token API
 *
 * Handles username and public token management for portfolio chat functionality.
 */

import { env } from "@/lib/env";

export interface EnsureUsernameResponse {
  username: string;
}

export interface EnsureTokenResponse {
  token: string;
}

export class PublicTokenError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = "PublicTokenError";
  }
}

/**
 * Ensure a username exists for the given user ID
 * Creates a username if one doesn't exist
 *
 * @param userId - Firebase user ID
 * @param authToken - Firebase auth token
 * @returns Username for the user
 * @throws PublicTokenError if the request fails
 */
export async function ensureUsername(
  userId: string,
  authToken: string
): Promise<string> {
  try {
    const response = await fetch(`${env.API_BASE_URL}/public/ensure-username`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new PublicTokenError(
        `Failed to get username: ${response.statusText}`,
        response.status
      );
    }

    const data: EnsureUsernameResponse = await response.json();
    return data.username;
  } catch (error) {
    if (error instanceof PublicTokenError) {
      throw error;
    }
    throw new PublicTokenError(
      "Failed to ensure username",
      undefined,
      error as Error
    );
  }
}

/**
 * Ensure a public token exists for the given username
 * Creates a token if one doesn't exist
 *
 * @param username - Portfolio username
 * @returns Public token for chat authentication
 * @throws PublicTokenError if the request fails or portfolio not found
 */
export async function ensurePublicToken(
  username: string,
  authToken?: string
): Promise<string> {
  try {
    const response = await fetch(`${env.API_BASE_URL}/public/ensure-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ username }),
    });

    if (response.status === 404) {
      throw new PublicTokenError("Portfolio not found", 404);
    }

    if (!response.ok) {
      throw new PublicTokenError(
        `Failed to fetch token: ${response.statusText}`,
        response.status
      );
    }

    const data: EnsureTokenResponse = await response.json();
    return data.token;
  } catch (error) {
    if (error instanceof PublicTokenError) {
      throw error;
    }
    throw new PublicTokenError(
      "Failed to ensure public token",
      undefined,
      error as Error
    );
  }
}

/**
 * Fetch both username and public token for a user
 * Convenience function that combines ensureUsername and ensurePublicToken
 *
 * @param userId - Firebase user ID
 * @param authToken - Firebase auth token
 * @returns Object containing username and public token
 * @throws PublicTokenError if either request fails
 */
export async function fetchUsernameAndToken(
  userId: string,
  authToken: string
): Promise<{ username: string; publicToken: string }> {
  const username = await ensureUsername(userId, authToken);
  const publicToken = await ensurePublicToken(username, authToken);

  return { username, publicToken };
}
