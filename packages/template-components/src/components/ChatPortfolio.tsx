"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { AnimatePresence, motion } from "framer-motion";
import ChatHeader from "./chat/Header";
import { EmptyState } from "./chat/EmptyState";
import { Thread } from "./chat/Thread";
import { Composer } from "./chat/Composer";
import { Suggestions } from "./chat/Suggestions";
import type { Message, ChatProfile, Suggestion } from "./chat/types";
import type { DisplayPortfolioData } from "portfolioly-schema";
import styles from "./portfolio-theme.module.css";
import PortfolioErrorBoundary from "./ErrorBoundary";
import {
  requiresExternalData,
  useComponentDataTracking,
} from "../utils/component-flags";

export type ChatPortfolioProps = {
  profile?: ChatProfile;
  suggestions?: Suggestion[]; // full list
  portfolioData?: DisplayPortfolioData | null;
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
  useComponentDataTracking(
    "ChatPortfolio",
    portfolioData,
    {
      requiresExternalData: true,
      dataSource: "api",
      description:
        "Interactive chat-based portfolio requiring portfolio data for dynamic responses and widget content",
    },
    isLoading
  );

  const [inlineMax, setInlineMax] = useState(5);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [localInput, setLocalInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const effectivePortfolioData = portfolioData;

  const effectiveProfile: ChatProfile | undefined = profile
    ? {
        ...profile,
        name: profile.name ?? effectivePortfolioData?.profile?.name,
        avatarUrl:
          profile.avatarUrl ??
          effectivePortfolioData?.profile?.avatarUrl ??
          effectivePortfolioData?.profile?.avatarUrl,
      }
    : effectivePortfolioData?.profile
    ? {
        name: effectivePortfolioData.profile.name,
        avatarUrl:
          effectivePortfolioData.profile.avatarUrl ||
          effectivePortfolioData.profile.avatarUrl,
      }
    : undefined;

  // Use Vercel AI SDK's useChat hook
  const {
    messages: aiMessages,
    input,
    handleInputChange,
    handleSubmit: aiHandleSubmit,
    isLoading: aiIsLoading,
    error: aiError,
  } = useChat({
    api: `${apiBaseUrl}/public/chat/${username}`,
    headers: {
      Authorization: `Bearer ${publicToken}`,
    },
    body: {
      conversation_id: conversationId,
    },
    onFinish: (message, options) => {
      // Extract conversation_id from the response if available
      // The backend sends it in the done event: d:{"finishReason":"stop","conversationId":"..."}
      // The AI SDK should handle this, but we may need to extract it from response
      // For now, we'll keep the conversation_id state as is
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  // Convert AI SDK messages to our Message type
  const messages: Message[] = aiMessages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));

  const hasStarted = messages.length > 0;

  // Determine thinking state: show only until first assistant message chunk arrives
  const isThinking =
    aiIsLoading && messages[messages.length - 1]?.role !== "assistant";

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

  // Auto-scroll on new messages
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const value = (localInput || input).trim();
    if (!value) return;

    // Use AI SDK's handleSubmit
    if (username && apiBaseUrl && publicToken) {
      aiHandleSubmit(e);
      setLocalInput("");
    }
  };

  const onPickSuggestion = (suggestion: Suggestion) => {
    setLocalInput(suggestion.label);
    // Trigger submission after a short delay to allow input to update
    setTimeout(() => {
      const form = new Event("submit", { bubbles: true, cancelable: true });
      onSubmit(form as any);
    }, 10);
  };

  // Show API error if present
  const displayError = aiError?.message;

  return (
    <PortfolioErrorBoundary>
      <div
        className={`${styles.portfolioTheme} min-h-[100svh] w-full relative overflow-hidden bg-[var(--background)] text-[var(--foreground)] flex flex-col px-3 sm:px-0`}
      >
        {/* Ambient gradient orbs */}
        <div className="pointer-events-none absolute inset-0">
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
                title={effectivePortfolioData?.profile?.name || "Portfolio"}
                subtitle={effectivePortfolioData?.profile?.headline || ""}
                description="Ask about projects, skills, or anything you're curious about."
                suggestions={suggestions}
                inputValue={localInput || input}
                onInputChange={(val) => {
                  setLocalInput(val);
                  handleInputChange({ target: { value: val } } as any);
                }}
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

                  {/* Show error message if present */}
                  {displayError && (
                    <div className="mb-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200">
                      {displayError}
                    </div>
                  )}

                  <Composer
                    value={localInput || input}
                    onChange={(val) => {
                      setLocalInput(val);
                      handleInputChange({ target: { value: val } } as any);
                    }}
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
