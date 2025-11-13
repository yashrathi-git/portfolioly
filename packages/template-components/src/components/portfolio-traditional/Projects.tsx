import type { DisplayProject } from "portfolioly-schema";
import { ProjectsSection } from "../shared/ProjectsSection";

export type ProjectsProps = {
  items?: DisplayProject[];
};

export const Projects = ({ items = [] }: ProjectsProps) => {
  return <ProjectsSection items={items} variant="traditional" />;
};
