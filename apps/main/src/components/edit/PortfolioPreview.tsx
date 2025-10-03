"use client";

import { useMemo, useState, useEffect } from "react";
import { Portfolio } from "@portfolioly/template-components";
import type { PortfolioData as TemplatePortfolioData } from "@portfolioly/template-components";
import type { PortfolioData as MainPortfolioData } from "@/types/portfolio";
import { mapPortfolioDataToTemplate } from "@/utils/portfolioDataMapper";
import { useAuth } from "@/lib/auth/AuthContext";
import { env } from "@/lib/env";

// Import the compiled CSS styles to ensure they're loaded
import "@portfolioly/template-components/style.css";

export interface PortfolioPreviewProps {
  data: MainPortfolioData;
}

interface EnsureUsernameResponse {
  username: string;
}

interface EnsureTokenResponse {
  token: string;
}

export function PortfolioPreview({ data }: PortfolioPreviewProps) {
  const { user } = useAuth();
  const [username, setUsername] = useState<string | undefined>(undefined);
  const [publicToken, setPublicToken] = useState<string | undefined>(undefined);
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const [fetchingToken, setFetchingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | undefined>(undefined);

  // Transform main app's portfolio data to template component format
  const templateData: TemplatePortfolioData = useMemo(() => {
    return mapPortfolioDataToTemplate(data);
  }, [data]);

  // Fetch username and public token for the authenticated user
  useEffect(() => {
    async function fetchUsernameAndToken() {
      if (!user) {
        setUsername(undefined);
        setPublicToken(undefined);
        setTokenError(undefined);
        return;
      }

      try {
        setFetchingToken(true);
        setTokenError(undefined);

        // Get Firebase auth token
        const firebaseToken = await user.getIdToken();
        setAuthToken(firebaseToken);

        // Step 1: Ensure username exists for the user
        const usernameResponse = await fetch(
          `${env.API_BASE_URL}/public/ensure-username`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${firebaseToken}`,
            },
            body: JSON.stringify({ user_id: user.uid }),
          }
        );

        if (!usernameResponse.ok) {
          throw new Error(`Failed to get username: ${usernameResponse.status}`);
        }

        const usernameData: EnsureUsernameResponse =
          await usernameResponse.json();
        setUsername(usernameData.username);

        // Step 2: Fetch public token for the username
        const tokenResponse = await fetch(
          `${env.API_BASE_URL}/public/ensure-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username: usernameData.username }),
          }
        );

        if (tokenResponse.status === 404) {
          setTokenError("Portfolio not found");
          setPublicToken(undefined);
          return;
        }

        if (!tokenResponse.ok) {
          throw new Error(`Failed to fetch token: ${tokenResponse.status}`);
        }

        const tokenData: EnsureTokenResponse = await tokenResponse.json();
        setPublicToken(tokenData.token);
      } catch (err) {
        console.error("Error fetching username and token:", err);
        setTokenError(
          err instanceof Error ? err.message : "Failed to load chat token"
        );
        setUsername(undefined);
        setPublicToken(undefined);
      } finally {
        setFetchingToken(false);
      }
    }

    fetchUsernameAndToken();
  }, [user]);

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
            Add your name and some basic information to see a preview of your
            portfolio.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Preview Container with proper boundaries and wider width */}
      <div className="relative w-full max-w-none min-h-[700px] border border-border rounded-lg overflow-hidden bg-background shadow-sm">
        {/* Preview Label */}
        <div className="absolute top-2 right-2 z-[60] px-2 py-1 bg-muted/90 backdrop-blur text-xs text-muted-foreground rounded border border-border/50">
          Live Preview
        </div>

        {/* Info banner for chat status */}
        {fetchingToken && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[60] max-w-md px-4 py-2 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 text-sm rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
            <p className="text-center">⏳ Loading chat functionality...</p>
          </div>
        )}

        {tokenError && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[60] max-w-md px-4 py-2 bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100 text-sm rounded-lg border border-yellow-200 dark:border-yellow-800 shadow-sm">
            <p className="text-center">⚠️ Chat unavailable: {tokenError}</p>
          </div>
        )}

        {!fetchingToken && !tokenError && !username && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[60] max-w-md px-4 py-2 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 text-sm rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
            <p className="text-center">
              💡 Set a username to enable live AI chat in preview
            </p>
          </div>
        )}

        {!fetchingToken && username && publicToken && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[60] max-w-md px-4 py-2 bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100 text-sm rounded-lg border border-green-200 dark:border-green-800 shadow-sm">
            <p className="text-center">✓ Live AI chat enabled</p>
          </div>
        )}

        {/* Portfolio Content - Full width preview */}
        <div className="w-full h-full">
          <Portfolio
            portfolioData={templateData}
            isOwner={true}
            isPreview={true}
            profile={profile}
            suggestions={suggestions}
            presets={presets}
            username={username}
            apiBaseUrl={env.API_BASE_URL}
            authToken={authToken}
            publicToken={publicToken}
          />
        </div>
      </div>
    </div>
  );
}

export default PortfolioPreview;
