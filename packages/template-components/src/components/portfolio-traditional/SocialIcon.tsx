"use client";

import type { SocialType } from "portfolioly-schema";
import {
  SOCIAL_ICON_COMPONENTS,
  getSocialLabel as getLabel,
} from "../../lib/constants/social-icons";

export type SocialIconProps = {
  type: SocialType;
  className?: string;
  size?: number;
};

export const SocialIcon = ({ type, className, size = 20 }: SocialIconProps) => {
  const IconComponent = SOCIAL_ICON_COMPONENTS[type];
  return <IconComponent size={size} className={className} />;
};

export const getSocialLabel = (
  type: SocialType,
  customLabel?: string
): string => {
  return customLabel || getLabel(type);
};
