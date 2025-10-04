import type { EducationItem } from "../../types/portfolio";
import { GraduationCap, Calendar, MapPin } from "lucide-react";

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
      {/* Enhanced section header */}
      <div className="mb-8 sm:mb-10 lg:mb-12">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3">
          {heading}
        </h2>
        <div className="w-16 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"></div>
        <p className="text-[var(--muted-foreground)] mt-4 text-sm sm:text-base max-w-2xl">
          Academic foundation and learning journey that supports my professional growth.
        </p>
      </div>

      {/* Enhanced education cards */}
      <div className="space-y-6 sm:space-y-8">
        {visibleItems.map((edu: EducationItem, idx: number) => (
          <article
            key={(edu.school || "") + idx}
            className="group relative flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-all duration-300 hover:border-[var(--foreground)]/20 hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1"
            style={{
              animationDelay: `${idx * 150}ms`,
            }}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
            
            <div className="relative p-6 sm:p-7 lg:p-8">
              {/* Header section */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  {/* Institution name */}
                  {edu.school && (
                    <h3 className="text-xl sm:text-2xl font-bold leading-tight mb-2 text-[var(--foreground)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg mt-1 group-hover:scale-110 transition-transform duration-200">
                        <GraduationCap className="w-4 h-4 text-white" />
                      </div>
                      <span className="flex-1">{edu.school}</span>
                    </h3>
                  )}
                  
                  {/* Degree information */}
                  {edu.degree && (
                    <div className="flex items-start gap-3 ml-11">
                      <div className="inline-flex items-center gap-2 text-sm sm:text-base text-[var(--muted-foreground)] font-semibold bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg">
                        <span>{edu.degree}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Date range */}
                {(edu.start || edu.end) && (
                  <div className="flex items-center gap-2 text-sm sm:text-base text-[var(--muted-foreground)] font-medium bg-[var(--muted)]/30 px-3 py-2 rounded-lg border border-[var(--border)]/50 whitespace-nowrap sm:ml-4">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>
                      {[edu.start, edu.end].filter(Boolean).join(" — ")}
                    </span>
                  </div>
                )}
              </div>

              {/* Location */}
              {edu.location && (
                <div className="flex items-center gap-2 text-sm sm:text-base text-[var(--muted-foreground)] ml-11">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>{edu.location}</span>
                </div>
              )}
            </div>

            {/* Subtle accent border */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-hover:via-indigo-500/50 transition-all duration-300"></div>
          </article>
        ))}
      </div>

      {/* Education count indicator */}
      <div className="mt-8 sm:mt-10 text-center">
        <span className="inline-flex items-center gap-2 text-xs sm:text-sm text-[var(--muted-foreground)] bg-[var(--card)]/50 border border-[var(--border)]/50 rounded-full px-4 py-2">
          <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          {visibleItems.length} institution{visibleItems.length !== 1 ? 's' : ''} • Academic journey
        </span>
      </div>
    </div>
  );
};