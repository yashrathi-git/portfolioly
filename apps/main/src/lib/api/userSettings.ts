/**
 * User Settings API
 *
 * Handles user settings management including username and access mode configuration.
 */

import { env } from "@/lib/env";
import { getFirebaseAuth, getIdToken } from "../firebase";
import { ensureUsername } from "./publicToken";

export interface UserSettings {
  username?: string;
  access_mode: "public" | "private";
  chat_settings?: {
    enabled: boolean;
    access_mode: "public" | "private";
  };
  created_at?: string;
  updated_at?: string;
  public_token_enabled?: boolean;
  public_token_ver?: number;
}

export interface UsernameAvailabilityResponse {
  available: boolean;
  reason?: string;
}

export class UserSettingsError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = "UserSettingsError";
  }
}

/**
 * Get authorization headers with Firebase ID token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getIdToken();
  if (!token) {
    throw new UserSettingsError("User not authenticated", 401, "AUTH_REQUIRED");
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
      errorMessage = errorData.detail || errorMessage;
      errorCode = errorData.error_code || errorCode;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new UserSettingsError(errorMessage, response.status, errorCode);
  }

  // Handle empty responses (like 204 No Content)
  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return null as T;
  }

  try {
    return await response.json();
  } catch {
    throw new UserSettingsError("Invalid response format", response.status);
  }
}

/**
 * Get user settings
 *
 * @param authToken - Firebase auth token (optional, will fetch if not provided)
 * @returns User settings object
 * @throws UserSettingsError if the request fails
 */
export async function getUserSettings(
  authToken?: string
): Promise<UserSettings> {
  try {
    let token: string | undefined = authToken;
    if (!token) {
      token = (await getIdToken()) || undefined;
      if (!token) {
        throw new UserSettingsError(
          "User not authenticated",
          401,
          "AUTH_REQUIRED"
        );
      }
    }

    const response = await fetch(`${env.API_BASE_URL}/users/me/settings`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const settings = await handleResponse<UserSettings>(response);

    const resolvedAccessMode =
      settings.access_mode ?? settings.chat_settings?.access_mode ?? "private";

    settings.access_mode = resolvedAccessMode;
    if (settings.chat_settings) {
      settings.chat_settings.access_mode = resolvedAccessMode;
    } else {
      settings.chat_settings = {
        enabled: true,
        access_mode: resolvedAccessMode,
      };
    }

    if (!settings.username) {
      try {
        const auth = getFirebaseAuth();
        const firebaseUser = auth.currentUser;
        const userId = firebaseUser?.uid || extractUserIdFromToken(token ?? "");

        if (userId) {
          const ensuredUsername = await ensureUsername(userId, token!);
          settings.username = ensuredUsername;
        }
      } catch (ensureErr) {
        console.error(
          "Failed to ensure username while fetching settings:",
          ensureErr
        );
      }
    }

    return settings;
  } catch (error) {
    if (error instanceof UserSettingsError) {
      throw error;
    }

    console.error("Error fetching user settings:", error);
    throw new UserSettingsError(
      "Failed to fetch user settings",
      undefined,
      "FETCH_ERROR"
    );
  }
}

function extractUserIdFromToken(token: string): string | undefined {
  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      return undefined;
    }

    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded =
      typeof window === "undefined"
        ? Buffer.from(payload, "base64").toString("utf8")
        : atob(payload);
    const data = JSON.parse(decoded) as { user_id?: string; uid?: string };

    return data.user_id || data.uid;
  } catch {
    return undefined;
  }
}

/**
 * Update username for the authenticated user
 *
 * @param userId - Firebase user ID
 * @param username - New username (3-30 chars, alphanumeric with hyphens/underscores)
 * @param authToken - Firebase auth token (optional, will fetch if not provided)
 * @throws UserSettingsError if the request fails or username is invalid
 */
export async function updateUsername(
  userId: string,
  username: string,
  authToken?: string
): Promise<void> {
  try {
    const headers = authToken
      ? {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        }
      : await getAuthHeaders();

    const response = await fetch(`${env.API_BASE_URL}/users/me/settings`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ username }),
    });

    await handleResponse<UserSettings>(response);
  } catch (error) {
    if (error instanceof UserSettingsError) {
      throw error;
    }

    console.error("Error updating username:", error);
    throw new UserSettingsError(
      "Failed to update username",
      undefined,
      "UPDATE_ERROR"
    );
  }
}

/**
 * Update access mode (public/private) for the authenticated user's portfolio
 *
 * @param accessMode - "public" or "private"
 * @param authToken - Firebase auth token (optional, will fetch if not provided)
 * @throws UserSettingsError if the request fails
 */
export async function updateAccessMode(
  accessMode: "public" | "private",
  authToken?: string
): Promise<void> {
  try {
    const headers = authToken
      ? {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        }
      : await getAuthHeaders();

    const response = await fetch(`${env.API_BASE_URL}/users/me/settings`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ access_mode: accessMode }),
    });

    await handleResponse<UserSettings>(response);
  } catch (error) {
    if (error instanceof UserSettingsError) {
      throw error;
    }

    console.error("Error updating access mode:", error);
    throw new UserSettingsError(
      "Failed to update access mode",
      undefined,
      "UPDATE_ERROR"
    );
  }
}

/**
 * Check if a username is available
 *
 * @param username - Username to check
 * @param authToken - Firebase auth token (optional, will fetch if not provided)
 * @returns Object indicating availability and optional reason if unavailable
 * @throws UserSettingsError if the request fails
 */
export async function checkUsernameAvailability(
  username: string,
  authToken?: string
): Promise<UsernameAvailabilityResponse> {
  try {
    const headers = authToken
      ? {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        }
      : await getAuthHeaders();

    const response = await fetch(
      `${env.API_BASE_URL}/public/username/${username}/available`,
      {
        method: "GET",
        headers,
      }
    );

    return await handleResponse<UsernameAvailabilityResponse>(response);
  } catch (error) {
    if (error instanceof UserSettingsError) {
      throw error;
    }

    console.error("Error checking username availability:", error);
    throw new UserSettingsError(
      "Failed to check username availability",
      undefined,
      "CHECK_ERROR"
    );
  }
}
