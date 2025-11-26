"use client";

import { useMemo, useState, useEffect, memo } from "react";
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
  /** Pre-fetched username (avoids duplicate API call) */
  username?: string;
  /** Pre-fetched public token (avoids duplicate API call) */
  publicToken?: string;
  /** Pre-fetched auth token (avoids duplicate API call) */
  authToken?: string;
}

const PortfolioPreviewComponent = ({
  data,
  username: propUsername,
  publicToken: propPublicToken,
  authToken: propAuthToken,
}: PortfolioPreviewProps) => {
  const { user } = useAuth();
  const [username, setUsername] = useState<string | undefined>(propUsername);
  const [publicToken, setPublicToken] = useState<string | undefined>(
    propPublicToken
  );
  const [authToken, setAuthToken] = useState<string | undefined>(propAuthToken);

  // Transform main app's portfolio data to template component format
  const templateData: TemplatePortfolioData = useMemo(() => {
    return mapPortfolioDataToTemplate(data);
  }, [data]);

  // Sync with props when they change (from parent)
  useEffect(() => {
    if (propUsername !== undefined) setUsername(propUsername);
  }, [propUsername]);

  useEffect(() => {
    if (propPublicToken !== undefined) setPublicToken(propPublicToken);
  }, [propPublicToken]);

  useEffect(() => {
    if (propAuthToken !== undefined) setAuthToken(propAuthToken);
  }, [propAuthToken]);

  // Only fetch if props not provided (backward compatibility)
  useEffect(() => {
    // Skip fetching if props are provided
    if (propUsername !== undefined && propPublicToken !== undefined) {
      return;
    }

    if (!user) {
      setUsername(undefined);
      setPublicToken(undefined);
      return;
    }

    const currentUser = user;

    async function loadUsernameAndToken() {
      try {
        const firebaseToken = await currentUser.getIdToken();
        if (propAuthToken === undefined) {
          setAuthToken(firebaseToken);
        }

        const result = await fetchUsernameAndToken(
          currentUser.uid,
          firebaseToken
        );
        if (propUsername === undefined) setUsername(result.username);
        if (propPublicToken === undefined) setPublicToken(result.publicToken);
      } catch (err) {
        console.error("Error fetching username and token:", err);
        if (propUsername === undefined) setUsername(undefined);
        if (propPublicToken === undefined) setPublicToken(undefined);
      }
    }

    loadUsernameAndToken();
  }, [user, propUsername, propPublicToken, propAuthToken]);

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

  const hasContent = Boolean(
    profile ||
      (templateData.profile &&
        (templateData.profile.name ||
          templateData.profile.headline ||
          templateData.profile.location)) ||
      (templateData.projects && templateData.projects.length > 0) ||
      (templateData.experience && templateData.experience.length > 0)
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
            username={username}
            apiBaseUrl={env.API_BASE_URL}
            authToken={authToken}
            publicToken={publicToken}
          />
        </div>
      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders when switching modes
export const PortfolioPreview = memo(PortfolioPreviewComponent);

export default PortfolioPreview;
