"use client";

import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";

export interface FullscreenPreviewButtonProps {
  /**
   * Whether the button should be disabled
   * Typically disabled when no portfolio content exists
   */
  disabled?: boolean;
  /**
   * Optional custom className for styling
   */
  className?: string;
}

/**
 * Button component that opens the portfolio preview in fullscreen mode in a new tab
 * Opens the `/preview` route which shows the authenticated user's portfolio
 */
export function FullscreenPreviewButton({
  disabled = false,
  className,
}: FullscreenPreviewButtonProps) {
  const handleClick = () => {
    // Open preview page in new tab
    window.open("/preview", "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled}
      variant="outline"
      size="sm"
      className={className}
      title={
        disabled
          ? "No content to preview"
          : "Open fullscreen preview in new tab"
      }
      aria-label="Open fullscreen preview in new tab"
    >
      <Maximize2 className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Fullscreen</span>
    </Button>
  );
}
