"use client";

import Image from "next/image";

export type AboutWidgetProps = {
  avatarUrl?: string;
  name?: string;
  title?: string;
  summary?: string;
  // optional enhancements
  location?: string;
  largeImage?: boolean;
  paragraphs?: string[]; // additional long-form content
  strengths?: string[]; // bullet points highlighting strengths
  highlights?: { label: string; value: string }[]; // deprecated, kept for backward-compat
};

export const AboutWidget = ({
  avatarUrl,
  name,
  title,
  summary,
  location,
  largeImage = false,
  paragraphs = [],
  strengths = [],
  highlights = [],
}: AboutWidgetProps) => {
  const fallbackName = name?.trim();
  const initials = fallbackName
    ? fallbackName
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  const avatarSize = largeImage
    ? "size-44 sm:size-52 md:size-60"
    : "size-32 sm:size-40";
  const contentParts = [summary, ...paragraphs].filter((text) =>
    Boolean(text && text.trim())
  );
  const combinedText = contentParts.join("\n\n");

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card text-card-foreground">
      {/* Glow */}
      <div className="pointer-events-none absolute -top-20 -left-28 h-56 w-56 rounded-full blur-3xl opacity-40 dark:opacity-20 bg-[oklch(0.74_0.15_310)]" />
      <div className="p-5 sm:p-6">
        {/* Layout: photo left, name/title/location right; bio below spanning full width */}
        <div className="grid gap-4 sm:gap-6 sm:[grid-template-columns:auto_1fr] items-start">
          <div className="relative">
            <div
              className={`${avatarSize} rounded-2xl overflow-hidden ring-1 ring-border bg-[var(--secondary)] grid place-items-center`}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={fallbackName || "User avatar"}
                  width={240}
                  height={240}
                  className="h-full w-full object-cover"
                />
              ) : fallbackName ? (
                <span className="text-2xl sm:text-3xl font-semibold text-[color:var(--secondary-foreground)]">
                  {initials}
                </span>
              ) : (
                <div className="text-2xl sm:text-3xl font-semibold text-[color:var(--secondary-foreground)]">
                  👋
                </div>
              )}
            </div>
          </div>

          <div>
            {fallbackName ? (
              <h3 className="text-xl sm:text-2xl font-semibold leading-tight">
                {fallbackName}
              </h3>
            ) : null}
            {title ? (
              <p className="text-sm text-[color:var(--muted-foreground)]">
                {title}
              </p>
            ) : null}
            {location && (
              <p className="mt-0.5 text-xs sm:text-[13px] text-[color:var(--muted-foreground)]/90">
                {location}
              </p>
            )}
          </div>

          {combinedText ? (
            <p className="sm:col-span-2 mt-2 sm:mt-0 text-[17px] sm:text-[18px] leading-relaxed whitespace-pre-wrap">
              {combinedText}
            </p>
          ) : null}
        </div>

        {/* Removed rich content grid and strengths list; rendering as one continuous text above. */}
        {/* Removed old stat cards (experience/location). Keeping prop for backward-compat but not rendering. */}
        {/* {highlights.length > 0 && (...deprecated grid...) } */}
      </div>
    </div>
  );
};

export default AboutWidget;
