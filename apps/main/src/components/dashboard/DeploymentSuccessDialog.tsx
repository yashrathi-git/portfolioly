"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  MessageCircle,
  PartyPopper,
  Copy,
  Check,
  Star,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { LinkedInIcon } from "@/components/icons/LinkedInIcon";
import { RedditIcon } from "@/components/icons/RedditIcon";

interface DeploymentSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deployedUrl: string;
}

export function DeploymentSuccessDialog({
  open,
  onOpenChange,
  deployedUrl,
}: DeploymentSuccessDialogProps) {
  const [copied, setCopied] = useState(false);
  const hasLaunchedConfetti = useRef(false);

  const discordLink = process.env.NEXT_PUBLIC_DISCORD_LINK;
  const githubRepoUrl = "https://github.com/yashrathi-git/portfolioly";

  // Fire confetti when dialog opens
  useEffect(() => {
    if (open && !hasLaunchedConfetti.current) {
      hasLaunchedConfetti.current = true;

      // Side cannons confetti effect
      const end = Date.now() + 3 * 1000;
      const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

      const frame = () => {
        if (Date.now() > end) return;

        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          startVelocity: 60,
          origin: { x: 0, y: 0.5 },
          colors: colors,
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          startVelocity: 60,
          origin: { x: 1, y: 0.5 },
          colors: colors,
        });

        requestAnimationFrame(frame);
      };

      frame();
    }
  }, [open]);

  // Reset confetti flag when dialog closes
  useEffect(() => {
    if (!open) {
      hasLaunchedConfetti.current = false;
    }
  }, [open]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(deployedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = (platform: "linkedin" | "reddit") => {
    const encodedUrl = encodeURIComponent(deployedUrl);
    
    // Platform-optimized share text
    const linkedInText = encodeURIComponent(
      `I just launched my personal portfolio website using Portfolioly! 🚀\n\nCheck it out: ${deployedUrl}\n\nBuilt with AI-powered portfolio generation - it was incredibly easy to set up.\n\n#portfolio #webdev #career`
    );
    
    const redditTitle = encodeURIComponent(
      "I built my personal portfolio website using Portfolioly - check it out!"
    );

    let shareUrl = "";
    const width = platform === "reddit" ? 800 : 600;
    const height = 600;

    if (platform === "linkedin") {
      // LinkedIn share with pre-filled text
      shareUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${linkedInText}`;
    } else if (platform === "reddit") {
      shareUrl = `https://www.reddit.com/submit?url=${encodedUrl}&title=${redditTitle}`;
    }

    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      shareUrl,
      "share-dialog",
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
            <PartyPopper className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            Congratulations! 🎉
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Your portfolio has been successfully deployed to Vercel!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Portfolio Link */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Your live portfolio
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono bg-background rounded px-3 py-2 truncate border">
                {deployedUrl}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(deployedUrl, "_blank")}
                className="shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Support Message */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm text-foreground leading-relaxed">
              Portfolioly is free and always will be. If you find it useful,
              a star on GitHub helps us grow!
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 gap-2"
              onClick={() => window.open(githubRepoUrl, "_blank")}
            >
              <Star className="h-4 w-4" />
              Star on GitHub
            </Button>
          </div>

          {/* Discord Community */}
          {discordLink && (
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <MessageCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Need help or have feedback?</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Join our Discord community for support and updates.
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 mt-1 text-indigo-500 hover:text-indigo-600"
                  onClick={() => window.open(discordLink, "_blank")}
                >
                  Join Discord →
                </Button>
              </div>
            </div>
          )}

          {/* Social Share */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-center mb-3">
              Share your portfolio
            </p>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                size="lg"
                className={cn(
                  "gap-2 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] hover:border-[#0A66C2]/30",
                  "transition-colors"
                )}
                onClick={() => handleShare("linkedin")}
              >
                <LinkedInIcon className="h-5 w-5" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                size="lg"
                className={cn(
                  "gap-2 hover:bg-[#FF4500]/10 hover:text-[#FF4500] hover:border-[#FF4500]/30",
                  "transition-colors"
                )}
                onClick={() => handleShare("reddit")}
              >
                <RedditIcon className="h-5 w-5" />
                Reddit
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button onClick={() => onOpenChange(false)} className="px-8">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
