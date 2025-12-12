"use client";

/**
 * Support Nudge Dialog
 *
 * A subtle, non-intrusive dialog shown before PDF export.
 * Encourages users to star the GitHub repo while keeping the flow smooth.
 */

import { useState, useCallback } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const GITHUB_REPO_URL = "https://github.com/yashrathi-git/portfolioly";

interface SupportNudgeDialogProps {
  open: boolean;
  onContinue: () => void;
}

export function SupportNudgeDialog({
  open,
  onContinue,
}: SupportNudgeDialogProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleContinue = useCallback(() => {
    setIsExiting(true);
    // Small delay for exit animation
    setTimeout(() => {
      setIsExiting(false);
      onContinue();
    }, 150);
  }, [onContinue]);

  const handleStarAndContinue = useCallback(() => {
    window.open(GITHUB_REPO_URL, "_blank", "noopener,noreferrer");
    handleContinue();
  }, [handleContinue]);

  return (
    <Dialog open={open && !isExiting} onOpenChange={() => handleContinue()}>
      <DialogContent
        className={cn(
          "sm:max-w-md",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-200"
        )}
      >
        <div className="flex flex-col items-center text-center py-2">
          <div className="mb-4 p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Star className="h-6 w-6 text-amber-500" />
          </div>

          <DialogTitle className="text-lg font-medium mb-2">
            Enjoying Portfolioly?
          </DialogTitle>

          <DialogDescription className="text-sm text-muted-foreground mb-6 max-w-sm">
            Portfolioly is free and open source. If you find it useful, consider
            giving us a star on GitHub — it helps others discover the project!
          </DialogDescription>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleContinue}
              className="sm:order-1"
            >
              Continue to export
            </Button>
            <Button
              onClick={handleStarAndContinue}
              className="gap-2 sm:order-2"
            >
              <Star className="h-4 w-4" />
              Star on GitHub
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SupportNudgeDialog;
