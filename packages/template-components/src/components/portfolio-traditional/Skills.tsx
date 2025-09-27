export type SkillsProps = {
  items: string[];
};

export const Skills = ({ items }: SkillsProps) => {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">Skills</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
};