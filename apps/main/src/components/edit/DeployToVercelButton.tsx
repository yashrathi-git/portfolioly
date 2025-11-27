"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageCircle, Loader2 } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { env } from "@/lib/env";
import { VercelIcon } from "@/components/icons/VercelIcon";
import { useAuth } from "@/lib/auth/AuthContext";
import { fetchUsernameAndToken } from "@/lib/api/publicToken";
import { cn } from "@/lib/utils";
import posthog from "posthog-js";

interface DeployToVercelButtonProps {
  className?: string;
}

export function DeployToVercelButton({ className }: DeployToVercelButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [username, setUsername] = useState<string | undefined>(undefined);
  const [publicToken, setPublicToken] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const githubRepoUrl = "https://github.com/yashrathi-git/portfolioly-template";
  const apiBaseUrl = env.API_BASE_URL;
  const discordLink = process.env.NEXT_PUBLIC_DISCORD_LINK;

  // Fetch username and token when dialog opens
  useEffect(() => {
    async function fetchCredentials() {
      if (!showDialog || !user) return;

      setIsLoading(true);
      setError(null);

      try {
        const authToken = await user.getIdToken();
        const { username: fetchedUsername, publicToken: fetchedToken } =
          await fetchUsernameAndToken(user.uid, authToken);
        setUsername(fetchedUsername);
        setPublicToken(fetchedToken);
      } catch (err) {
        console.error("Failed to fetch deployment credentials:", err);
        setError("Failed to prepare deployment. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCredentials();
  }, [showDialog, user]);

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

  // Add redirect URL to return user to dashboard after deployment
  const redirectUrl = `${window.location.origin}/dashboard?vercel_deployed=true`;
  deployUrl.searchParams.set("redirect-url", redirectUrl);

  const handleDeploy = () => {
    posthog.capture("deploy_to_vercel_clicked", {
      username,
    });
    window.open(deployUrl.toString(), "_blank");
    setShowDialog(false);
  };

  return (
    <DialogPrimitive.Root open={showDialog} onOpenChange={setShowDialog}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <VercelIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Deploy</span>
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "duration-300 ease-out"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%]",
            "gap-4 border bg-background p-6 shadow-2xl sm:rounded-xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            "duration-300 ease-out"
          )}
        >
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2">
              <VercelIcon className="h-5 w-5" />
              Deploy to Vercel
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              Your portfolio will be deployed to Vercel with your credentials
              pre-configured
            </DialogPrimitive.Description>
          </div>

          <div className="space-y-4 py-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Preparing deployment...
                </p>
              </div>
            ) : error ? (
              <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 p-4">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  ⚠️ Error
                </p>
                <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                  {error}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground font-medium">
                    Deployment steps:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                    <li>Vercel will open in a new tab</li>
                    <li>Login to your Vercel account</li>
                    <li>All environment variables will be pre-filled</li>
                    <li>Click next and deploy your portfolio</li>
                  </ul>
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

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDeploy}
              disabled={!isConfigured || isLoading}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Continue to Vercel
            </Button>
          </div>

          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
