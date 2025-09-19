import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

type AppHeaderProps = {
  appName: string;
  isDark: boolean;
  toggleTheme: () => void;
  userDisplay?: string;
  onSignOut?: () => void;
};

export default function AppHeader({
  appName,
  isDark,
  toggleTheme,
  userDisplay,
  onSignOut,
}: AppHeaderProps) {
  return (
    <div className="w-full border-b sticky top-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
      <div className="mx-auto max-w-4xl px-4 h-14 flex items-center justify-between">
        <span className="font-semibold tracking-tight">{appName}</span>
        <div className="flex items-center gap-2 text-sm">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Toggle theme"
            onClick={toggleTheme}
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          {userDisplay && onSignOut ? (
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground hidden sm:inline">
                {userDisplay}
              </span>
              <Button size="sm" variant="outline" onClick={onSignOut}>
                Sign out
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
