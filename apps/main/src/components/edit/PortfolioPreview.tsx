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

    if (!personalInfo) {
      return undefined;
    }

    const headerLinks: { type: "github" | "mail" | "link"; href: string }[] =
      [];

    const githubProfile = socials.find((p) => p.type === "github" && p.url);
    if (githubProfile?.url) {
      headerLinks.push({ type: "github", href: githubProfile.url });
    }

    if (personalInfo.email) {
      headerLinks.push({ type: "mail", href: `mailto:${personalInfo.email}` });
    }

    const websiteProfile = socials.find(
      (p) => (p.type === "website" || p.type === "portfolio") && p.url
    );
    if (websiteProfile?.url) {
      headerLinks.push({ type: "link", href: websiteProfile.url });
    }

    if (!headerLinks.length && !personalInfo.full_name) {
      return undefined;
    }

    return {
      name: personalInfo.full_name,
      badge: headerLinks.length ? "Chat Portfolio" : undefined,
      links: headerLinks,
    };
  }, [data]);

  // Dynamic suggestions based on available data
  const suggestions = useMemo(() => {
    const availableSuggestions: { id: string; label: string; icon: string }[] =
      [];

    if (
      data.personal_info?.summary ||
      data.personal_info?.headline ||
      data.personal_info?.full_name
    ) {
      availableSuggestions.push({ id: "me", label: "About Me", icon: "user" });
    }

    if (data.projects && data.projects.length > 0) {
      availableSuggestions.push({
        id: "projects",
        label: "Projects",
        icon: "folderGit2",
      });
    }

    const hasSkills =
      data.work_experiences?.some((exp) => exp.technologies?.length) ||
      data.projects?.some((proj) => proj.technologies?.length);
    if (hasSkills) {
      availableSuggestions.push({
        id: "skills",
        label: "Skills",
        icon: "wrench",
      });
    }

    if (data.work_experiences && data.work_experiences.length > 0) {
      availableSuggestions.push({
        id: "experience",
        label: "Experience",
        icon: "briefcase",
      });
    }

    if (data.education && data.education.length > 0) {
      availableSuggestions.push({
        id: "education",
        label: "Education",
        icon: "graduationCap",
      });
    }

    const hasContact = Boolean(
      data.personal_info?.email ||
        data.personal_info?.profiles?.some(
          (p) =>
            ["linkedin", "github", "website", "portfolio"].includes(
              p.type ?? ""
            ) && p.url
        )
    );

    if (hasContact) {
      availableSuggestions.push({
        id: "contact",
        label: "Contact",
        icon: "mail",
      });
    }

    return availableSuggestions;
  }, [data]);

  // Dynamic presets based on actual user data
  const presets = useMemo(() => {
    const personalInfo = data.personal_info;
    const name = personalInfo?.full_name;
    const presetResponses: Record<string, string> = {};

    if (personalInfo?.summary || personalInfo?.headline || name) {
      presetResponses["About Me"] =
        personalInfo?.summary ||
        [
          name ? `I'm ${name}` : null,
          personalInfo?.headline,
          personalInfo?.location,
        ]
          .filter(Boolean)
          .join(" · ") ||
        "Thanks for your interest!";
    }

    if (data.projects && data.projects.length > 0) {
      const projectCount = data.projects.length;
      const topProject = data.projects[0];
      presetResponses["Projects"] =
        `I've worked on ${projectCount} project${
          projectCount > 1 ? "s" : ""
        }.` + (topProject.name ? ` Recent highlight: ${topProject.name}.` : "");
    }

    const allTechnologies = new Set<string>();
    data.work_experiences?.forEach((exp) => {
      exp.technologies?.forEach((tech) => tech && allTechnologies.add(tech));
    });
    data.projects?.forEach((proj) => {
      proj.technologies?.forEach((tech) => tech && allTechnologies.add(tech));
    });

    if (allTechnologies.size > 0) {
      const techList = Array.from(allTechnologies).slice(0, 6).join(", ");
      presetResponses["Skills"] =
        `My current toolkit includes ${techList}` +
        (allTechnologies.size > 6 ? " and more." : ".");
    }

    if (data.work_experiences && data.work_experiences.length > 0) {
      const currentJob = data.work_experiences.find((exp) => exp.is_current);
      const latestJob = currentJob || data.work_experiences[0];
      const org = latestJob.organization || "my company";
      const title = latestJob.title || "a professional";
      presetResponses["Experience"] = `I'm ${
        currentJob ? "currently" : "recently"
      } ${title} at ${org}.`;
    }

    if (data.education && data.education.length > 0) {
      const latestEdu = data.education[0];
      presetResponses["Education"] =
        `I studied ${latestEdu.degree || ""}`.trim() +
        (latestEdu.institution ? ` at ${latestEdu.institution}.` : "");
    }

    if (
      data.personal_info?.email ||
      data.personal_info?.profiles?.some(
        (p) =>
          ["linkedin", "github", "website", "portfolio"].includes(
            p.type ?? ""
          ) && p.url
      )
    ) {
      presetResponses["Contact"] =
        "Feel free to reach out via the contact details listed.";
    }

    return presetResponses;
  }, [data]);

  const hasContent = Boolean(
    profile ||
      suggestions.length > 0 ||
      Object.keys(presets).length > 0 ||
      (templateData.profile &&
        (templateData.profile.name ||
          templateData.profile.headline ||
          templateData.profile.location))
  );

  if (!hasContent) {
    return (
      <div className="w-full min-h-[400px] grid place-items-center">
        <div className="max-w-md text-center space-y-4 text-muted-foreground">
          <p>
            We don’t have enough information yet. I’ll queue this request for
            the AI assistant to generate a tailored response.
          </p>
        </div>
      </div>
    );
  }

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
