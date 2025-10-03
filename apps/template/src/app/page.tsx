"use client";

import { useEffect, useState } from "react";
import { TemplateProvider, Portfolio } from "@portfolioly/template-components";

// Get API base URL from environment or use default
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface EnsureUsernameResponse {
  username: string;
}

interface EnsureTokenResponse {
  token: string;
}

export default function Home() {
  const [username, setUsername] = useState<string | undefined>();
  const [publicToken, setPublicToken] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  // For demo purposes, we'll use a hardcoded user_id
  // In a real app, this would come from authentication context
  const userId = "demo-user-id";

  useEffect(() => {
    async function fetchUsernameAndToken() {
      try {
        // Step 1: Ensure username exists for the user
        const usernameResponse = await fetch(
          `${API_BASE_URL}/public/ensure-username`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_id: userId }),
          }
        );

        if (!usernameResponse.ok) {
          throw new Error(`Failed to get username: ${usernameResponse.status}`);
        }

        const usernameData: EnsureUsernameResponse =
          await usernameResponse.json();
        setUsername(usernameData.username);

        // Step 2: Fetch token for the username
        const tokenResponse = await fetch(
          `${API_BASE_URL}/public/ensure-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username: usernameData.username }),
          }
        );

        if (tokenResponse.status === 404) {
          setError("Portfolio not found");
          setLoading(false);
          return;
        }

        if (!tokenResponse.ok) {
          throw new Error(`Failed to fetch token: ${tokenResponse.status}`);
        }

        const tokenData: EnsureTokenResponse = await tokenResponse.json();
        setPublicToken(tokenData.token);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching username and token:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load portfolio"
        );
        setLoading(false);
      }
    }

    fetchUsernameAndToken();
  }, [userId]);

  // Show loading screen while fetching
  if (loading) {
    return (
      <TemplateProvider>
        <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading portfolio...</p>
          </div>
        </main>
      </TemplateProvider>
    );
  }

  // Show error screen if fetch failed
  if (error) {
    return (
      <TemplateProvider>
        <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-4xl">⚠️</div>
            <h1 className="text-2xl font-semibold">Error Loading Portfolio</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </main>
      </TemplateProvider>
    );
  }

  // Don't render until both username and token are available
  if (!username || !publicToken) {
    return null;
  }

  return (
    <TemplateProvider>
      <main className="min-h-screen bg-background text-foreground">
        <Portfolio
          apiBaseUrl={API_BASE_URL}
          username={username}
          publicToken={publicToken}
        />
      </main>
    </TemplateProvider>
  );
}
