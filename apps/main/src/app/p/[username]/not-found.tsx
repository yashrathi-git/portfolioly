"use client";

import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 404 Not Found page for public portfolios
 * Displayed when:
 * - Username doesn't exist
 * - Portfolio is set to private (without revealing it exists)
 * - Portfolio data is unavailable
 */
export default function PortfolioNotFound() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">
            Portfolio Not Found
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            This portfolio doesn&apos;t exist or is not publicly accessible.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2">
          <Button
            onClick={() => router.push("/")}
            size="lg"
            className="min-w-[140px]"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
