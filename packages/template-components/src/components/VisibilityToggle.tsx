/**
 * Portfolio visibility toggle component with confirmation dialogs
 */

import React, { useState } from "react";

interface VisibilityToggleProps {
  isPublic: boolean;
  username?: string;
  onVisibilityChange: (isPublic: boolean) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  type: "make-public" | "make-private";
  username?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationModal({
  isOpen,
  type,
  username,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const isPublicAction = type === "make-public";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">
          {isPublicAction
            ? "Make Portfolio Public?"
            : "Make Portfolio Private?"}
        </h3>

        <div className="mb-6">
          {isPublicAction ? (
            <div>
              <p className="text-gray-600 mb-3">
                Your portfolio will be publicly accessible at:
              </p>
              <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
                portfolioly.com/{username}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Anyone with this link will be able to view your portfolio.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                Your portfolio will no longer be publicly accessible.
              </p>
              <p className="text-sm text-gray-500">
                Only you will be able to view it when signed in.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-md transition-colors ${
              isPublicAction
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-600 hover:bg-gray-700"
            }`}
          >
            {isPublicAction ? "Make Public" : "Make Private"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function VisibilityToggle({
  isPublic,
  username,
  onVisibilityChange,
  disabled = false,
  className = "",
}: VisibilityToggleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingVisibility, setPendingVisibility] = useState<boolean | null>(
    null
  );

  const handleToggleClick = () => {
    const newVisibility = !isPublic;

    // Show confirmation for significant changes
    if (newVisibility && !username) {
      // Can't make public without username
      return;
    }

    setPendingVisibility(newVisibility);
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    if (pendingVisibility === null) return;

    setIsLoading(true);
    setShowConfirmation(false);

    try {
      await onVisibilityChange(pendingVisibility);
    } catch (error) {
      console.error("Failed to update visibility:", error);
      // You might want to show an error toast here
    } finally {
      setIsLoading(false);
      setPendingVisibility(null);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setPendingVisibility(null);
  };

  const canMakePublic = Boolean(username);
  const isDisabled = disabled || isLoading || (!canMakePublic && !isPublic);

  return (
    <>
      <div className={`flex items-center justify-between ${className}`}>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">
            Portfolio Visibility
          </h3>
          <p className="text-sm text-gray-500">
            {isPublic
              ? `Your portfolio is public at portfolioly.com/${username}`
              : "Your portfolio is private and only visible to you"}
          </p>
          {!canMakePublic && !isPublic && (
            <p className="text-xs text-amber-600 mt-1">
              Set a username before making your portfolio public
            </p>
          )}
        </div>

        <div className="ml-4">
          <button
            onClick={handleToggleClick}
            disabled={isDisabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isDisabled
                ? "bg-gray-200 cursor-not-allowed"
                : isPublic
                ? "bg-blue-600"
                : "bg-gray-200"
            }`}
          >
            <span className="sr-only">
              {isPublic ? "Make portfolio private" : "Make portfolio public"}
            </span>
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isPublic ? "translate-x-6" : "translate-x-1"
              } ${isLoading ? "animate-pulse" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Status indicator */}
      <div className="mt-2 flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isPublic ? "bg-green-500" : "bg-gray-400"
          }`}
        />
        <span className="text-xs text-gray-500">
          {isPublic ? "Public" : "Private"}
        </span>
        {isLoading && (
          <span className="text-xs text-blue-600">Updating...</span>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        type={pendingVisibility ? "make-public" : "make-private"}
        username={username}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}

export default VisibilityToggle;
