"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Globe,
  Lock,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getUserSettings,
  updateUsername,
  updateAccessMode,
  checkUsernameAvailability,
  UserSettingsError,
} from "@/lib/api/userSettings";
import { useToast } from "@/hooks/useToast";
import { PublishSuccessDialog } from "./PublishSuccessDialog";

export interface PublishSettingsPanelProps {
  /** Trigger element for the popover */
  trigger?: ReactNode;
  /** Callback when settings are successfully updated */
  onSettingsUpdate?: (next?: {
    username?: string;
    accessMode?: "public" | "private";
  }) => void;
  /** Prefetched username to avoid duplicate loads */
  initialUsername?: string;
  /** Prefetched access mode to avoid duplicate loads */
  initialAccessMode?: "public" | "private";
  /** Whether parent is managing loading */
  isLoading?: boolean;
}

type ValidationState =
  | "idle"
  | "validating"
  | "valid"
  | "invalid"
  | "taken"
  | "error";

interface UsernameValidation {
  state: ValidationState;
  message?: string;
  suggestions?: string[];
}

interface LoadError {
  message: string;
  canRetry: boolean;
  statusCode?: number;
}

/**
 * Validate username format
 * Rules: 3-30 chars, alphanumeric with hyphens/underscores, no leading/trailing special chars
 */
function validateUsernameFormat(username: string): {
  valid: boolean;
  message?: string;
} {
  if (!username) {
    return { valid: false, message: "Username is required" };
  }

  if (username.length < 3) {
    return {
      valid: false,
      message: "Username must be at least 3 characters long",
    };
  }

  if (username.length > 30) {
    return {
      valid: false,
      message: "Username must be 30 characters or less",
    };
  }

  // Check for valid characters (alphanumeric, hyphens, underscores)
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return {
      valid: false,
      message:
        "Username can only contain letters, numbers, hyphens, and underscores",
    };
  }

  // Check for leading/trailing special characters
  if (/^[-_]|[-_]$/.test(username)) {
    return {
      valid: false,
      message: "Username cannot start or end with hyphens or underscores",
    };
  }

  // Check for consecutive special characters
  if (/[-_]{2,}/.test(username)) {
    return {
      valid: false,
      message: "Username cannot contain consecutive hyphens or underscores",
    };
  }

  return { valid: true };
}

/**
 * Generate username suggestions based on a taken username
 */
function generateUsernameSuggestions(username: string): string[] {
  const suggestions: string[] = [];
  const baseUsername = username.replace(/[-_]\d+$/, ""); // Remove trailing numbers

  // Add numeric suffixes
  for (let i = 1; i <= 3; i++) {
    const randomNum = Math.floor(Math.random() * 1000);
    suggestions.push(`${baseUsername}${randomNum}`);
  }

  // Add year suffix
  const currentYear = new Date().getFullYear();
  suggestions.push(`${baseUsername}${currentYear}`);

  // Add underscore variations
  if (!username.includes("_")) {
    suggestions.push(`${baseUsername}_dev`);
  }

  return suggestions.slice(0, 3); // Return top 3 suggestions
}

/**
 * Get user-friendly error message based on error type
 */
function getErrorMessage(error: unknown): {
  message: string;
  canRetry: boolean;
  statusCode?: number;
} {
  if (error instanceof UserSettingsError) {
    const statusCode = error.statusCode;

    // Network/connectivity errors
    if (!statusCode || statusCode >= 500) {
      return {
        message:
          "Unable to connect to the server. Please check your internet connection and try again.",
        canRetry: true,
        statusCode,
      };
    }

    // Authentication errors
    if (statusCode === 401 || statusCode === 403) {
      return {
        message:
          "Your session has expired. Please refresh the page and sign in again.",
        canRetry: false,
        statusCode,
      };
    }

    // Rate limiting
    if (statusCode === 429) {
      return {
        message: "Too many requests. Please wait a moment before trying again.",
        canRetry: true,
        statusCode,
      };
    }

    // Specific error messages from backend
    if (error.message) {
      return {
        message: error.message,
        canRetry: statusCode ? statusCode >= 500 : false,
        statusCode,
      };
    }
  }

  // Generic network error
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      message:
        "Network error. Please check your internet connection and try again.",
      canRetry: true,
    };
  }

  // Unknown error
  return {
    message: "An unexpected error occurred. Please try again.",
    canRetry: true,
  };
}

