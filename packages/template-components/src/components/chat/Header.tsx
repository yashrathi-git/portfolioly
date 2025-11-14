"use client";

import {
  Github,
  Link as LinkIcon,
  Mail,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import type { ChatProfile } from "./types";

type HeaderProps = {
  profile: ChatProfile;
  showIdentity?: boolean;
};

export const ChatHeader = ({ profile, showIdentity = true }: HeaderProps) => {
  const iconMap = {
    github: Github,
    mail: Mail,
    link: LinkIcon,
  } as const;

  const initials = profile.name
    ? profile.name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  const renderAvatar = () => {
    if (profile?.avatarUrl) {
      return (
        <img
          src={profile.avatarUrl}
          alt={profile.name || "Profile avatar"}
          className="size-10 sm:size-11 rounded-xl object-cover"
        />
      );
    }

    if (initials) {
      return <span className="font-semibold">{initials}</span>;
    }

    return <UserCircle2 className="size-5 sm:size-6" />;
  };

  return (
    <header className="w-full sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-transparent/0 bg-transparent">
      <div className="w-full px-4 sm:px-6">
        <div className="py-3 sm:py-4">
          {showIdentity ? (
            <div className="inline-flex items-center">
              <div className="size-10 sm:size-11 rounded-xl bg-gradient-to-br from-[oklch(0.84_0.07_250)] to-[oklch(0.74_0.15_310)] text-white grid place-items-center shadow-sm">
                {renderAvatar()}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
