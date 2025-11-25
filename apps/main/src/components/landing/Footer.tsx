import Link from "next/link";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { DiscordIcon } from "@/components/icons/DiscordIcon";
import { getDiscordLink, GITHUB_REPO_URL } from "@/lib/utils/links";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4 md:px-6 py-8 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight">
              Portfolioly
            </span>
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href={GITHUB_REPO_URL}
              target="_blank"
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm"
            >
              <GitHubLogoIcon className="h-4 w-4" />
              <span>GitHub</span>
            </Link>
            <Link
              href={getDiscordLink()}
              target="_blank"
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm"
            >
              <DiscordIcon className="h-4 w-4" />
              <span>Discord</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
