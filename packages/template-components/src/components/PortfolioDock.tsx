"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { portfolioConfig } from "../config/portfolio-config";
import { MessageSquare, IdCard, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

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
      shortLabel: "Chat",
      icon: <MessageSquare className="h-4 w-4" />,
      active: pathname === "/",
      description: "Interactive conversation",
    },
    portfolioConfig.enableTraditionalPortfolio && {
      href: "/traditional",
      label: "Traditional",
      shortLabel: "Portfolio",
      icon: <IdCard className="h-4 w-4" />,
      active: pathname?.startsWith("/traditional"),
      description: "Classic portfolio view",
    },
  ].filter(Boolean) as Array<{
    href: string;
    label: string;
    shortLabel: string;
    icon: React.ReactElement;
    active: boolean;
    description: string;
  }>;

  if (items.length <= 1) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="pointer-events-none fixed inset-x-0 bottom-4 sm:bottom-6 z-40 flex justify-center px-4"
    >
      {/* Enhanced dock with glassmorphism and better mobile design */}
      <nav className="pointer-events-auto relative">
        {/* Enhanced background with better glassmorphism */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--card)]/80 via-[var(--card)]/90 to-[var(--card)]/80 backdrop-blur-xl border border-[var(--border)]/50 rounded-2xl shadow-2xl shadow-black/10"></div>
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-2xl"></div>
        
        {/* Content */}
        <div className="relative flex items-center p-2">
          {items.map((item, index) => (
            <div key={item.href} className="flex items-center">
              <Link
                href={item.href}
                className={cx(
                  "group relative inline-flex items-center gap-2 sm:gap-3 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base transition-all duration-200 min-h-[48px]",
                  item.active
                    ? "text-white"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                )}
              >
                {/* Active background with smooth animation */}
                {item.active && (
                  <motion.div
                    layoutId="activeDockItem"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}

                {/* Hover background */}
                <div className={cx(
                  "absolute inset-0 rounded-xl transition-all duration-200",
                  !item.active && "group-hover:bg-[var(--muted)]/50"
                )} />

                {/* Content */}
                <div className="relative z-10 flex items-center gap-2 sm:gap-3">
                  {/* Enhanced icon container */}
                  <span
                    className={cx(
                      "inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg border transition-all duration-200",
                      item.active
                        ? "border-white/20 bg-white/10 text-white"
                        : "border-[var(--border)]/60 bg-[var(--background)]/70 group-hover:border-[var(--border)] group-hover:bg-[var(--background)]"
                    )}
                  >
                    <span className="group-hover:scale-110 transition-transform duration-200">
                      {item.icon}
                    </span>
                  </span>
                  
                  {/* Label with responsive display */}
                  <span className="font-medium tracking-tight hidden sm:block">
                    {item.label}
                  </span>
                  <span className="font-medium tracking-tight block sm:hidden text-xs">
                    {item.shortLabel}
                  </span>
                </div>

                {/* Tooltip for mobile (shows description) */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none sm:hidden">
                  <div className="bg-[var(--foreground)] text-[var(--background)] text-xs px-2 py-1 rounded-md whitespace-nowrap">
                    {item.description}
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--foreground)]"></div>
                </div>
              </Link>

              {/* Separator (only between items) */}
              {index < items.length - 1 && (
                <div className="mx-1 sm:mx-2">
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-[var(--muted-foreground)]/50" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Enhanced bottom indicator */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-transparent via-[var(--muted-foreground)]/30 to-transparent rounded-full"></div>
      </nav>
    </motion.div>
  );
};