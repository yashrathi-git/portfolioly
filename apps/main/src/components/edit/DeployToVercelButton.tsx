"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Rocket, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { env } from "@/lib/env";

interface DeployToVercelButtonProps {
  username?: string;
  publicToken?: string;
  className?: string;
}

export function DeployToVercelButton({
  username,
  publicToken,
  className,
}: DeployToVercelButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  const githubRepoUrl = "https://github.com/yashrathi-git/portfolioly-template";
  const apiBaseUrl = env.API_BASE_URL;
  const discordLink = process.env.NEXT_PUBLIC_DISCORD_LINK;

  const isConfigured = Boolean(username && publicToken);

  // Generate Vercel deploy URL with environment variables
  const deployUrl = new URL("https://vercel.com/new/clone");
  deployUrl.searchParams.set("repository-url", githubRepoUrl);
  deployUrl.searchParams.set("project-name", `${username || "my"}-portfolio`);
  deployUrl.searchParams.set(
    "repository-name",
    `${username || "my"}-portfolio`
  );

  // Define required environment variables
  deployUrl.searchParams.set(
    "env",
    "NEXT_PUBLIC_USERNAME,NEXT_PUBLIC_PUBLIC_TOKEN,NEXT_PUBLIC_API_BASE_URL"
  );

  // Pre-fill default values using envDefaults parameter
  if (isConfigured) {
    const envDefaults = {
      NEXT_PUBLIC_USERNAME: username,
      NEXT_PUBLIC_PUBLIC_TOKEN: publicToken,
      NEXT_PUBLIC_API_BASE_URL: apiBaseUrl,
    };
    deployUrl.searchParams.set("envDefaults", JSON.stringify(envDefaults));
  }

  const handleDeploy = () => {
    window.open(deployUrl.toString(), "_blank");
    setShowDialog(false);
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Rocket className="h-4 w-4" />
          <span className="hidden sm:inline">Deploy to Vercel</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Deploy to Vercel
          </DialogTitle>
          <DialogDescription>
            Your portfolio will be deployed to Vercel with your credentials
            pre-configured
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isConfigured ? (
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-900 p-4">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                ⚠️ Setup Required
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                Please set your username and make your portfolio public in
                Settings before deploying.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Vercel will open for deployment. Login to your Vercel account,
                  and everything will be pre-filled. Just click next and deploy
                  the application.
                </p>
              </div>

              {discordLink && (
                <div className="rounded-lg bg-muted p-4 flex items-start gap-3">
                  <MessageCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Need help?</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Join our{" "}
                      <a
                        href={discordLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium"
                      >
                        Discord community
                      </a>{" "}
                      for support
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDeploy}
            disabled={!isConfigured}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Continue to Vercel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
