"use client";

import { typography } from "../../lib/typography";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";
import BlurFade from "../magicui/blur-fade";
import { WIDGET_ANIMATION } from "../../lib/constants/animations";

export interface SkillsWidgetProps {
  heading?: string;
  skills: string[];
}

export const SkillsWidget = ({
  heading = "Skills",
  skills,
}: SkillsWidgetProps) => {
  if (!skills || skills.length === 0) {
    return null;
  }

  return (
    <BlurFade
      delay={WIDGET_ANIMATION.delay}
      duration={WIDGET_ANIMATION.duration}
      yOffset={WIDGET_ANIMATION.yOffset}
      blur={WIDGET_ANIMATION.blur}
    >
      <div className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm p-5 sm:p-6">
        <h3 className={cn("font-semibold mb-4", typography.heading.secondary)}>
          {heading}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill, idx) => (
            <BlurFade
              key={skill}
              delay={
                WIDGET_ANIMATION.delay + idx * WIDGET_ANIMATION.staggerDelay
              }
              duration={WIDGET_ANIMATION.duration}
              yOffset={WIDGET_ANIMATION.yOffset}
              blur={WIDGET_ANIMATION.blur}
            >
              <Badge variant="secondary">{skill}</Badge>
            </BlurFade>
          ))}
        </div>
      </div>
    </BlurFade>
  );
};

export default SkillsWidget;
