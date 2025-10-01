import type { ExperienceItem } from "../../types/portfolio";
import { MarkdownContent } from "../../utils/markdown-parser";

export type ExperienceProps = {
  items?: ExperienceItem[];
};

export const Experience = ({ items = [] }: ExperienceProps) => {
  const visibleItems = items.filter((item: ExperienceItem) =>
    Boolean(
      item.companyName ||
        item.role ||
        item.location ||
        item.start ||
        item.end ||
        item.points?.length
    )
  );

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">
        Experience
      </h2>
      <div className="relative">
        {/* Vertical timeline line with gradient */}
        <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-gradient-to-b from-slate-300 via-slate-200 to-transparent dark:from-slate-600 dark:via-slate-700" />

        <div className="space-y-8 pl-12">
          {visibleItems.map((e: ExperienceItem, idx: number) => (
            <div
              key={`${e.companyName || "experience"}-${idx}`}
              className="relative group"
            >
              {/* Timeline dot with work icon */}
              <div className="absolute -left-12 top-2 flex items-center justify-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 shadow-sm group-hover:border-slate-400 dark:group-hover:border-slate-500 transition-colors">
                  <svg
                    className="w-4 h-4 text-slate-600 dark:text-slate-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
              </div>

              {/* Content card with improved styling */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md group-hover:translate-x-1">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    {(e.role || e.companyName) && (
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 leading-tight mb-2">
                        {e.role && e.companyName
                          ? `${e.companyName}`
                          : e.companyName || e.role}
                      </h3>
                    )}
                    {e.companyName && e.role && (
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        {e.role}
                      </p>
                    )}
                    {e.location && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {e.location}
                      </p>
                    )}
                  </div>
                  {(e.start || e.end) && (
                    <div className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <svg
                        className="w-4 h-4 text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {[e.start, e.end].filter(Boolean).join(" — ")}
                    </div>
                  )}
                </div>

                {e.points?.length ? (
                  <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
                    <MarkdownContent content={e.points} />
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
