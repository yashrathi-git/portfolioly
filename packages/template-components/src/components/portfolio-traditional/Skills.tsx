export type SkillsProps = {
  items: string[];
};

export const Skills = ({ items }: SkillsProps) => {
  return (
    <div>
      {/* Enhanced section header */}
      <div className="mb-8 sm:mb-10 lg:mb-12">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3">
          Skills & Technologies
        </h2>
        <div className="w-16 h-1 bg-gradient-to-r from-green-600 to-blue-600 rounded-full"></div>
        <p className="text-[var(--muted-foreground)] mt-4 text-sm sm:text-base max-w-2xl">
          Technologies, frameworks, and tools I work with to bring ideas to life.
        </p>
      </div>
      
      {/* Enhanced skills grid with better responsive design */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {items.map((skill, index) => (
          <div
            key={skill}
            className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 sm:px-4 sm:py-4 text-sm sm:text-base font-medium transition-all duration-300 hover:border-[var(--foreground)]/20 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1 cursor-default"
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 rounded-xl"></div>
            
            {/* Skill icon placeholder */}
            <div className="relative flex items-center justify-center text-center min-h-[2rem]">
              <span className="relative z-10 group-hover:scale-105 transition-transform duration-200 leading-tight">
                {skill}
              </span>
            </div>

            {/* Subtle accent border */}
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/0 to-transparent group-hover:via-blue-500/50 transition-all duration-300"></div>
          </div>
        ))}
      </div>

      {/* Skills count indicator */}
      <div className="mt-6 sm:mt-8 text-center">
        <span className="inline-flex items-center gap-2 text-xs sm:text-sm text-[var(--muted-foreground)] bg-[var(--card)]/50 border border-[var(--border)]/50 rounded-full px-3 py-2">
          <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
          {items.length} skill{items.length !== 1 ? 's' : ''} and counting
        </span>
      </div>
    </div>
  );
};