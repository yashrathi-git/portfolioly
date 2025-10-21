/**
 * Navigation section configuration for the portfolio editor.
 * Defines all available sections with their metadata, icons, and completion logic.
 */

import type { LucideIcon } from "lucide-react";
import {
  User,
  Camera,
  Link,
  Briefcase,
  FolderGit2,
  GraduationCap,
  Award,
  FileText,
  Layout,
} from "lucide-react";
import type { PortfolioData } from "@portfolioly/schema";
import { PersonalInfoForm } from "./PersonalInfoForm";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";
import { ProfilesForm } from "./ProfilesForm";
import { WorkExperienceForm } from "./WorkExperienceForm";
import { ProjectsForm } from "./ProjectsForm";
import { EducationForm } from "./EducationForm";
import { CertificationsForm } from "./CertificationsForm";
import { TextBlobsForm } from "./TextBlobsForm";
import { LayoutSettingsForm } from "./LayoutSettingsForm";

/**
 * Represents a navigation section in the portfolio editor.
 */
export interface NavigationSection {
  /** Unique identifier for the section */
  id: string;
  /** Display label for the navigation item */
  label: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** React component to render for this section */
  component: React.ComponentType<any>;
  /** Function to determine if this section has data */
  hasData: (data: PortfolioData) => boolean;
}

/**
 * Configuration array of all portfolio sections.
 * Sections are displayed in the order defined here.
 */
export const sections: NavigationSection[] = [
  {
    id: "personal",
    label: "Personal Info",
    icon: User,
    component: PersonalInfoForm,
    hasData: (data) => Boolean(data.personal_info?.full_name),
  },
  {
    id: "photo",
    label: "Profile Photo",
    icon: Camera,
    component: ProfilePhotoUpload,
    hasData: (data) => Boolean(data.personal_info?.profile_photo_url),
  },
  {
    id: "profiles",
    label: "Social Links",
    icon: Link,
    component: ProfilesForm,
    hasData: (data) => (data.personal_info?.profiles?.length ?? 0) > 0,
  },
  {
    id: "experience",
    label: "Work Experience",
    icon: Briefcase,
    component: WorkExperienceForm,
    hasData: (data) => (data.work_experiences?.length ?? 0) > 0,
  },
  {
    id: "projects",
    label: "Projects",
    icon: FolderGit2,
    component: ProjectsForm,
    hasData: (data) => (data.projects?.length ?? 0) > 0,
  },
  {
    id: "education",
    label: "Education",
    icon: GraduationCap,
    component: EducationForm,
    hasData: (data) => (data.education?.length ?? 0) > 0,
  },
  {
    id: "certifications",
    label: "Certifications",
    icon: Award,
    component: CertificationsForm,
    hasData: (data) => (data.certifications?.length ?? 0) > 0,
  },
  {
    id: "context",
    label: "Additional Info",
    icon: FileText,
    component: TextBlobsForm,
    hasData: (data) =>
      Boolean(
        data.text_blobs?.achievements || data.text_blobs?.additional_context
      ),
  },
  {
    id: "layout",
    label: "Layout Settings",
    icon: Layout,
    component: LayoutSettingsForm,
    hasData: (data) => Boolean(data.layout_settings),
  },
];
