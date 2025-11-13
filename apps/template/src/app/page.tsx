"use client";

import {
  TemplateProvider,
  PortfolioWrapper,
} from "portfolioly-template-components";
import "portfolioly-template-components/style.css";
import { getUsername, getAPIBaseURL, getPublicToken } from "@/lib/env";

export default function Home() {
  const username = getUsername();
  const apiBaseUrl = getAPIBaseURL();
  const publicToken = getPublicToken();

  return (
    <TemplateProvider>
      <main className="min-h-screen bg-background text-foreground">
        <PortfolioWrapper
          username={username}
          apiBaseUrl={apiBaseUrl}
          publicToken={publicToken}
        />
      </main>
    </TemplateProvider>
  );
}
