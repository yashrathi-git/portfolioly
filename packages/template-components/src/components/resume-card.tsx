"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ChevronRightIcon, Building2 } from "lucide-react";
import React from "react";
import type { ReactNode } from "react";
import { MarkdownContent } from "../utils/markdown";

interface ResumeCardProps {
  logoUrl?: string;
  altText: string;
  title: string;
  subtitle?: string;
  badges?: readonly string[];
  period?: string;
  description?: string;
  fallbackIcon?: ReactNode;
  defaultExpanded?: boolean;
}

export const ResumeCard = ({
  logoUrl,
  altText,
  title,
  subtitle,
  badges,
  period,
  description,
  fallbackIcon,
  defaultExpanded = false,
}: ResumeCardProps) => {
  const [isExpanded, setIsExpanded] = React.useState(
    Boolean(description) && defaultExpanded
  );
  const [imageError, setImageError] = React.useState(false);

  const showFallback = !logoUrl || imageError;
  const handleClick = () => {
    if (description) {
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <Card
      className={cn("flex", description && "cursor-pointer select-none")}
      onClick={handleClick}
      role={description ? "button" : undefined}
      aria-expanded={description ? isExpanded : undefined}
    >
      <div className="flex-none">
        <Avatar className="border size-12 m-auto bg-muted-background dark:bg-foreground">
          {!showFallback ? (
            <AvatarImage
              src={logoUrl}
              alt={altText}
              className="object-contain"
              onError={() => setImageError(true)}
            />
          ) : null}
          <AvatarFallback>
            {showFallback
              ? fallbackIcon || (
                  <Building2 className="size-6 text-muted-foreground" />
                )
              : altText?.[0]}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-grow ml-4 items-center flex-col group">
        <CardHeader>
          <div className="flex items-center justify-between gap-x-2 text-base">
            <h3 className="inline-flex items-center justify-center font-semibold leading-none text-xs sm:text-sm">
              {title}
              {badges && badges.length > 0 && (
                <span className="inline-flex gap-x-1 ml-2">
                  {badges.map((badge, index) => (
                    <Badge
                      variant="secondary"
                      className="align-middle text-xs"
                      key={index}
                    >
                      {badge}
                    </Badge>
                  ))}
                </span>
              )}
              {description && (
                <ChevronRightIcon
                  className={cn(
                    "size-4 translate-x-0 transform opacity-0 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:opacity-100",
                    isExpanded ? "rotate-90" : "rotate-0"
                  )}
                />
              )}
            </h3>
            {period && (
              <div className="text-xs sm:text-sm tabular-nums text-muted-foreground text-right">
                {period}
              </div>
            )}
          </div>
          {subtitle && (
            <div className="font-sans text-xs text-muted-foreground">
              {subtitle}
            </div>
          )}
        </CardHeader>
        {description && (
          <motion.div
            initial={{
              opacity: isExpanded ? 1 : 0,
              height: isExpanded ? "auto" : 0,
            }}
            animate={{
              opacity: isExpanded ? 1 : 0,
              height: isExpanded ? "auto" : 0,
            }}
            transition={{
              duration: 0.7,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-2 w-full text-xs sm:text-sm"
          >
            <MarkdownContent content={description} />
          </motion.div>
        )}
      </div>
    </Card>
  );
};
