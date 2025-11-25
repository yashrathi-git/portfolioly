"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, MessageCircle, X } from "lucide-react";
import { DiscordIcon } from "@/components/icons/DiscordIcon";
import { getDiscordLink, GITHUB_REPO_URL } from "@/lib/utils/links";

const STORAGE_KEY = "portfolioly_support_dialog_shown";

export function SupportDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasShown = localStorage.getItem(STORAGE_KEY);
    if (!hasShown) {
      const timer = setTimeout(() => setOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  const discordLink = getDiscordLink();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Welcome to Portfolioly!
          </DialogTitle>
          <DialogDescription>
            We&apos;re glad you&apos;re here. Here&apos;s how you can connect
            with us.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <DiscordIcon className="h-5 w-5 mt-0.5 text-[#5865F2]" />
            <div className="flex-1">
              <p className="font-medium text-sm">
                Need help or have questions?
              </p>
              <p className="text-sm text-muted-foreground">
                Join our Discord community for support and updates.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.open(discordLink, "_blank")}
              >
                <DiscordIcon className="h-4 w-4 mr-2" />
                Join Discord
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Star className="h-5 w-5 mt-0.5 text-yellow-500" />
            <div className="flex-1">
              <p className="font-medium text-sm">Enjoying Portfolioly?</p>
              <p className="text-sm text-muted-foreground">
                A star on GitHub helps us grow and improve!
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.open(GITHUB_REPO_URL, "_blank")}
              >
                <Star className="h-4 w-4 mr-2" />
                Star on GitHub
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4 mr-1" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
