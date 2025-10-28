"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getUserSettings,
  updateUsername,
  updateAccessMode,
  checkUsernameAvailability,
  UserSettingsError,
} from "@/lib/api/userSettings";
import { toast } from "sonner";

export interface PublishSettingsPanelProps {
  /** Optional CSS class name */
  className?: string;
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
  className,
  onSettingsUpdate,
  initialUsername,
  initialAccessMode = "private",
  isLoading: externalLoading = false,
}: PublishSettingsPanelProps) {
  // State
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
  const [retryCount, setRetryCount] = useState(0);

  const effectiveUsername = username || initialUsername || "";
  const effectiveAccessMode = accessMode;

  // Refs for debouncing
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | undefined>(undefined);

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

      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error("Failed to load user settings:", error);
      const errorInfo = getErrorMessage(error);
      setLoadError(errorInfo);

      // Show toast for non-retryable errors
      if (!errorInfo.canRetry) {
        toast.error(errorInfo.message);
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

  // Handle access mode change
  const handleAccessModeChange = (value: "public" | "private") => {
    setAccessMode(value);
  };

  // Save changes
  const handleSave = async () => {
    try {
      setSaving(true);

      let pendingUsername = originalUsername;

      // Update username if changed
      if (username !== originalUsername) {
        // Validate format one more time
        const formatValidation = validateUsernameFormat(username);
        if (!formatValidation.valid) {
          toast.error(formatValidation.message || "Invalid username");
          return;
        }

        try {
          await updateUsername("", username); // userId not used by API
          setOriginalUsername(username);
          pendingUsername = username;
          toast.success("Username updated successfully");
        } catch (error) {
          const errorInfo = getErrorMessage(error);

          // Show specific error message with retry option if applicable
          if (errorInfo.canRetry) {
            toast.error(errorInfo.message, {
              action: {
                label: "Retry",
                onClick: () => handleSave(),
              },
            });
          } else {
            toast.error(errorInfo.message);
          }
          throw error; // Re-throw to prevent access mode update
        }
      }

      // Update access mode if changed
      if (accessMode !== originalAccessMode) {
        try {
          await updateAccessMode(accessMode);
          setOriginalAccessMode(accessMode);
          toast.success(
            `Portfolio is now ${accessMode === "public" ? "public" : "private"}`
          );
        } catch (error) {
          const errorInfo = getErrorMessage(error);

          if (errorInfo.canRetry) {
            toast.error(errorInfo.message, {
              action: {
                label: "Retry",
                onClick: () => handleSave(),
              },
            });
          } else {
            toast.error(errorInfo.message);
          }
          throw error;
        }
      }

      onSettingsUpdate?.({
        username: pendingUsername,
        accessMode,
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      // Error already handled above with specific messages
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
      toast.success("URL copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
      toast.error("Failed to copy URL");
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

  // Loading state
  if (loading || externalLoading) {
    return (
      <div className={cn("rounded-lg border bg-card p-6 shadow-sm", className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Error state with retry option
  if (loadError) {
    return (
      <div className={cn("rounded-lg border bg-card p-6 shadow-sm", className)}>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              {loadError.canRetry ? (
                <WifiOff className="h-5 w-5 text-destructive" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-sm">
                {loadError.canRetry
                  ? "Connection Error"
                  : "Unable to Load Settings"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {loadError.message}
              </p>
            </div>
          </div>

          {loadError.canRetry && (
            <Button
              onClick={() => {
                setRetryCount((prev) => prev + 1);
                loadSettings();
              }}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
              {retryCount > 0 && ` (Attempt ${retryCount + 1})`}
            </Button>
          )}

          {!loadError.canRetry && (
            <p className="text-xs text-muted-foreground">
              Please refresh the page to try again.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-6 shadow-sm space-y-6",
        className
      )}
    >
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Publish Settings
        </h3>
        <p className="text-sm text-muted-foreground">
          Manage your portfolio&apos;s public visibility and URL
        </p>
      </div>

      {/* Username Input */}
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            placeholder="your-username"
            className={cn(
              "pr-10",
              usernameValidation.state === "invalid" && "border-destructive",
              usernameValidation.state === "taken" && "border-destructive",
              usernameValidation.state === "valid" && "border-green-500"
            )}
            aria-invalid={
              usernameValidation.state === "invalid" ||
              usernameValidation.state === "taken"
            }
            aria-describedby="username-validation"
          />
          {/* Validation Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {usernameValidation.state === "validating" && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {usernameValidation.state === "valid" && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            {(usernameValidation.state === "invalid" ||
              usernameValidation.state === "taken") && (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>
        {/* Validation Message */}
        {usernameValidation.message && (
          <p
            id="username-validation"
            className={cn(
              "text-xs",
              usernameValidation.state === "valid"
                ? "text-green-600"
                : "text-destructive"
            )}
          >
            {usernameValidation.message}
          </p>
        )}
        {usernameValidation.state === "valid" &&
          !usernameValidation.message && (
            <p id="username-validation" className="text-xs text-green-600">
              Username is available
            </p>
          )}
        {usernameValidation.state === "error" && (
          <div className="flex items-center gap-2">
            <p className="text-xs text-destructive flex-1">
              {usernameValidation.message}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => validateUsername(username)}
              className="h-6 px-2 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        )}
        {!usernameValidation.message &&
          usernameValidation.state === "idle" &&
          username && (
            <p className="text-xs text-muted-foreground">
              3-30 characters, letters, numbers, hyphens, and underscores
            </p>
          )}

        {/* Username Suggestions */}
        {usernameValidation.state === "taken" &&
          usernameValidation.suggestions &&
          usernameValidation.suggestions.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-muted-foreground">
                Try these instead:
              </p>
              <div className="flex flex-wrap gap-2">
                {usernameValidation.suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => handleUsernameChange(suggestion)}
                    className="h-7 px-3 text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* Access Mode Toggle */}
      <div className="space-y-3">
        <Label>Portfolio Visibility</Label>
        <RadioGroup
          value={accessMode}
          onValueChange={(value) =>
            handleAccessModeChange(value as "public" | "private")
          }
        >
          <div className="flex items-center space-x-3 rounded-md border p-4 hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="private" id="private" />
            <Label
              htmlFor="private"
              className="flex-1 cursor-pointer font-normal"
            >
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span className="font-medium">Keep Private</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Only you can view your portfolio
              </p>
            </Label>
          </div>
          <div className="flex items-center space-x-3 rounded-md border p-4 hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="public" id="public" />
            <Label
              htmlFor="public"
              className="flex-1 cursor-pointer font-normal"
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="font-medium">Make Public</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Anyone with the link can view your portfolio
              </p>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Public URL Display */}
      {hasUsername && isPublic && (
        <div className="space-y-2">
          <Label>Your Public URL</Label>
          <TooltipProvider>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    value={publicUrl}
                    readOnly
                    className="flex-1 bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                    onClick={handleCopyUrl}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Click to copy</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyUrl}
                    className="shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Copy</span>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{copied ? "Copied!" : "Click to copy"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
          <div className="flex items-center gap-2 text-xs text-green-600">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Portfolio is live and publicly accessible</span>
          </div>
        </div>
      )}

      {/* Status Indicators */}
      {!hasUsername && (
        <div className="rounded-md bg-muted/50 p-4 space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Set a username to publish</p>
              <p className="text-xs text-muted-foreground">
                Choose a unique username to create your public portfolio URL
              </p>
            </div>
          </div>
        </div>
      )}

      {hasUsername && !isPublic && (
        <div className="rounded-md bg-muted/50 p-4 space-y-2">
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Portfolio is private</p>
              <p className="text-xs text-muted-foreground">
                Switch to &quot;Make Public&quot; to share your portfolio with
                others
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      {hasChanges && (
        <div className="pt-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    onClick={handleSave}
                    disabled={
                      saving ||
                      usernameValidation.state === "validating" ||
                      usernameValidation.state === "invalid" ||
                      usernameValidation.state === "taken" ||
                      usernameValidation.state === "error"
                    }
                    className="w-full"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </Button>
                </div>
              </TooltipTrigger>
              {(usernameValidation.state === "validating" ||
                usernameValidation.state === "invalid" ||
                usernameValidation.state === "taken" ||
                usernameValidation.state === "error") && (
                <TooltipContent>
                  <p>
                    {usernameValidation.state === "validating" &&
                      "Checking username availability..."}
                    {usernameValidation.state === "invalid" &&
                      "Please fix username errors"}
                    {usernameValidation.state === "taken" &&
                      "Username is already taken"}
                    {usernameValidation.state === "error" &&
                      "Unable to verify username"}
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
