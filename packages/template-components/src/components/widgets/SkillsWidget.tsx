"use client";

import { typography } from "../../lib/typography";
import { cn } from "../../lib/utils";

export type SkillItem = {
  name: string;
  level?: number; // 0-100 (optional)
  chip?: boolean; // render as badge if true
};

export type SkillCategory = {
  title: string;
  items: SkillItem[];
};

export type SkillsWidgetProps = {
  heading?: string;
  categories: SkillCategory[];
};

export const SkillsWidget = ({
  heading = "Skills",
  categories,
}: SkillsWidgetProps) => {
  const visibleCategories = categories
    .map((category) => ({
      title: category.title,
      items: category.items.filter((item) => Boolean(item.name?.trim())),
    }))
    .filter((category) => category.items.length > 0);

  if (visibleCategories.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card text-card-foreground">
      {/* Glow */}
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full blur-3xl opacity-30 dark:opacity-20 bg-[oklch(0.6_0.118_184.704)]" />
      <div className="p-5 sm:p-6">
        <h3 className={cn("font-semibold mb-4", typography.heading.secondary)}>
          {heading}
        </h3>
        <div className="grid sm:grid-cols-2 gap-5">
          {visibleCategories.map((cat) => (
            <div
              key={cat.title}
              className="rounded-xl bg-[var(--secondary)] p-4"
            >
              <div className={cn("font-medium mb-3", typography.label.base)}>
                {cat.title}
              </div>
              <div className="space-y-2.5">
                {cat.items.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    className="flex flex-col gap-1"
                  >
                    <div
                      className={cn(
                        "flex items-center justify-between",
                        typography.label.base
                      )}
                    >
                      <span>{item.name}</span>
                      {typeof item.level === "number" && (
                        <span
                          className={cn(
                            "text-[color:var(--muted-foreground)]",
                            typography.label.tiny
                          )}
                        >
                          {item.level}%
                        </span>
                      )}
                    </div>
                    {typeof item.level === "number" ? (
                      <div className="h-1.5 rounded-full bg-[var(--input)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[oklch(0.646_0.222_41.116)]"
                          style={{
                            width: `${Math.max(0, Math.min(100, item.level))}%`,
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full bg-[var(--input)]",
                            typography.label.tiny
                          )}
                        >
                          {item.name}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkillsWidget;
