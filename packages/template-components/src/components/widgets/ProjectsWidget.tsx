import type { DisplayProject } from "portfolioly-schema";
import { ProjectsSection } from "../shared/ProjectsSection";

export type ProjectsWidgetProps = {
  heading?: string;
  projects: DisplayProject[];
};

export const ProjectsWidget = ({
  heading = "Projects",
  projects,
}: ProjectsWidgetProps) => {
  return (
    <ProjectsSection items={projects} heading={heading} variant="widget" />
  );
};

export default ProjectsWidget;
