"use client";

import { useMemo } from "react";
import { ChatPortfolio } from "@portfolioly/template-components";
import type { PortfolioData as TemplatePortfolioData } from "@portfolioly/template-components";
import type { PortfolioData as MainPortfolioData } from "@/types/portfolio";
import { mapPortfolioDataToTemplate } from "@/utils/portfolioDataMapper";

// Import the compiled CSS styles to ensure they're loaded
import "@portfolioly/template-components/style.css";

export interface PortfolioPreviewProps {
  data: MainPortfolioData;
  useAuthenticatedData?: boolean; // Future: use authenticated API data
}

export function PortfolioPreview({
  data,
  useAuthenticatedData = false,
}: PortfolioPreviewProps) {
  // Transform main app's portfolio data to template component format
  const templateData: TemplatePortfolioData = useMemo(() => {
    return mapPortfolioDataToTemplate(data);
  }, [data]);

  // Future: When useAuthenticatedData is true, we could wrap this with HydrationProvider
  // and use the authenticated API to fetch real-time data instead of the passed data
  // For now, we use the data passed from the editor for preview purposes
  if (useAuthenticatedData) {
    // TODO: Implement authenticated data fetching with HydrationProvider
    // This would be useful for a live preview that shows real-time data from the API
  }

  // Generate dynamic profile for chat header based on actual data
  const profile = useMemo(() => {
    const personalInfo = data.personal_info;
    const socials = personalInfo?.profiles || [];

    return {
      name: personalInfo?.full_name || "Portfolio Owner",
      badge: "Chat Portfolio",
      links: [
        // Add GitHub link if available
        ...(socials.find((p) => p.type === "github")
          ? [
              {
                type: "github" as const,
                href: socials.find((p) => p.type === "github")?.url || "#",
              },
            ]
          : []),
        // Add email link if available
        ...(personalInfo?.email
          ? [{ type: "mail" as const, href: `mailto:${personalInfo.email}` }]
          : []),
        // Add website/portfolio link if available
        ...(socials.find((p) => p.type === "website" || p.type === "portfolio")
          ? [
              {
                type: "link" as const,
                href:
                  socials.find(
                    (p) => p.type === "website" || p.type === "portfolio"
                  )?.url || "#",
              },
            ]
          : []),
      ],
    };
  }, [data]);

  // Dynamic suggestions based on available data
  const suggestions = useMemo(() => {
    const baseSuggestions = [{ id: "me", label: "About Me", icon: "user" }];

    // Add projects suggestion if user has projects
    if (data.projects && data.projects.length > 0) {
      baseSuggestions.push({
        id: "projects",
        label: "Projects",
        icon: "folderGit2",
      });
    }

    // Add skills suggestion if user has work experience or projects with technologies
    const hasSkills =
      data.work_experiences?.some((exp) => exp.technologies?.length) ||
      data.projects?.some((proj) => proj.technologies?.length);
    if (hasSkills) {
      baseSuggestions.push({ id: "skills", label: "Skills", icon: "wrench" });
    }

    // Add experience suggestion if user has work experience
    if (data.work_experiences && data.work_experiences.length > 0) {
      baseSuggestions.push({
        id: "experience",
        label: "Experience",
        icon: "briefcase",
      });
    }

    // Add education suggestion if user has education
    if (data.education && data.education.length > 0) {
      baseSuggestions.push({
        id: "education",
        label: "Education",
        icon: "graduationCap",
      });
    }

    // Always add contact suggestion
    baseSuggestions.push({ id: "contact", label: "Contact", icon: "mail" });

    return baseSuggestions;
  }, [data]);

  // Dynamic presets based on actual user data
  const presets = useMemo(() => {
    const personalInfo = data.personal_info;
    const name = personalInfo?.full_name || "Portfolio Owner";

    const presetResponses: Record<string, string> = {
      "About Me":
        personalInfo?.summary ||
        `I'm ${name}, ${personalInfo?.headline || "a professional"} based in ${
          personalInfo?.location || "my location"
        }. ${
          personalInfo?.summary ||
          "I'm passionate about my work and always looking for new challenges."
        }`,
    };

    // Add projects preset if user has projects
    if (data.projects && data.projects.length > 0) {
      const projectCount = data.projects.length;
      const topProject = data.projects[0];
      presetResponses["Projects"] = `I've worked on ${projectCount} project${
        projectCount > 1 ? "s" : ""
      } including ${topProject.name || "various projects"}. ${
        topProject.highlights?.[0] || "Check out my work!"
      } You can explore more details about each project.`;
    }

    // Add skills preset if user has technologies
    const allTechnologies = new Set<string>();
    data.work_experiences?.forEach((exp) => {
      exp.technologies?.forEach((tech) => allTechnologies.add(tech));
    });
    data.projects?.forEach((proj) => {
      proj.technologies?.forEach((tech) => allTechnologies.add(tech));
    });

    if (allTechnologies.size > 0) {
      const techList = Array.from(allTechnologies).slice(0, 6).join(", ");
      presetResponses["Skills"] = `My technical skills include ${techList}${
        allTechnologies.size > 6 ? ", and more" : ""
      }. I'm always learning new technologies and staying up-to-date with industry trends.`;
    }

    // Add experience preset if user has work experience
    if (data.work_experiences && data.work_experiences.length > 0) {
      const currentJob = data.work_experiences.find((exp) => exp.is_current);
      const latestJob = currentJob || data.work_experiences[0];
      presetResponses["Experience"] = `I'm ${
        currentJob ? "currently working" : "experienced"
      } as ${latestJob.title || "a professional"} at ${
        latestJob.organization || "my company"
      }. ${
        latestJob.highlights?.[0] || "I have valuable experience in my field."
      } Feel free to ask about my career journey!`;
    }

    // Add education preset if user has education
    if (data.education && data.education.length > 0) {
      const latestEdu = data.education[0];
      presetResponses["Education"] = `I studied ${latestEdu.degree || "at"} ${
        latestEdu.branch ? `in ${latestEdu.branch}` : ""
      } at ${latestEdu.institution || "university"}. ${
        latestEdu.grade ? `I graduated with ${latestEdu.grade}.` : ""
      } My education provided a strong foundation for my career.`;
    }

    // Always add contact preset
    const contactMethods = [];
    if (personalInfo?.email) contactMethods.push("email");
    if (personalInfo?.profiles?.some((p) => p.type === "linkedin"))
      contactMethods.push("LinkedIn");
    if (personalInfo?.profiles?.some((p) => p.type === "github"))
      contactMethods.push("GitHub");

    presetResponses["Contact"] = `Feel free to reach out via ${
      contactMethods.length > 0
        ? contactMethods.join(" or ")
        : "the contact information provided"
    }. I'm always open to discussing new opportunities, collaborations, and interesting projects!`;

    return presetResponses;
  }, [data]);

  return (
    <ChatPortfolio
      profile={profile}
      suggestions={suggestions}
      presets={presets}
      portfolioData={templateData}
    />
  );
}

export default PortfolioPreview;
