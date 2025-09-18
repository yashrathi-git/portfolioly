"use client";

import {
  Github,
  Link as LinkIcon,
  Mail,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import type { Profile } from "../types";

type HeaderProps = {
  profile: Profile;
  showIdentity?: boolean;
};

export const ChatHeader = ({ profile, showIdentity = true }: HeaderProps) => {
  const iconMap = {
    github: Github,
    mail: Mail,
    link: LinkIcon,
  } as const;

  return (
    <header className="w-full sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-transparent/0 bg-transparent">
      {/* full-width content, avoid boxed look */}
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between py-3 sm:py-4">
          {showIdentity ? (
            <div className="inline-flex items-center gap-3 sm:gap-4">
              <div className="size-10 sm:size-11 rounded-xl bg-gradient-to-br from-[oklch(0.84_0.07_250)] to-[oklch(0.74_0.15_310)] text-white grid place-items-center shadow-sm">
                <UserCircle2 className="size-5 sm:size-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold tracking-tight text-base sm:text-lg">
                  {profile.name}
                </span>
                {profile.badge ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--secondary)] text-[color:var(--secondary-foreground)] px-2 py-0.5 text-[11px] sm:text-xs w-max">
                    <Sparkles className="size-3.5" /> {profile.badge}
                  </span>
                ) : null}
              </div>
            </div>
          ) : (
            // Minimal avatar only on initial screen (no name/badge)
            <div className="inline-flex items-center">
              <div className="size-10 sm:size-11 rounded-xl bg-gradient-to-br from-[oklch(0.84_0.07_250)] to-[oklch(0.74_0.15_310)] text-white grid place-items-center shadow-sm">
                <UserCircle2 className="size-5 sm:size-6" />
              </div>
            </div>
          )}

          <nav className="flex items-center gap-1.5 sm:gap-2 text-[color:var(--muted-foreground)]">
            {profile.links?.map((l) => {
              const Icon = iconMap[l.type];
              return (
                <a
                  key={l.type}
                  href={l.href}
                  className="p-2 rounded-lg hover:bg-[var(--accent)] transition"
                  aria-label={l.type}
                >
                  <Icon className="size-5" />
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
