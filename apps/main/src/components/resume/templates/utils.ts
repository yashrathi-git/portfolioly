/**
 * Resume Template Utilities
 *
 * Shared utility functions for resume templates.
 */

import React from "react";

/**
 * Parse markdown-style bold (**text**) and italic (*text*) into React elements.
 * Handles nested patterns and mixed content.
 */
export function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  // Combined regex for **bold** and *italic*
  // Must check for ** before * to handle bold correctly
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1] !== undefined) {
      // Bold match (**text**)
      parts.push(
        React.createElement("strong", { key: key++ }, match[1])
      );
    } else if (match[2] !== undefined) {
      // Italic match (*text*)
      parts.push(
        React.createElement("em", { key: key++ }, match[2])
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last match
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  // If no matches found, return original text
  if (parts.length === 0) {
    return text;
  }

  return React.createElement(React.Fragment, null, ...parts);
}

/**
 * Strip bullet prefix from highlight text.
 * Removes leading -, *, / and whitespace.
 */
export function stripBulletPrefix(text: string): string {
  return text.replace(/^[-*/]\s*/, "").trim();
}

/**
 * Process a highlight: strip bullet prefix and render markdown.
 */
export function renderHighlight(text: string): React.ReactNode {
  return renderMarkdown(stripBulletPrefix(text));
}

/**
 * Get hostname from URL for display.
 */
export function getHostname(url: string): string {
  try {
    const fullUrl = url.startsWith("http") ? url : `https://${url}`;
    return new URL(fullUrl).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

/**
 * Get display name for profile links.
 */
export function getProfileDisplayName(key: string, url?: string | null): string {
  if (!url) return "";
  
  const displayNames: Record<string, string> = {
    linkedin: "LinkedIn",
    github: "GitHub",
    leetcode: "LeetCode",
    codeforces: "Codeforces",
    codechef: "CodeChef",
    website: "Website",
  };

  return displayNames[key] || getHostname(url);
}

/**
 * Format a date for display (e.g., "Jan 2020" or "2020")
 */
export function formatDate(
  date: { month?: number | null; year?: number | null } | null | undefined
): string {
  if (!date) return "";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  if (date.month && date.year) {
    return `${months[date.month - 1]} ${date.year}`;
  }
  if (date.year) {
    return `${date.year}`;
  }
  return "";
}

/**
 * Format date range for display
 */
export function formatDateRange(
  startDate: { month?: number | null; year?: number | null } | null | undefined,
  endDate: { month?: number | null; year?: number | null } | null | undefined,
  isCurrent?: boolean
): string {
  const start = formatDate(startDate);
  if (isCurrent) {
    return start ? `${start} – Present` : "Present";
  }
  const end = formatDate(endDate);
  if (start && end) {
    return `${start} – ${end}`;
  }
  return start || end || "";
}

