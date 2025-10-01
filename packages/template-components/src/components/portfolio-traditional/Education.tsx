import type { EducationItem } from "../../types/portfolio";

export type EducationProps = {
  heading?: string;
  items: EducationItem[];
};

export const Education = ({ heading = "Education", items }: EducationProps) => {
  const visibleItems = (items || []).filter((item: EducationItem) =>
    Boolean(
      item.school || item.degree || item.start || item.end || item.location
    )
  );

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">
        {heading}
      </h2>
      <div className="relative">
        {/* Vertical timeline line with gradient */}
        <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-gradient-to-b from-slate-300 via-slate-200 to-transparent dark:from-slate-600 dark:via-slate-700" />

        <div className="space-y-8 pl-12">
          {visibleItems.map((ed: EducationItem, idx: number) => (
            <div key={(ed.school || "") + idx} className="relative group">
              {/* Timeline dot with education icon */}
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
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
              </div>

              {/* Content card with improved styling */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md group-hover:translate-x-1">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {ed.school && (
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 leading-tight mb-2">
                        {ed.school}
                      </h3>
                    )}
                    {ed.degree && (
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        {ed.degree}
                      </p>
                    )}
                    {ed.location && (
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
                        {ed.location}
                      </p>
                    )}
                  </div>
                  {(ed.start || ed.end) && (
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
                      {[ed.start, ed.end].filter(Boolean).join(" — ")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
