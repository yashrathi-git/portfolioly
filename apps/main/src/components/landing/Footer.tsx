import Link from "next/link";
import { Github, Disc } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4 md:px-6 py-8 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight">Portfolioly</span>
            <span className="text-sm text-muted-foreground">© {new Date().getFullYear()}</span>
          </div>
          
          <div className="flex items-center gap-6">
            <Link 
              href="https://github.com/portfolioly/portfolioly" 
              target="_blank"
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </Link>
            <Link 
              href="https://discord.gg/portfolioly" 
              target="_blank"
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm"
            >
              <Disc className="h-4 w-4" />
              <span>Discord</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
