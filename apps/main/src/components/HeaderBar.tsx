"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WandIcon } from "@/components/icons/PortfoliolyWandIcon";
import { cn } from "@/lib/utils";

export default function HeaderBar() {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const homeRoute = user?.emailVerified ? "/dashboard" : "/";

  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(path + "/");

  const navLinkClass = (path: string) =>
    cn(
      "relative",
      isActive(path) &&
        "bg-accent text-accent-foreground after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-primary after:rounded-full"
    );

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="w-full border-b sticky top-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
        {/* Logo - text hidden on mobile */}
        <Link
          href={homeRoute}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <WandIcon className="h-6 w-6" />
          <span className="hidden sm:inline text-lg font-semibold">
            Portfolioly
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2 text-sm">
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
          {user ? (
            <div className="flex items-center gap-3">
              {user.emailVerified && (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                    className={navLinkClass("/upload")}
                  >
                    <Link href="/upload">Create</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                    className={navLinkClass("/edit")}
                  >
                    <Link href="/edit">Edit</Link>
                  </Button>
                </div>
              )}
              <span className="text-muted-foreground hidden lg:inline">
                {user.displayName || user.email}
                {!user.emailVerified && (
                  <span className="ml-2 text-xs text-amber-600 font-medium">
                    (Unverified)
                  </span>
                )}
              </span>
              {!user.emailVerified ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="default" asChild>
                    <Link href="/auth/verify-email">Verify Email</Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => signOut()}>
                    Sign out
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => signOut()}>
                  Sign out
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" asChild>
                <Link href="/auth/sign-in">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/sign-up">Sign up</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile: Theme toggle + Hamburger */}
        <div className="flex md:hidden items-center gap-1">
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
          <Button
            size="icon"
            variant="ghost"
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <div className="px-4 py-3 space-y-2">
            {user ? (
              <>
                {user.emailVerified && (
                  <div className="flex flex-col gap-1">
                    <Link
                      href="/upload"
                      onClick={closeMobileMenu}
                      className={cn(
                        "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive("/upload")
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50"
                      )}
                    >
                      Create
                    </Link>
                    <Link
                      href="/edit"
                      onClick={closeMobileMenu}
                      className={cn(
                        "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive("/edit")
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50"
                      )}
                    >
                      Edit
                    </Link>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <p className="px-3 py-1 text-xs text-muted-foreground truncate">
                    {user.displayName || user.email}
                    {!user.emailVerified && (
                      <span className="ml-1 text-amber-600 font-medium">
                        (Unverified)
                      </span>
                    )}
                  </p>
                  {!user.emailVerified ? (
                    <div className="flex flex-col gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="default"
                        asChild
                        onClick={closeMobileMenu}
                      >
                        <Link href="/auth/verify-email">Verify Email</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          signOut();
                          closeMobileMenu();
                        }}
                      >
                        Sign out
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => {
                        signOut();
                        closeMobileMenu();
                      }}
                    >
                      Sign out
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                  onClick={closeMobileMenu}
                >
                  <Link href="/auth/sign-in">Sign in</Link>
                </Button>
                <Button size="sm" asChild onClick={closeMobileMenu}>
                  <Link href="/auth/sign-up">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
