"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { portfolioConfig } from "../config/portfolio-config";
import { MessageSquare, IdCard } from "lucide-react";

// Minimal cx util
function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const PortfolioDock = () => {
  const pathname = usePathname();

  const items = [
    portfolioConfig.enableChatPortfolio && {
      href: "/",
      label: "Chat",
      icon: <MessageSquare className="h-4 w-4" />,
      active: pathname === "/",
    },
    portfolioConfig.enableTraditionalPortfolio && {
      href: "/traditional",
      label: "Traditional",
      icon: <IdCard className="h-4 w-4" />,
      active: pathname?.startsWith("/traditional"),
    },
  ].filter(Boolean) as Array<{
    href: string;
    label: string;
    icon: React.ReactElement;
    active: boolean;
  }>;

  if (items.length <= 1) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center">
      <nav className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-card/70 px-2 py-2 shadow-lg shadow-black/5 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cx(
              "group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
              item.active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span
              className={cx(
                "inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-background/70",
                item.active && "border-transparent bg-background"
              )}
            >
              {item.icon}
            </span>
            <span className="font-medium tracking-tight">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};