export function PublishSettingsPanel({
  trigger,
  onSettingsUpdate,
  initialUsername,
  initialAccessMode = "private",
  isLoading: externalLoading = false,
}: PublishSettingsPanelProps) {
  // State
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(!initialUsername && !externalLoading);
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState(initialUsername ?? "");
  const [originalUsername, setOriginalUsername] = useState(
    initialUsername ?? ""
  );
  const [accessMode, setAccessMode] = useState<"public" | "private">(
    initialAccessMode
  );
  const [originalAccessMode, setOriginalAccessMode] = useState<
    "public" | "private"
  >(initialAccessMode);
  const [usernameValidation, setUsernameValidation] =
    useState<UsernameValidation>({ state: "idle" });
  const [copied, setCopied] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");

  const effectiveUsername = username || initialUsername || "";
  const effectiveAccessMode = accessMode;

  // Refs for debouncing
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | undefined>(undefined);
  const { showSuccess, showError } = useToast();

  // Derived state
  const hasUsername = Boolean(effectiveUsername);
  const isPublic = effectiveAccessMode === "public";
  const hasChanges =
    username !== originalUsername || accessMode !== originalAccessMode;
  const publicUrl = hasUsername
    ? `${
        typeof window !== "undefined" ? window.location.origin : ""
      }/p/${effectiveUsername}`
    : undefined;

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const settings = await getUserSettings();

      const currentUsername = settings.username || "";
      const currentAccessMode =
        settings.chat_settings?.access_mode || "private";

      setUsername(currentUsername);
      setOriginalUsername(currentUsername);
      setAccessMode(currentAccessMode);
      setOriginalAccessMode(currentAccessMode);

      // If username exists, mark as valid
      if (currentUsername) {
        setUsernameValidation({ state: "valid" });
      }
    } catch (error) {
      console.error("Failed to load user settings:", error);
      const errorInfo = getErrorMessage(error);
      setLoadError(errorInfo);

      // Show toast for non-retryable errors
      if (!errorInfo.canRetry) {
        showError(errorInfo.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user settings if not provided
  useEffect(() => {
    if (!initialUsername && !externalLoading) {
      loadSettings();
    } else {
      setLoading(false);
      setUsernameValidation({ state: initialUsername ? "valid" : "idle" });
    }
  }, [initialUsername, externalLoading, loadSettings]);

  // Debounced username validation
  const validateUsername = useCallback(
    async (value: string) => {
      // Cancel any pending validation
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // If empty, reset validation
      if (!value) {
        setUsernameValidation({ state: "idle" });
        return;
      }

      // Check format first
      const formatValidation = validateUsernameFormat(value);
      if (!formatValidation.valid) {
        setUsernameValidation({
          state: "invalid",
          message: formatValidation.message,
        });
        return;
      }

      // If username hasn't changed from original, mark as valid
      if (value === originalUsername) {
        setUsernameValidation({ state: "valid" });
        return;
      }

      // Debounce availability check
      setUsernameValidation({ state: "validating" });

      debounceTimerRef.current = setTimeout(async () => {
        try {
          abortControllerRef.current = new AbortController();
          const result = await checkUsernameAvailability(value);

          if (result.available) {
            setUsernameValidation({ state: "valid" });
          } else {
            const suggestions = generateUsernameSuggestions(value);
            setUsernameValidation({
              state: "taken",
              message: result.reason || "Username is already taken",
              suggestions,
            });
          }
        } catch (error) {
          console.error("Username validation error:", error);
          const errorInfo = getErrorMessage(error);

          // For network errors, show error state with retry capability
          if (errorInfo.canRetry) {
            setUsernameValidation({
              state: "error",
              message: "Unable to verify username availability",
            });
          } else {
            setUsernameValidation({
              state: "invalid",
              message: errorInfo.message,
            });
          }
        }
      }, 500);
    },
    [originalUsername]
  );

  // Handle username change
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    validateUsername(value);
  };

  // Save changes
  const handleSave = async (overrides?: {
    nextUsername?: string;
    nextAccessMode?: "public" | "private";
  }) => {
    const targetUsername = overrides?.nextUsername ?? username;
    const targetAccessMode = overrides?.nextAccessMode ?? accessMode;

    const usernameChanged = targetUsername !== originalUsername;
    const accessModeChanged = targetAccessMode !== originalAccessMode;

    if (!usernameChanged && !accessModeChanged) {
      setOpen(false);
      return;
    }

    try {
      setSaving(true);

      let pendingUsername = originalUsername;

      if (usernameChanged) {
        const formatValidation = validateUsernameFormat(targetUsername);
        if (!formatValidation.valid) {
          showError(formatValidation.message || "Invalid username");
          return;
        }

        try {
          await updateUsername("", targetUsername);
          setOriginalUsername(targetUsername);
          setUsername(targetUsername);
          pendingUsername = targetUsername;
          showSuccess("Username updated successfully");
        } catch (error) {
          const errorInfo = getErrorMessage(error);
          showError(errorInfo.message);
          throw error;
        }
      }

      // Track if this is a first-time publish (going from private to public)
      const isFirstPublish =
        accessModeChanged &&
        originalAccessMode === "private" &&
        targetAccessMode === "public";

      if (accessModeChanged) {
        try {
          await updateAccessMode(targetAccessMode);
          setOriginalAccessMode(targetAccessMode);
          setAccessMode(targetAccessMode);

          // Show success dialog for first publish, otherwise just toast
          if (isFirstPublish) {
            const url = `${window.location.origin}/p/${pendingUsername}`;
            setPublishedUrl(url);
            setShowSuccessDialog(true);
          } else {
            showSuccess(
              `Portfolio is now ${
                targetAccessMode === "public" ? "public" : "private"
              }`
            );
          }
        } catch (error) {
          const errorInfo = getErrorMessage(error);
          showError(errorInfo.message);
          throw error;
        }
      }

      onSettingsUpdate?.({
        username: pendingUsername,
        accessMode: targetAccessMode,
      });

      setOpen(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
      if (accessModeChanged) {
        setAccessMode(originalAccessMode);
      }
    } finally {
      setSaving(false);
    }
  };

  // Copy URL to clipboard
  const handleCopyUrl = async () => {
    if (!publicUrl) return;

    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      showSuccess("URL copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
      showError("Failed to copy URL");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const hostname = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {trigger || (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5"
            >
              <Globe className="h-4 w-4" />
              Publish
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="w-[360px] max-w-[calc(100vw-3rem)] p-4 sm:w-[400px]"
        >
          {loading || externalLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : loadError ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Connection Error</p>
                  <p className="text-xs text-muted-foreground">
                    {loadError.message}
                  </p>
                </div>
              </div>
              {loadError.canRetry && (
                <Button
                  onClick={loadSettings}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Try Again
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div>
                <h4 className="font-semibold text-sm">Portfolio URL</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure your public portfolio settings
                </p>
              </div>

              {/* URL Editor */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="min-w-0 flex-1 flex items-center gap-1 bg-muted/50 rounded-md border px-3 py-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {hostname}/p/
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="username"
                      className={cn(
                        "flex-1 bg-transparent text-sm outline-none min-w-0",
                        (usernameValidation.state === "invalid" ||
                          usernameValidation.state === "taken") &&
                          "text-destructive"
                      )}
                    />
                    <div className="flex-shrink-0">
                      {usernameValidation.state === "validating" && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      )}
                      {usernameValidation.state === "valid" && (
                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      )}
                      {(usernameValidation.state === "invalid" ||
                        usernameValidation.state === "taken") && (
                        <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                      )}
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleSave()}
                          disabled={
                            !hasChanges ||
                            saving ||
                            usernameValidation.state === "validating" ||
                            usernameValidation.state === "invalid" ||
                            usernameValidation.state === "taken" ||
                            usernameValidation.state === "error"
                          }
                          className="h-9 w-9 shrink-0"
                          aria-label="Save publish settings"
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {hasChanges ? "Save changes" : "All changes saved"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {hasUsername && isPublic && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleCopyUrl}
                            className="h-9 w-9 shrink-0"
                            aria-label="Copy published URL"
                          >
                            {copied ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{copied ? "Copied!" : "Copy published URL"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>

                {/* Validation Message */}
                {usernameValidation.message && (
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "text-xs flex-1",
                        usernameValidation.state === "valid"
                          ? "text-green-600"
                          : "text-destructive"
                      )}
                    >
                      {usernameValidation.message}
                    </p>
                    {usernameValidation.state === "error" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => validateUsername(username)}
                        className="h-6 px-2 text-xs"
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                )}

                {usernameValidation.state === "valid" &&
                  !usernameValidation.message && (
                    <p className="text-xs text-green-600">
                      Username is available
                    </p>
                  )}

                {usernameValidation.state === "idle" && username && (
                  <p className="text-xs text-muted-foreground">
                    3-30 characters, letters, numbers, hyphens, and underscores
                  </p>
                )}

                {/* Username Suggestions */}
                {usernameValidation.state === "taken" &&
                  usernameValidation.suggestions &&
                  usernameValidation.suggestions.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">
                        Suggestions:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {usernameValidation.suggestions.map((suggestion) => (
                          <Button
                            key={suggestion}
                            variant="outline"
                            size="sm"
                            onClick={() => handleUsernameChange(suggestion)}
                            className="h-6 px-2 text-xs"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {hasUsername ? (
                  isPublic ? (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleSave({ nextAccessMode: "private" })}
                      disabled={saving}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Make Private
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleSave({ nextAccessMode: "public" })}
                      disabled={
                        saving ||
                        !hasUsername ||
                        usernameValidation.state === "validating" ||
                        usernameValidation.state === "invalid" ||
                        usernameValidation.state === "taken" ||
                        usernameValidation.state === "error"
                      }
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Publish Portfolio
                    </Button>
                  )
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    <Globe className="h-4 w-4 mr-2" />
                    Publish Portfolio
                  </Button>
                )}

                <div className="text-xs text-center text-muted-foreground space-y-1">
                  {!hasUsername && (
                    <p>Set a username to publish your portfolio.</p>
                  )}
                  {hasUsername && !isPublic && (
                    <p>Your portfolio is currently private.</p>
                  )}
                  {hasUsername && isPublic && publicUrl && (
                    <div className="flex flex-col items-center gap-1 text-green-600">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Portfolio is live</span>
                      </div>
                      <p className="text-xs text-center">
                        Anyone can access it{" "}
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium underline hover:text-green-700"
                        >
                          here
                        </a>
                        {"."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <PublishSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        portfolioUrl={publishedUrl}
      />
    </>
  );
}
