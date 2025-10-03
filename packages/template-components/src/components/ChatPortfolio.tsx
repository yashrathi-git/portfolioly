"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ChatHeader from "./chat/Header";
import { EmptyState } from "./chat/EmptyState";
import { Thread } from "./chat/Thread";
import { Composer } from "./chat/Composer";
import { Suggestions } from "./chat/Suggestions";
import type {
  Message,
  ChatProfile,
  Suggestion,
  ChatRequest,
  ChatResponse,
  ToolCall,
} from "./chat/types";
import type { PortfolioData } from "../types/portfolio";
import styles from "./portfolio-theme.module.css";
import PortfolioErrorBoundary from "./ErrorBoundary";
import {
  requiresExternalData,
  useComponentDataTracking,
} from "../utils/component-flags";

export type ChatPortfolioProps = {
  profile?: ChatProfile;
  suggestions?: Suggestion[]; // full list
  presets?: Record<string, string>; // label -> assistant reply
  portfolioData?: PortfolioData | null;
  isLoading?: boolean;
  error?: string;
  username?: string; // Portfolio username for API calls
  apiBaseUrl?: string; // Base URL for API calls (defaults to NEXT_PUBLIC_API_BASE_URL or empty)
  authToken?: string; // Authentication token for authenticated API calls
  publicToken?: string; // Public token for token-based authentication
};

