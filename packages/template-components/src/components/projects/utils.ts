/**
 * Utility functions for project components
 */

import type { DisplayProject } from "portfolioly-schema";

export function normalizeHighlights(highlights?: string[] | string): string {
  if (!highlights) {
    return "";
  }

  if (typeof highlights === "string") {
    return highlights;
  }

  const filtered = highlights
    .filter((point) => typeof point === "string" && point.trim().length > 0)
    .map((point) => point.trim());

  if (filtered.length === 0) {
    return "";
  }

  return filtered.join("\n");
}

export function isProjectExpandable(project: DisplayProject): boolean {
  return Boolean(
    project.demo_video ||
      (project.images && project.images.length > 0) ||
      project.more_context
  );
}

export function getVisibleProjects(items: DisplayProject[]): DisplayProject[] {
  return items.filter((item: DisplayProject) =>
    Boolean(
      item.name ||
        item.one_line_description ||
        item.highlights?.length ||
        item.technologies?.length ||
        item.github ||
        item.live_link
    )
  );
}
