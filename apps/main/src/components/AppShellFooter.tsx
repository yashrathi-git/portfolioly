import Link from "next/link";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { WandIcon } from "@/components/icons/PortfoliolyWandIcon";
import { GITHUB_REPO_URL } from "@/lib/utils/links";

export function AppShellFooter() {
  return (
    <footer className="w-full border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-foreground hover:opacity-70 transition-opacity"
          >
            <WandIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Portfolioly</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:opacity-70 transition-opacity"
              aria-label="GitHub"
            >
              <GitHubLogoIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