const ChatPortfolioComponent = ({
  profile,
  suggestions = [],
  presets = {},
  portfolioData,
  isLoading = false,
  error,
  username,
  apiBaseUrl = typeof window !== "undefined"
    ? (window as any).NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      ""
    : "",
  authToken,
  publicToken,
}: ChatPortfolioProps) => {
  // Track component data usage in development
  useComponentDataTracking("ChatPortfolio", portfolioData, {
    requiresExternalData: true,
    dataSource: "api",
    description:
      "Interactive chat-based portfolio requiring portfolio data for dynamic responses and widget content",
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [inlineMax, setInlineMax] = useState(5);
  const [conversationId, setConversationId] = useState<string | undefined>(
    undefined
  );
  const [apiError, setApiError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const hasStarted = messages.length > 0;

  const effectivePortfolioData = portfolioData;

  const effectiveProfile: ChatProfile | undefined = profile
    ? {
        ...profile,
        name: profile.name ?? effectivePortfolioData?.profile?.name,
        avatarUrl:
          profile.avatarUrl ??
          effectivePortfolioData?.profile?.profile_photo_url ??
          effectivePortfolioData?.profile?.avatarUrl,
      }
    : effectivePortfolioData?.profile
    ? {
        name: effectivePortfolioData.profile.name,
        avatarUrl:
          effectivePortfolioData.profile.profile_photo_url ||
          effectivePortfolioData.profile.avatarUrl,
      }
    : undefined;

  // Show loading state
  if (isLoading && !portfolioData) {
    return (
      <div
        className={`${styles.portfolioTheme} min-h-[100svh] w-full flex items-center justify-center bg-[var(--background)] text-[var(--foreground)]`}
      >
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[var(--muted-foreground)]">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !portfolioData) {
    return (
      <div
        className={`${styles.portfolioTheme} min-h-[100svh] w-full flex items-center justify-center bg-[var(--background)] text-[var(--foreground)]`}
      >
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">
            Failed to Load Portfolio
          </h2>
          <p className="text-[var(--muted-foreground)] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const aboutData = effectivePortfolioData?.profile
    ? {
        name: effectivePortfolioData.profile.name,
        title: effectivePortfolioData.profile.headline || "",
        summary:
          effectivePortfolioData.profile.summary ||
          effectivePortfolioData.profile.headline ||
          "",
        location: effectivePortfolioData.profile.location,
      }
    : null;

  const projectsData = effectivePortfolioData?.projects?.length
    ? {
        heading: "Projects",
        projects: effectivePortfolioData.projects.map((p) => ({
          name: p.name,
          role: p.role,
          one_line_description: p.one_line_description,
          highlights: p.highlights,
          technologies: p.technologies,
          github: p.github,
          live_link: p.live_link,
        })),
      }
    : null;

  const skillsData = effectivePortfolioData?.skills?.length
    ? {
        heading: "Skills",
        categories: [
          {
            title: "Skills",
            items: effectivePortfolioData.skills.map((skill) => ({
              name: skill,
              chip: true,
            })),
          },
        ],
      }
    : null;

  const contactItems: {
    id: string;
    kind: "email" | "github" | "website" | "linkedin";
    label: string;
    href: string;
    sub?: string;
  }[] = [];

  if (effectivePortfolioData?.profile?.email) {
    contactItems.push({
      id: "email",
      kind: "email",
      label: effectivePortfolioData.profile.email,
      href: `mailto:${effectivePortfolioData.profile.email}`,
      sub: "Email",
    });
  }

  effectivePortfolioData?.profile?.socials?.forEach((link, index) => {
    const id = `${link.type}-${index}`;

    if (link.type === "github") {
      contactItems.push({
        id,
        kind: "github",
        label: link.label || link.href,
        href: link.href,
        sub: "GitHub",
      });
      return;
    }

    if (link.type === "linkedin") {
      contactItems.push({
        id,
        kind: "linkedin",
        label: link.label || link.href,
        href: link.href,
        sub: "LinkedIn",
      });
      return;
    }

    contactItems.push({
      id,
      kind: "website",
      label: link.label || link.href,
      href: link.href,
      sub: link.type,
    });
  });

  const contactData = contactItems.length
    ? {
        heading: "Contact",
        items: contactItems,
      }
    : null;

  const experienceData = effectivePortfolioData?.experience?.length
    ? {
        heading: "Work Experience",
        items: effectivePortfolioData.experience.map((experience) => ({
          companyName: experience.companyName,
          role: experience.role,
          location: experience.location,
          start: experience.start,
          end: experience.end,
          points: experience.points,
        })),
      }
    : null;

  const educationData = effectivePortfolioData?.education?.length
    ? {
        heading: "Education",
        items: effectivePortfolioData.education.map((education) => ({
          school: education.school,
          degree: education.degree,
          start: education.start,
          end: education.end,
          location: education.location,
        })),
      }
    : null;

  // Auto-scroll on new messages
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  const chooseWidget = (text: string) => {
    const t = text.toLowerCase();
    if (
      /(^|\b)(work experience|experience|employment|resume|career)(\b|$)/.test(
        t
      )
    ) {
      return experienceData
        ? { name: "experience" as const, props: experienceData }
        : null;
    }
    if (/(^|\b)(me|about|yourself|who are you)(\b|$)/.test(t)) {
      return aboutData ? { name: "about" as const, props: aboutData } : null;
    }
    if (
      t.includes("project") ||
      t.includes("work") ||
      t.includes("portfolio") ||
      t.includes("latest")
    ) {
      return projectsData
        ? { name: "projects" as const, props: projectsData }
        : null;
    }
    if (t.includes("skill") || t.includes("stack") || t.includes("tech")) {
      return skillsData ? { name: "skills" as const, props: skillsData } : null;
    }
    if (
      t.includes("education") ||
      t.includes("school") ||
      t.includes("university") ||
      t.includes("college") ||
      t.includes("degree")
    ) {
      return educationData
        ? { name: "education" as const, props: educationData }
        : null;
    }
    if (t.includes("contact") || t.includes("email") || t.includes("reach")) {
      return contactData
        ? { name: "contact" as const, props: contactData }
        : null;
    }
    // Match suggestion labels exact
    const hit = suggestions.find((s) => s.label.toLowerCase() === t);
    if (hit) {
      if ((hit.id === "me" || hit.id === "about") && aboutData)
        return { name: "about" as const, props: aboutData };
      if ((hit.id === "projects" || hit.id === "latest") && projectsData)
        return { name: "projects" as const, props: projectsData };
      if ((hit.id === "skills" || hit.id === "stack") && skillsData)
        return { name: "skills" as const, props: skillsData };
      if (hit.id === "contact" && contactData)
        return { name: "contact" as const, props: contactData };
      if (hit.id === "education" && educationData)
        return { name: "education" as const, props: educationData };
      if (hit.id === "experience" && experienceData)
        return { name: "experience" as const, props: experienceData };
    }
    return null;
  };

  const sendUserMessage = async (text: string, isRetry: boolean = false) => {
    const value = text.trim();
    if (!value) return;

    // Only add user message if not a retry
    if (!isRetry) {
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: value,
      };
      setMessages((m) => [...m, userMsg]);
    }

    setIsThinking(true);
    setApiError(null);

    // If username AND apiBaseUrl are provided, use API; otherwise fall back to keyword matching
    // Note: For authenticated preview without username, we still need username for the endpoint
    if (username && apiBaseUrl) {
      try {
        await callChatAPI(value);
      } catch (error) {
        console.error("Chat API error:", error);
        setIsThinking(false);

        // Determine error type and show appropriate message with retry option
        const isNetworkError =
          error instanceof TypeError ||
          (error as any).message?.includes("fetch");
        const isRateLimit = apiError?.includes("rate limit");

        let errorContent =
          apiError || "I'm having trouble connecting right now.";

        // Add retry button for network errors (not for rate limits or access denied)
        if (isNetworkError && !isRateLimit) {
          errorContent += "\n\n[Click to retry]";
        }

        const errorMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: errorContent,
        };
        setMessages((m) => [...m, errorMsg]);
      }
    } else {
      // Fallback to keyword matching for backward compatibility
      const widget = chooseWidget(value);
      const assistantContent =
        presets[value] ||
        "Looks like I need to gather more details. I'll check with our AI assistant and get back to you.";

      setTimeout(() => {
        const reply: Message = widget
          ? { id: crypto.randomUUID(), role: "assistant", content: "", widget }
          : {
              id: crypto.randomUUID(),
              role: "assistant",
              content: assistantContent,
            };
        setMessages((m) => [...m, reply]);
        setIsThinking(false);
      }, 600);
    }
  };

  const handleRetry = (originalMessage: string) => {
    // Remove the last error message
    setMessages((m) => m.slice(0, -1));
    // Retry the original message
    sendUserMessage(originalMessage, true);
  };

  const callChatAPI = async (message: string) => {
    // Check if publicToken is provided when using API
    if (!publicToken) {
      setApiError("Chat is unavailable. Please refresh the page to continue.");
      throw new Error("Public token is required for chat");
    }

    try {
      const chatRequest: ChatRequest = {
        message,
        conversation_id: conversationId,
      };

      const url = `${apiBaseUrl}/public/chat/${encodeURIComponent(username!)}`;

      let response: Response;
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicToken}`,
        };

        response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(chatRequest),
        });
      } catch (fetchError) {
        // Network error (no internet, CORS, etc.)
        setApiError(
          "Unable to connect to the chat service. Please check your internet connection."
        );
        throw fetchError;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const retryMessage = retryAfter
            ? `Please try again in ${retryAfter} seconds.`
            : "Please try again in a few minutes.";
          setApiError(`You've reached the rate limit. ${retryMessage}`);
          throw new Error("Rate limit exceeded");
        } else if (response.status === 404) {
          setApiError(
            "Portfolio not found. Please check the username and try again."
          );
          throw new Error("Portfolio not found");
        } else if (response.status === 403) {
          setApiError(
            "This portfolio's chat is private and requires authentication."
          );
          throw new Error("Access denied");
        } else if (response.status === 400) {
          const message =
            errorData?.detail?.message ||
            errorData?.message ||
            "Invalid request";
          setApiError(`${message}. Please try rephrasing your message.`);
          throw new Error("Bad request");
        } else if (response.status >= 500) {
          setApiError(
            "The chat service is temporarily unavailable. Please try again in a moment."
          );
          throw new Error("Server error");
        } else {
          setApiError("Something went wrong. Please try again.");
          throw new Error(`API error: ${response.status}`);
        }
      }

      // Handle SSE streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let contentBuffer = "";
      let toolCallsBuffer: ToolCall[] = [];
      let currentMessageId = crypto.randomUUID();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);

              if (parsed.type === "content") {
                // Append content chunk
                contentBuffer += parsed.data;

                // Update or create message with accumulated content
                setMessages((m) => {
                  const existingIndex = m.findIndex(
                    (msg) => msg.id === currentMessageId
                  );
                  if (existingIndex >= 0) {
                    const updated = [...m];
                    updated[existingIndex] = {
                      ...updated[existingIndex],
                      content: contentBuffer,
                    };
                    return updated;
                  } else {
                    return [
                      ...m,
                      {
                        id: currentMessageId,
                        role: "assistant" as const,
                        content: contentBuffer,
                        toolCalls: undefined,
                      },
                    ];
                  }
                });
              } else if (parsed.type === "tool_call") {
                // Collect tool call
                const toolCall: ToolCall = {
                  type: parsed.data.type,
                  widget: parsed.data.widget,
                  indices: parsed.data.indices,
                  explanation: parsed.data.explanation,
                };
                toolCallsBuffer.push(toolCall);
              } else if (parsed.type === "done") {
                // Finalize message with tool calls
                if (toolCallsBuffer.length > 0) {
                  setMessages((m) => {
                    const existingIndex = m.findIndex(
                      (msg) => msg.id === currentMessageId
                    );
                    if (existingIndex >= 0) {
                      const updated = [...m];
                      updated[existingIndex] = {
                        ...updated[existingIndex],
                        toolCalls: toolCallsBuffer,
                      };
                      return updated;
                    }
                    return m;
                  });
                }

                // Update conversation ID
                if (parsed.data.conversation_id) {
                  setConversationId(parsed.data.conversation_id);
                }

                setIsThinking(false);
              } else if (parsed.type === "error") {
                const errorMessage =
                  typeof parsed.data === "string"
                    ? parsed.data
                    : "An error occurred while processing your message.";
                setApiError(errorMessage);
                setIsThinking(false);
                throw new Error(errorMessage);
              }
            } catch (e) {
              // Only log parsing errors, don't throw
              if (
                !(e instanceof Error && e.message.includes("error occurred"))
              ) {
                console.error("Error parsing SSE data:", e);
              } else {
                throw e;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat API call failed:", error);
      setIsThinking(false);
      throw error;
    }
  };

  const onSubmit = () => {
    const text = input;
    setInput("");
    sendUserMessage(text);
  };

  const onPickSuggestion = (s: Suggestion) => sendUserMessage(s.label);

  return (
    <PortfolioErrorBoundary>
      <div
        className={`${styles.portfolioTheme} min-h-[100svh] w-full relative overflow-hidden bg-[var(--background)] text-[var(--foreground)] flex flex-col px-3 sm:px-0`}
      >
        {/* Ambient gradient orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-32 h-80 w-80 rounded-full blur-3xl opacity-40 dark:opacity-20 bg-[oklch(0.84_0.07_250)]" />
          <div className="absolute -bottom-40 -right-32 h-80 w-80 rounded-full blur-3xl opacity-30 dark:opacity-20 bg-[oklch(0.74_0.15_310)]" />
          {/* subtle grid overlay */}
          <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(0,0,0,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.35)_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-[0.08]" />
        </div>

        {/* Full-width header (not boxed) */}
        <ChatHeader
          profile={effectiveProfile || { name: "Portfolio" }}
          showIdentity={hasStarted}
        />

        {/* Main content */}
        <div className="flex-1 min-h-0 flex flex-col text-[15px] sm:text-base">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 relative flex-1">
            {!hasStarted ? (
              <EmptyState
                title={
                  effectivePortfolioData?.profile?.headline ||
                  effectivePortfolioData?.profile?.summary ||
                  ""
                }
                subtitle={
                  "Ask about projects, skills, or anything you're curious about."
                }
                suggestions={suggestions}
                inputValue={input}
                onInputChange={setInput}
                onSubmit={onSubmit}
                onPick={onPickSuggestion}
              />
            ) : (
              <div
                ref={listRef}
                className="absolute inset-0 overflow-y-auto pb-40 thin-scrollbar"
              >
                <div className="mx-auto w-full max-w-3xl">
                  <Thread
                    messages={messages}
                    isThinking={isThinking}
                    portfolioData={effectivePortfolioData}
                  />
                </div>
                <div className="h-4" />
              </div>
            )}
          </div>

          {/* Composer - transitions to bottom after first message */}
          <AnimatePresence>
            {hasStarted && (
              <motion.div
                key="bottom-composer"
                layoutId="composer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="sticky bottom-0 w-full py-4 bg-gradient-to-t from-transparent via-transparent to-transparent backdrop-blur supports-[backdrop-filter]:backdrop-blur outline-none"
              >
                <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
                  {/* Inline suggestions just above input */}
                  <Suggestions
                    items={suggestions}
                    onPick={onPickSuggestion}
                    variant="inline"
                    maxVisible={inlineMax}
                    onShowMore={() => setInlineMax((v) => v + 5)}
                    showMoreLabel="⋯"
                    className="mb-3"
                  />

                  {/* Subtle loading animation */}
                  <AnimatePresence>
                    {isThinking && (
                      <motion.div
                        key="typing-bar"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mb-2 h-1 w-full overflow-hidden rounded-full bg-[var(--input)]"
                      >
                        <motion.div
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.2,
                            ease: "linear",
                          }}
                          className="h-full w-1/3 bg-[oklch(0.74_0.15_310)]/70"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Composer
                    value={input}
                    onChange={setInput}
                    onSubmit={onSubmit}
                    placeholder="Type your message…"
                  />
                  {/* Tech tags (subtle) */}
                  <div className="mt-3 flex items-center gap-3 text-xs sm:text-[13px] text-[color:var(--muted-foreground)]">
                    <span className="inline-flex items-center gap-1">
                      React • Next.js • TypeScript
                    </span>
                    <span className="inline-flex items-center gap-1">
                      Tailwind v4 • Shadcn/UI
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PortfolioErrorBoundary>
  );
};

// Apply the external data requirement flag
export const ChatPortfolio = requiresExternalData({
  dataSource: "api",
  description:
    "Interactive chat-based portfolio requiring portfolio data for dynamic responses and widget content",
})(ChatPortfolioComponent);

export default ChatPortfolio;
