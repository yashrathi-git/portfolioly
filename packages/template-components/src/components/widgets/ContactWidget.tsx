"use client";

import { Mail, Github, Linkedin } from "lucide-react";
import { typography } from "../../lib/typography";
import { cn } from "../../lib/utils";
import BlurFade from "../magicui/blur-fade";
import { WIDGET_ANIMATION } from "../../lib/constants/animations";

export interface ContactWidgetProps {
  heading?: string;
  linkedin?: string;
  email?: string;
  github?: string;
}

interface ContactLinkProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
}

const ContactLink = ({ icon, label, value, href }: ContactLinkProps) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 rounded-lg border bg-secondary/50 p-4 hover:bg-secondary transition-colors"
  >
    <div className="size-9 rounded-lg grid place-items-center bg-background/50 text-foreground/80">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <div className={cn("font-medium", typography.label.base)}>{label}</div>
      <div
        className={cn("text-muted-foreground truncate", typography.label.small)}
      >
        {value}
      </div>
    </div>
  </a>
);

// Helper to extract username from GitHub URL
const extractGithubUsername = (url: string): string => {
  try {
    const match = url.match(/github\.com\/([^\/\?#]+)/);
    return match ? `@${match[1]}` : url;
  } catch {
    return url;
  }
};

// Helper to extract username from LinkedIn URL
const extractLinkedinUsername = (url: string): string => {
  try {
    const match = url.match(/linkedin\.com\/in\/([^\/\?#]+)/);
    return match ? match[1] : url;
  } catch {
    return url;
  }
};

export const ContactWidget = ({
  heading = "Get in Touch",
  linkedin,
  email,
  github,
}: ContactWidgetProps) => {
  // Only render if at least one contact method exists
  const hasContact = linkedin || email || github;
  if (!hasContact) {
    return null;
  }

  return (
    <BlurFade
      delay={WIDGET_ANIMATION.delay}
      duration={WIDGET_ANIMATION.duration}
      yOffset={WIDGET_ANIMATION.yOffset}
      blur={WIDGET_ANIMATION.blur}
    >
      <div className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm p-5 sm:p-6">
        <h3 className={cn("font-semibold mb-4", typography.heading.secondary)}>
          {heading}
        </h3>
        <div className="flex flex-col gap-3">
          {linkedin && (
            <ContactLink
              icon={<Linkedin className="size-4.5" />}
              label="LinkedIn"
              value={extractLinkedinUsername(linkedin)}
              href={linkedin}
            />
          )}
          {email && (
            <ContactLink
              icon={<Mail className="size-4.5" />}
              label="Email"
              value={email}
              href={`mailto:${email}`}
            />
          )}
          {github && (
            <ContactLink
              icon={<Github className="size-4.5" />}
              label="GitHub"
              value={extractGithubUsername(github)}
              href={github}
            />
          )}
        </div>
      </div>
    </BlurFade>
  );
};

export default ContactWidget;
