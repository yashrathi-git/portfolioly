/**
 * Username selection component with real-time availability checking
 */

import React, { useState, useEffect, useCallback } from "react";
import { PublicApiClient } from "../clients/public-api-client";
import { TemplateConfig } from "../config/template-config";

interface UsernameSelectorProps {
  config: TemplateConfig;
  currentUsername?: string;
  onUsernameChange: (username: string, isValid: boolean) => void;
  onUsernameSelect?: (username: string) => void;
  disabled?: boolean;
  className?: string;
}

interface ValidationState {
  isChecking: boolean;
  isValid: boolean;
  isAvailable: boolean | null;
  error?: string;
  suggestions?: string[];
}

export function UsernameSelector({
  config,
  currentUsername = "",
  onUsernameChange,
  onUsernameSelect,
  disabled = false,
  className = "",
}: UsernameSelectorProps) {
  const [username, setUsername] = useState(currentUsername);
  const [validation, setValidation] = useState<ValidationState>({
    isChecking: false,
    isValid: false,
    isAvailable: null,
  });
  const [showSuggestions, setShowSuggestions] = useState(false);

  const publicClient = new PublicApiClient(config);

  // Debounced availability check
  const checkAvailability = useCallback(
    debounce(async (usernameToCheck: string) => {
      if (!usernameToCheck || usernameToCheck === currentUsername) {
        setValidation((prev) => ({
          ...prev,
          isChecking: false,
          isAvailable: null,
        }));
        return;
      }

      setValidation((prev) => ({ ...prev, isChecking: true }));

      try {
        // First validate format
        const formatValidation = publicClient.validateUsername(usernameToCheck);
        if (!formatValidation.valid) {
          setValidation({
            isChecking: false,
            isValid: false,
            isAvailable: false,
            error: formatValidation.error,
          });
          return;
        }

        // Then check availability
        const isAvailable = await publicClient.checkUsernameAvailability(
          usernameToCheck
        );

        setValidation({
          isChecking: false,
          isValid: formatValidation.valid && isAvailable,
          isAvailable,
          error: isAvailable ? undefined : "Username is already taken",
        });
      } catch (error) {
        setValidation({
          isChecking: false,
          isValid: false,
          isAvailable: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to check availability",
        });
      }
    }, 500),
    [currentUsername, publicClient]
  );

  // Handle username input changes
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setShowSuggestions(false);

    // Basic validation
    const formatValidation = publicClient.validateUsername(value);
    const isValid =
      formatValidation.valid &&
      (value === currentUsername || validation.isAvailable === true);

    onUsernameChange(value, isValid);

    if (value && value !== currentUsername) {
      checkAvailability(value);
    } else {
      setValidation({
        isChecking: false,
        isValid: value === currentUsername,
        isAvailable: null,
      });
    }
  };

  // Handle username selection (e.g., from suggestions)
  const handleUsernameSelect = (selectedUsername: string) => {
    setUsername(selectedUsername);
    setShowSuggestions(false);
    handleUsernameChange(selectedUsername);
    onUsernameSelect?.(selectedUsername);
  };

  // Get suggestions when input is focused and has validation errors
  const handleFocus = async () => {
    if (username && !validation.isValid && !validation.isChecking) {
      try {
        // This would call a suggestions API endpoint
        // For now, we'll generate simple suggestions
        const suggestions = generateSimpleSuggestions(username);
        setValidation((prev) => ({ ...prev, suggestions }));
        setShowSuggestions(true);
      } catch (error) {
        console.error("Failed to get suggestions:", error);
      }
    }
  };

  // Update username when prop changes
  useEffect(() => {
    if (currentUsername !== username) {
      setUsername(currentUsername);
    }
  }, [currentUsername]);

  const getInputClassName = () => {
    let baseClass =
      "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors";

    if (disabled) {
      baseClass += " bg-gray-100 cursor-not-allowed";
    } else if (validation.isChecking) {
      baseClass += " border-yellow-300 focus:ring-yellow-500";
    } else if (username && validation.isValid) {
      baseClass += " border-green-300 focus:ring-green-500";
    } else if (username && validation.error) {
      baseClass += " border-red-300 focus:ring-red-500";
    } else {
      baseClass += " border-gray-300 focus:ring-blue-500";
    }

    return baseClass;
  };

  const getStatusIcon = () => {
    if (validation.isChecking) {
      return (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
        </div>
      );
    }

    if (username && validation.isValid) {
      return (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
          ✓
        </div>
      );
    }

    if (username && validation.error) {
      return (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
          ✗
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={username}
          onChange={(e) => handleUsernameChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          disabled={disabled}
          placeholder="Enter username"
          className={getInputClassName()}
          autoComplete="username"
        />
        {getStatusIcon()}
      </div>

      {/* Validation message */}
      {validation.error && (
        <p className="mt-1 text-sm text-red-600">{validation.error}</p>
      )}

      {username && validation.isValid && (
        <p className="mt-1 text-sm text-green-600">Username is available!</p>
      )}

      {/* Username suggestions */}
      {showSuggestions &&
        validation.suggestions &&
        validation.suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <div className="p-2 text-xs text-gray-500 border-b">
              Suggestions:
            </div>
            {validation.suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleUsernameSelect(suggestion)}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

      {/* Helper text */}
      <p className="mt-1 text-xs text-gray-500">
        Username must be 3-30 characters, letters, numbers, hyphens, and
        underscores only.
      </p>
    </div>
  );
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Simple suggestion generator (in a real app, this would call an API)
function generateSimpleSuggestions(username: string): string[] {
  const base = username.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const suggestions = [];

  if (base.length >= 3) {
    suggestions.push(
      `${base}dev`,
      `${base}pro`,
      `${base}${Math.floor(Math.random() * 100)}`,
      `${base}tech`,
      `${base}${new Date().getFullYear()}`
    );
  }

  return suggestions.slice(0, 3);
}

export default UsernameSelector;
