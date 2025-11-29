"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { GITHUB_REPO_URL } from "@/lib/utils/links";

const COOKIE_NAME = "portfolioly_support_shown_c";
const MAX_SHOW_COUNT = 2;
const SHOW_DELAY_MS = 4500;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

function setCookie(name: string, value: string, days: number = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export function SupportDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const shownCount = parseInt(getCookie(COOKIE_NAME) || "0", 10);

    if (shownCount < MAX_SHOW_COUNT) {
      const timer = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    const currentCount = parseInt(getCookie(COOKIE_NAME) || "0", 10);
    setCookie(COOKIE_NAME, String(currentCount + 1));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogPortal>
        <DialogOverlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-300" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border bg-background shadow-lg sm:rounded-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "duration-300 ease-out"
          )}
        >
          <DialogPrimitive.Close
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          <div className="p-6 pb-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/10">
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold">Enjoying Portfolioly?</h3>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              If you like what we&apos;re building, it would really help if you
              could star us on GitHub. It means a lot and helps others discover
              the project :)
            </p>

            <p className="text-sm text-muted-foreground">
              Questions or issues?{" "}
              <a
                href={`${GITHUB_REPO_URL}/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-foreground hover:underline font-medium"
              >
                <GitHubIcon className="h-3.5 w-3.5" />
                Report here
              </a>
            </p>
          </div>

          <div className="flex border-t">
            <Button
              variant="ghost"
              className="flex-1 rounded-none h-12 text-muted-foreground hover:text-foreground"
              onClick={handleClose}
            >
              Continue
            </Button>
            <div className="w-px bg-border" />
            <Button
              variant="ghost"
              className="flex-1 rounded-none h-12 gap-2 font-medium"
              onClick={() => {
                window.open(GITHUB_REPO_URL, "_blank");
                handleClose();
              }}
            >
              <GitHubIcon className="h-4 w-4" />
              Star on GitHub
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
