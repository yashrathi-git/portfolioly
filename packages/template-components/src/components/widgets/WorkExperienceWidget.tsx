"use client";

import { WorkExperienceSection } from "../shared/WorkExperienceSection";
import type { DisplayWorkExperience } from "@portfolioly/schema";

export type WorkExperienceWidgetProps = {
  heading?: string;
  items?: DisplayWorkExperience[];
};

export const WorkExperienceWidget = ({
  heading = "Work Experience",
  items = [],
}: WorkExperienceWidgetProps) => {
  return (
    <WorkExperienceSection items={items} heading={heading} variant="widget" />
  );
};

export default WorkExperienceWidget;
