"use client";

import * as React from "react";
import Markdown from "markdown-to-jsx";
import { cn } from "../lib/utils";

type MarkdownContentProps = {
  content: string | string[];
  className?: string;
  overrides?: Record<
    string,
    | React.ComponentType<any>
    | { component: React.ComponentType<any>; props?: Record<string, any> }
  >;
};

const defaultOverrides = {
  p: {
    component: ({
      className,
      ...props
    }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p
        {...props}
        className={cn(
          "m-0 text-sm leading-relaxed text-muted-foreground",
          className
        )}
      />
    ),
  },
  ul: {
    component: ({
      className,
      ...props
    }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul
        {...props}
        className={cn(
          "ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground",
          className
        )}
      />
    ),
  },
  ol: {
    component: ({
      className,
      ...props
    }: React.HTMLAttributes<HTMLOListElement>) => (
      <ol
        {...props}
        className={cn(
          "ml-5 list-decimal space-y-2 text-sm leading-relaxed text-muted-foreground",
          className
        )}
      />
    ),
  },
  li: {
    component: ({
      className,
      ...props
    }: React.HTMLAttributes<HTMLLIElement>) => (
      <li
        {...props}
        className={cn(
          "text-sm leading-relaxed text-muted-foreground",
          className
        )}
      />
    ),
  },
  strong: {
    component: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <strong
        {...props}
        className={cn("font-semibold text-foreground", className)}
      />
    ),
  },
  em: {
    component: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <em
        {...props}
        className={cn("italic text-muted-foreground", className)}
      />
    ),
  },
  h1: {
    component: ({
      className,
      ...props
    }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1
        {...props}
        className={cn(
          "text-2xl font-bold mt-4 mb-2 text-foreground",
          className
        )}
      />
    ),
  },
  h2: {
    component: ({
      className,
      ...props
    }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2
        {...props}
        className={cn("text-xl font-bold mt-3 mb-2 text-foreground", className)}
      />
    ),
  },
  h3: {
    component: ({
      className,
      ...props
    }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3
        {...props}
        className={cn(
          "text-lg font-semibold mt-3 mb-1 text-foreground",
          className
        )}
      />
    ),
  },
  h4: {
    component: ({
      className,
      ...props
    }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h4
        {...props}
        className={cn(
          "text-base font-semibold mt-2 mb-1 text-foreground",
          className
        )}
      />
    ),
  },
  h5: {
    component: ({
      className,
      ...props
    }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h5
        {...props}
        className={cn(
          "text-sm font-semibold mt-2 mb-1 text-foreground",
          className
        )}
      />
    ),
  },
  h6: {
    component: ({
      className,
      ...props
    }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h6
        {...props}
        className={cn(
          "text-xs font-semibold mt-2 mb-1 text-foreground",
          className
        )}
      />
    ),
  },
  code: {
    component: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <code
        {...props}
        className={cn(
          "rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground",
          className
        )}
      />
    ),
  },
  pre: {
    component: ({
      className,
      ...props
    }: React.HTMLAttributes<HTMLPreElement>) => (
      <pre
        {...props}
        className={cn(
          "rounded-md bg-muted p-4 overflow-x-auto font-mono text-xs text-foreground",
          className
        )}
      />
    ),
  },
  a: {
    component: ({
      className,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a
        {...props}
        className={cn(
          "text-primary underline hover:text-primary/80 transition-colors",
          className
        )}
        target="_blank"
        rel="noopener noreferrer"
      />
    ),
  },
  blockquote: {
    component: ({
      className,
      ...props
    }: React.HTMLAttributes<HTMLQuoteElement>) => (
      <blockquote
        {...props}
        className={cn(
          "border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground",
          className
        )}
      />
    ),
  },
};

const bulletPrefixRegex = /^\s*([-*+]\s+|\d+\.\s+)/;

function normalizeContent(content: string | string[]): string {
  if (Array.isArray(content)) {
    const lines = content
      .filter((item) => typeof item === "string" && item.trim().length > 0)
      .map((item) => {
        const trimmed = item.trim();
        if (bulletPrefixRegex.test(trimmed)) {
          return trimmed;
        }
        return `- ${trimmed}`;
      });
    return lines.join("\n");
  }

  return content;
}

export function MarkdownContent({
  content,
  className,
  overrides,
}: MarkdownContentProps) {
  const normalized = normalizeContent(content);

  if (!normalized) {
    return null;
  }

  return (
    <Markdown
      className={cn("space-y-2", className)}
      options={{
        overrides: {
          ...defaultOverrides,
          ...overrides,
        },
        forceBlock: false,
      }}
    >
      {normalized}
    </Markdown>
  );
}
