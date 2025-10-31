import { WorkExperienceSection } from "../shared/WorkExperienceSection";
import type { DisplayWorkExperience } from "@portfolioly/schema";

export type WorkExperienceProps = {
  items?: DisplayWorkExperience[];
};

export function WorkExperience({ items = [] }: WorkExperienceProps) {
  return <WorkExperienceSection items={items} variant="traditional" />;
}
