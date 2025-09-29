"use client";

import { Mail, Link as LinkIcon, Github, Linkedin } from "lucide-react";

export type ContactItem = {
  id: string;
  kind: "email" | "github" | "website" | "linkedin";
  label: string; // Visible label
  href: string; // link
  sub?: string; // subtitle/handle
};

export type ContactWidgetProps = {
  heading?: string;
  items: ContactItem[];
};

const iconFor = (kind: ContactItem["kind"]) => {
  switch (kind) {
    case "email":
      return Mail;
    case "github":
      return Github;
    case "linkedin":
      return Linkedin;
    default:
      return LinkIcon;
  }
};

export const ContactWidget = ({
  heading = "Contact",
  items,
}: ContactWidgetProps) => {
  const visibleItems = items.filter((item) => Boolean(item.href && item.label));

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card text-card-foreground">
      {/* Glow */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full blur-3xl opacity-30 dark:opacity-20 bg-[oklch(0.769_0.188_70.08)]" />
      <div className="p-5 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold mb-4">{heading}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {visibleItems.map((it) => {
            const Icon = iconFor(it.kind);
            return (
              <a
                key={`${it.id}-${it.href}`}
                href={it.href}
                target="_blank"
                rel="noreferrer noopener"
                className="group flex items-center gap-3 rounded-xl border bg-[var(--secondary)] p-4 hover:bg-[var(--secondary)]/90 transition-colors"
              >
                <div className="size-9 rounded-lg grid place-items-center bg-[var(--input)] text-foreground/80">
                  <Icon className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{it.label}</div>
                  {it.sub && (
                    <div className="text-[12px] text-[color:var(--muted-foreground)] truncate">
                      {it.sub}
                    </div>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ContactWidget;
