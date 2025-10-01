export type SkillsProps = {
  items: string[];
};

export const Skills = ({ items }: SkillsProps) => {
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">
        Skills
      </h2>
      <div className="flex flex-wrap gap-2">
        {items.map((s) => (
          <span
            key={s}
            className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:border-foreground/20"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
};
