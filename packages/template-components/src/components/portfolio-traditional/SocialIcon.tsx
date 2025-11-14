"use client";

import type { SocialType } from "portfolioly-schema";
import {
  SOCIAL_ICON_COMPONENTS,
  SOCIAL_LABELS,
} from "../../lib/constants/social-icons";

export type SocialIconProps = {
  type: SocialType;
  className?: string;
  size?: number;
};

export const SocialIcon = ({ type, className, size = 20 }: SocialIconProps) => {
  const IconComponent = SOCIAL_ICON_COMPONENTS[type];

  // All icons are now in SOCIAL_ICON_COMPONENTS, just render it
  return <IconComponent size={size} className={className} />;
};

export const getSocialLabel = (
  type: SocialType,
  customLabel?: string
): string => {
  return (
    customLabel ||
    SOCIAL_LABELS[type] ||
    type.charAt(0).toUpperCase() + type.slice(1)
  );
};
