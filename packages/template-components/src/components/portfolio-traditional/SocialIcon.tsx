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

export const SocialIcon = ({ type, className = "" }: SocialIconProps) => {
  // Enhanced with better default sizing and mobile support
  const baseClasses = "transition-all duration-200 ease-in-out";
  const combinedClasses = `${baseClasses} ${className}`;
  
  switch (type) {
    case "github":
      return <Github className={combinedClasses} />;
    case "linkedin":
      return <Linkedin className={combinedClasses} />;
    case "leetcode":
      return <Code2 className={combinedClasses} />; // closest generic code icon
    case "mail":
      return <Mail className={combinedClasses} />;
    case "website":
      return <Globe className={combinedClasses} />;
    case "x":
      return <Twitter className={combinedClasses} />;
    case "dribbble":
      return <Dribbble className={combinedClasses} />;
    case "behance":
      return <Palette className={combinedClasses} />;
    default:
      return <Link className={combinedClasses} />;
  }
};
