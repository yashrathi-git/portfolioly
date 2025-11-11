import BlurFade from "../magicui/blur-fade";
import { Badge } from "@/components/ui/badge";
import {
  BLUR_FADE_DELAY,
  SECTION_DELAYS,
} from "../../lib/constants/animations";

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
        <BlurFade delay={BLUR_FADE_DELAY * SECTION_DELAYS.skills}>
          <h2 className="text-2xl font-bold">Skills</h2>
        </BlurFade>
        <div className="flex flex-wrap gap-1">
          {items.map((skill, idx) => (
            <BlurFade
              key={skill}
              delay={BLUR_FADE_DELAY * SECTION_DELAYS.skillsItems + idx * 0.05}
            >
              <Badge>{skill}</Badge>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
};
