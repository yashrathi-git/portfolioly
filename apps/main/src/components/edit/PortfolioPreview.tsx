"use client";

import { useMemo, useState, useEffect } from "react";
import { Portfolio } from "portfolioly-template-components";
import type { DisplayPortfolioData as TemplatePortfolioData } from "portfolioly-template-components";
import type { PortfolioData as MainPortfolioData } from "portfolioly-schema";
import { mapPortfolioDataToTemplate } from "@/utils/portfolioDataMapper";
import { useAuth } from "@/lib/auth/AuthContext";
import { env } from "@/lib/env";
import { fetchUsernameAndToken, PublicTokenError } from "@/lib/api/publicToken";

// Import the compiled CSS styles to ensure they're loaded
import "portfolioly-template-components/style.css";

export interface PortfolioPreviewProps {
  data: MainPortfolioData;
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
    async function loadUsernameAndToken() {
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

        // Fetch username and public token using API helper
        const result = await fetchUsernameAndToken(user.uid, firebaseToken);
        setUsername(result.username);
        setPublicToken(result.publicToken);
      } catch (err) {
        console.error("Error fetching username and token:", err);

        if (err instanceof PublicTokenError) {
          // Handle specific error cases
          if (err.statusCode === 404) {
            setTokenError("Portfolio not found");
          } else {
            setTokenError(err.message);
          }
        } else {
          setTokenError("Failed to load chat token");
        }

        setUsername(undefined);
        setPublicToken(undefined);
      } finally {
        setFetchingToken(false);
      }
    }

    loadUsernameAndToken();
  }, [user]);

  // Generate dynamic profile for chat header based on actual data
  // console.log(data.education);
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
      name: personalInfo.full_name || undefined,
      badge: headerLinks.length ? "Chat Portfolio" : undefined,
      links: headerLinks,
    };
  }, [data]);
  // templateData.projects[0].primaryCardImage =
  //   "https://user-images.githubusercontent.com/57002207/147270294-de0ec3f9-7bfa-4c63-84de-b4239fd4995e.gif";

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

  const hasContent = Boolean(
    profile ||
      suggestions.length > 0 ||
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

        {/* Portfolio Content - Full width preview */}
        <div className="w-full h-full">
          <Portfolio
            portfolioData={templateData}
            isOwner={true}
            isPreview={true}
            profile={profile}
            suggestions={suggestions}
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
