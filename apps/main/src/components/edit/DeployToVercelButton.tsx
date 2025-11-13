"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const githubRepoUrl = "https://github.com/yashrathi-git/portfolioly-template";
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.portfolioly.com";

  // Generate Vercel deploy URL with correct env prefill syntax
  const deployUrl = new URL("https://vercel.com/new/clone");
  deployUrl.searchParams.set("repository-url", githubRepoUrl);
  deployUrl.searchParams.set("project-name", `${username || "my"}-portfolio`);
  deployUrl.searchParams.set(
    "repository-name",
    `${username || "my"}-portfolio`
  );
  deployUrl.searchParams.set(
    "env",
    "NEXT_PUBLIC_USERNAME,NEXT_PUBLIC_PSK_TOKEN,NEXT_PUBLIC_API_BASE_URL"
  );

  // Pre-fill values using env[NAME] syntax
  if (username)
    deployUrl.searchParams.set("env[NEXT_PUBLIC_USERNAME]", username);
  if (publicToken)
    deployUrl.searchParams.set("env[NEXT_PUBLIC_PSK_TOKEN]", publicToken);
  deployUrl.searchParams.set("env[NEXT_PUBLIC_API_BASE_URL]", apiBaseUrl);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isConfigured = Boolean(username && publicToken);

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <ExternalLink className="h-4 w-4" />
          <span className="hidden sm:inline">Deploy to Vercel</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Deploy Your Portfolio to Vercel</DialogTitle>
          <DialogDescription>
            One-click deployment with pre-configured credentials
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isConfigured && (
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4 text-sm">
              <p className="font-medium text-yellow-900 dark:text-yellow-100">
                ⚠️ Set your username in Settings to enable deployment
              </p>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-medium">Deployment Credentials</h3>

            {/* Username */}
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Username</label>
              <div className="flex gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm">
                  {username || "Not set"}
                </code>
                {username && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(username, "username")}
                  >
                    {copiedField === "username" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Public Token */}
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                Public Token
              </label>
              <div className="flex gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                  {publicToken
                    ? `${publicToken.slice(0, 20)}...`
                    : "Not available"}
                </code>
                {publicToken && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(publicToken, "token")}
                  >
                    {copiedField === "token" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* API URL */}
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                API Base URL
              </label>
              <code className="block px-3 py-2 bg-muted rounded-md text-sm">
                {apiBaseUrl}
              </code>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">
              What happens:
            </p>
            <ul className="text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-disc mt-1">
              <li>Vercel clones template to your GitHub</li>
              <li>Credentials pre-filled as environment variables</li>
              <li>Portfolio deploys with live chat</li>
              <li>Updates reflect automatically</li>
            </ul>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => window.open(deployUrl.toString(), "_blank")}
              disabled={!isConfigured}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Deploy Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
