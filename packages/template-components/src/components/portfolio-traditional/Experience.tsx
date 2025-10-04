import type { ExperienceItem } from "../../types/portfolio";
import { MarkdownContent } from "../../utils/markdown-parser";
import { Building2, Calendar, MapPin } from "lucide-react";

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
      {/* Enhanced section header */}
      <div className="mb-8 sm:mb-10 lg:mb-12">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3">
          Professional Experience
        </h2>
        <div className="w-16 h-1 bg-gradient-to-r from-orange-600 to-red-600 rounded-full"></div>
        <p className="text-[var(--muted-foreground)] mt-4 text-sm sm:text-base max-w-2xl">
          My professional journey and the roles that have shaped my career.
        </p>
      </div>

      {/* Enhanced timeline layout */}
      <div className="relative">
        {/* Timeline line (hidden on mobile for cleaner look) */}
        <div className="hidden lg:block absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500/50 via-red-500/30 to-transparent"></div>

        <div className="space-y-6 sm:space-y-8">
          {visibleItems.map((exp: ExperienceItem, idx: number) => (
            <article
              key={`${exp.companyName || "experience"}-${idx}`}
              className="group relative flex flex-col lg:flex-row lg:gap-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-all duration-300 hover:border-[var(--foreground)]/20 hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1"
              style={{
                animationDelay: `${idx * 150}ms`,
              }}
            >
              {/* Timeline dot (desktop only) */}
              <div className="hidden lg:flex absolute left-8 top-8 -translate-x-1/2 z-10">
                <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full border-4 border-[var(--background)] shadow-lg group-hover:scale-125 transition-transform duration-300">
                  <Building2 className="w-3 h-3 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 sm:p-7 lg:p-8 lg:ml-8">
                {/* Header section with enhanced layout */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    {/* Company name with enhanced styling */}
                    {(exp.role || exp.companyName) && (
                      <h3 className="text-xl sm:text-2xl font-bold leading-tight mb-2 text-[var(--foreground)] group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-200">
                        {exp.role && exp.companyName
                          ? `${exp.companyName}`
                          : exp.companyName || exp.role}
                      </h3>
                    )}
                    
                    {/* Role badge */}
                    {exp.companyName && exp.role && (
                      <div className="inline-flex items-center gap-2 text-sm sm:text-base text-[var(--muted-foreground)] font-semibold bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg mb-3">
                        <Building2 className="h-4 w-4" />
                        {exp.role}
                      </div>
                    )}
                  </div>

                  {/* Date range with enhanced design */}
                  {(exp.start || exp.end) && (
                    <div className="flex items-center gap-2 text-sm sm:text-base text-[var(--muted-foreground)] font-medium bg-[var(--muted)]/30 px-3 py-2 rounded-lg border border-[var(--border)]/50 whitespace-nowrap">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {[exp.start, exp.end].filter(Boolean).join(" — ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Location with icon */}
                {exp.location && (
                  <div className="flex items-center gap-2 text-sm sm:text-base text-[var(--muted-foreground)] mb-4">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{exp.location}</span>
                  </div>
                )}

                {/* Experience highlights with enhanced markdown rendering */}
                {exp.points?.length ? (
                  <div className="prose prose-sm sm:prose prose-slate dark:prose-invert max-w-none">
                    <MarkdownContent content={exp.points} />
                  </div>
                ) : null}
              </div>

              {/* Subtle accent border */}
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-orange-500/0 to-transparent group-hover:via-orange-500/50 transition-all duration-300"></div>
            </article>
          ))}
        </div>
      </div>

      {/* Experience count indicator */}
      <div className="mt-8 sm:mt-10 text-center">
        <span className="inline-flex items-center gap-2 text-xs sm:text-sm text-[var(--muted-foreground)] bg-[var(--card)]/50 border border-[var(--border)]/50 rounded-full px-4 py-2">
          <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
          {visibleItems.length} role{visibleItems.length !== 1 ? 's' : ''} • Professional journey
        </span>
      </div>
    </div>
  );
};