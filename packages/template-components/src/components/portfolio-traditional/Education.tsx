import type { DisplayEducation } from "portfolioly-schema";
import { EducationSection } from "../shared/EducationSection";

type EducationItem = DisplayEducation & { logoUrl?: string };

export type EducationSectionProps = {
  items?: EducationItem[];
};

export function Education({ items = [] }: EducationSectionProps) {
  return <EducationSection items={items} variant="traditional" />;
}
