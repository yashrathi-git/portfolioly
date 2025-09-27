"use client";

import {
  Github,
  Linkedin,
  Mail,
  Globe,
  Link,
  Twitter,
  Dribbble,
  Code2,
  Palette,
} from "lucide-react";
import type { SocialType } from "../../types/portfolio";

export type SocialIconProps = {
  type: SocialType;
  className?: string;
};

export const SocialIcon = ({ type, className }: SocialIconProps) => {
  const common = `h-5 w-5 ${className ?? ""}`;
  switch (type) {
    case "github":
      return <Github className={common} />;
    case "linkedin":
      return <Linkedin className={common} />;
    case "leetcode":
      return <Code2 className={common} />; // closest generic code icon
    case "mail":
      return <Mail className={common} />;
    case "website":
      return <Globe className={common} />;
    case "x":
      return <Twitter className={common} />;
    case "dribbble":
      return <Dribbble className={common} />;
    case "behance":
      return <Palette className={common} />;
    default:
      return <Link className={common} />;
  }
};
