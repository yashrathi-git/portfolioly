"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DeployToVercelButtonProps {
  /**
   * Whether the button should be disabled
   */
  disabled?: boolean;
  /**
   * Optional custom className for styling
   */
  className?: string;
}

/**
 * Placeholder button for future Vercel deployment feature
 * Shows "Coming Soon" badge and displays informational modal on click
 */
export function DeployToVercelButton({
  disabled = false,
  className,
}: DeployToVercelButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={disabled}
        variant="outline"
        size="sm"
        className={cn(
          "relative text-muted-foreground hover:text-foreground",
          className
        )}
        title="Deploy to Vercel (Coming Soon)"
        aria-label="Deploy to Vercel - Coming Soon"
      >
        <Star className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Deploy to Vercel</span>
        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
          Soon
        </span>
      </Button>

      {/* Informational Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="relative bg-card border rounded-lg shadow-lg max-w-md w-full mx-4 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Icon */}
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Star className="h-8 w-8 text-primary" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2 text-center">
              <h2
                id="modal-title"
                className="text-xl font-semibold tracking-tight"
              >
                Deploy to Vercel
              </h2>
              <p className="text-sm text-muted-foreground">
                This feature is currently in development
              </p>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Soon you&apos;ll be able to deploy your portfolio to Vercel with
                a single click, giving you:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Custom domain support</li>
                <li>Lightning-fast global CDN</li>
                <li>Automatic SSL certificates</li>
                <li>Zero-configuration deployment</li>
              </ul>
              <p className="text-xs pt-2">
                We&apos;re working hard to bring this feature to you. Stay
                tuned!
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <Button
                onClick={handleCloseModal}
                className="w-full"
                variant="default"
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
