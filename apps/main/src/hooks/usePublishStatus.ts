/**
 * Hook for managing portfolio publish status
 *
 * Fetches user settings and calculates publish status including:
 * - Whether user has set a username
 * - Whether portfolio is public
 * - Public URL if published
 * - Whether portfolio can be published
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getUserSettings, UserSettingsError } from "@/lib/api/userSettings";
import type { PublishStatus } from "@/types/userSettings";

export interface UsePublishStatusResult {
  /** Calculated publish status */
  publishStatus: PublishStatus | null;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch user settings and recalculate status */
  refetch: () => Promise<void>;
}

/**
 * Get the public hostname for portfolio URLs
 * In production, this would be the actual domain
 * In development, use localhost with appropriate port
 */
function getPublicHostname(): string {
  if (typeof window === "undefined") {
    return "http://localhost:3000";
  }

  // Use the current window location origin
  // This works for both development and production
  return window.location.origin;
}

/**
 * Calculate publish status from user settings
 */
function calculatePublishStatus(
  username?: string,
  accessMode?: "public" | "private"
): PublishStatus {
  const hasUsername = Boolean(username && username.length > 0);
  const isPublic = accessMode === "public";
  const canPublish = hasUsername && isPublic;

  const publicUrl = hasUsername
    ? `${getPublicHostname()}/p/${username}`
    : undefined;

  return {
    hasUsername,
    isPublic,
    publicUrl: canPublish ? publicUrl : undefined,
    canPublish,
    username,
  };
}

/**
 * Custom hook for fetching and managing portfolio publish status
 *
 * @returns Publish status with loading and error states
 *
 * @example
 * ```tsx
 * function PublishSettings() {
 *   const { publishStatus, isLoading, error, refetch } = usePublishStatus();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *
 *   return (
 *     <div>
 *       {publishStatus?.canPublish ? (
 *         <a href={publishStatus.publicUrl}>View Portfolio</a>
 *       ) : (
 *         <p>Set a username and make your portfolio public to share it</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePublishStatus(): UsePublishStatusResult {
  const { user } = useAuth();
  const [publishStatus, setPublishStatus] = useState<PublishStatus | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPublishStatus = useCallback(async () => {
    if (!user) {
      setPublishStatus(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const settings = await getUserSettings();

      // Extract username and access mode from settings
      const username = settings.username;
      const accessMode = settings.chat_settings?.access_mode || "private";

      // Calculate publish status
      const status = calculatePublishStatus(username, accessMode);
      setPublishStatus(status);
    } catch (err) {
      let errorMessage = "Failed to fetch publish status";

      if (err instanceof UserSettingsError) {
        // Handle specific error cases
        if (err.statusCode === 401) {
          errorMessage = "Please sign in to view publish status";
        } else if (err.statusCode === 404) {
          // User settings don't exist yet - this is okay, just no username set
          const status = calculatePublishStatus(undefined, "private");
          setPublishStatus(status);
          setIsLoading(false);
          return;
        } else {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      console.error("Error fetching publish status:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchPublishStatus();
    } else {
      setPublishStatus(null);
      setError(null);
      setIsLoading(false);
    }
  }, [user, fetchPublishStatus]);

  return {
    publishStatus,
    isLoading,
    error,
    refetch: fetchPublishStatus,
  };
}
