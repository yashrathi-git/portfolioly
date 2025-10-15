import BlurFade from "../magicui/blur-fade";
import { Badge } from "@/components/ui/badge";

const BLUR_FADE_DELAY = 0.04;

export type SkillsProps = {
  items: string[];
};

export const Skills = ({ items }: SkillsProps) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section id="skills">
      <div className="flex min-h-0 flex-col gap-y-3">
        <BlurFade delay={BLUR_FADE_DELAY * 9}>
          <h2 className="text-xl font-bold">Skills</h2>
        </BlurFade>
        <div className="flex flex-wrap gap-1">
          {items.map((skill, idx) => (
            <BlurFade key={skill} delay={BLUR_FADE_DELAY * 10 + idx * 0.05}>
              <Badge>{skill}</Badge>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
};
