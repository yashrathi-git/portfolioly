/**
 * User Settings Types
 *
 * Type definitions for user settings and portfolio publishing status.
 */

/**
 * Chat-specific settings for portfolio owners
 */
export interface PortfolioChatSettings {
  /** Whether chat is enabled at all */
  enabled: boolean;
  /** Public or private access mode */
  access_mode: "public" | "private";
  /** Total messages received this month */
  monthly_message_count?: number;
  /** Monthly limit for pricing */
  monthly_message_limit?: number;
  /** Date when monthly counter resets */
  month_reset_date?: string;
  /** Timestamp of last message received */
  last_message_at?: string;
}

/**
 * User settings for public portfolio management
 */
export interface UserSettings {
  /** Firebase user ID */
  user_id?: string;
  /** Public username for portfolio access (3-30 chars, alphanumeric with hyphens/underscores) */
  username?: string;
  /** Portfolio access mode */
  access_mode: "public" | "private";
  /** Whether public token generation is enabled */
  public_token_enabled?: boolean;
  /** Token version for invalidation */
  public_token_ver?: number;
  /** When settings were created */
  created_at?: string;
  /** When settings were last updated */
  updated_at?: string;
  /** Chat-specific settings */
  chat_settings?: PortfolioChatSettings;
}

/**
 * Portfolio publishing status derived from user settings
 */
export interface PublishStatus {
  /** Whether the user has set a username */
  hasUsername: boolean;
  /** Whether the portfolio is set to public access mode */
  isPublic: boolean;
  /** The full public URL if portfolio is published (e.g., "https://portfolioly.com/p/username") */
  publicUrl?: string;
  /** Whether the portfolio can be published (has username and is public) */
  canPublish: boolean;
  /** The username if set */
  username?: string;
}

/**
 * Response from username availability check
 */
export interface UsernameAvailabilityResponse {
  /** Whether the username is available */
  available: boolean;
  /** Reason if unavailable */
  reason?: string;
  /** Suggested alternative usernames */
  suggestions?: string[];
}

/**
 * Request payload for updating access mode
 */
export interface AccessModeUpdateRequest {
  /** Access mode for the portfolio */
  access_mode: "public" | "private";
}

/**
 * Request payload for updating username
 */
export interface UsernameUpdateRequest {
  /** New username */
  username: string;
}
