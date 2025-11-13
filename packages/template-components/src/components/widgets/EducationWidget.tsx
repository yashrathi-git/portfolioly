"use client";

import type { DisplayEducation } from "portfolioly-schema";
import { EducationSection } from "../shared/EducationSection";

export type EducationWidgetProps = {
  heading?: string;
  items: DisplayEducation[];
};

export const EducationWidget = ({
  heading = "Education",
  items,
}: EducationWidgetProps) => {
  return <EducationSection items={items} heading={heading} variant="widget" />;
};

export default EducationWidget;
