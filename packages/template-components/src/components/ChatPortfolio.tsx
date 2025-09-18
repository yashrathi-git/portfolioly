"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ChatHeader from "./chat/Header";
import { EmptyState } from "./chat/EmptyState";
import { Thread } from "./chat/Thread";
import { Composer } from "./chat/Composer";
import { Suggestions } from "./Suggestions";
import type { Message, Profile, Suggestion } from "./types";

export type ChatPortfolioProps = {
  profile: Profile;
  suggestions: Suggestion[]; // full list
  presets: Record<string, string>; // label -> assistant reply
};

export const ChatPortfolio = ({
  profile,
  suggestions,
  presets,
}: ChatPortfolioProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [inlineMax, setInlineMax] = useState(5);
  const listRef = useRef<HTMLDivElement>(null);

  const hasStarted = messages.length > 0;

  // Auto-scroll on new messages
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  const sendUserMessage = (text: string) => {
    const value = text.trim();
    if (!value) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: value,
    };
    setMessages((m) => [...m, userMsg]);

    // Simulate assistant thinking then reply with placeholder
    setIsThinking(true);
    const assistantContent =
      presets[value] ||
      "Thanks for your message! This portfolio uses placeholder responses. Try the suggestions or ask about projects, skills, or contact.";

    setTimeout(() => {
      const reply: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: assistantContent,
      };
      setMessages((m) => [...m, reply]);
      setIsThinking(false);
    }, 600);
  };

  const onSubmit = () => {
    const text = input;
    setInput("");
    sendUserMessage(text);
  };

  const onPickSuggestion = (s: Suggestion) => sendUserMessage(s.label);

  return (
    <div className="min-h-[100svh] w-full relative overflow-hidden bg-[var(--background)] text-[var(--foreground)] flex flex-col px-3 sm:px-0">
      {/* Ambient gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 h-80 w-80 rounded-full blur-3xl opacity-40 dark:opacity-20 bg-[oklch(0.84_0.07_250)]" />
        <div className="absolute -bottom-40 -right-32 h-80 w-80 rounded-full blur-3xl opacity-30 dark:opacity-20 bg-[oklch(0.74_0.15_310)]" />
        {/* subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(0,0,0,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.35)_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-[0.08]" />
      </div>

      {/* Full-width header (not boxed) */}
      <ChatHeader profile={profile} showIdentity={hasStarted} />

      {/* Main content */}
      <div className="flex-1 min-h-0 flex flex-col text-[15px] sm:text-base">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 relative flex-1">
          {!hasStarted ? (
            <EmptyState
              title={`Hi, I'm ${profile.name} — let's chat.`}
              subtitle="Ask about projects, skills, or anything you're curious about. Try a quick prompt below."
              suggestions={suggestions}
              inputValue={input}
              onInputChange={setInput}
              onSubmit={onSubmit}
              onPick={onPickSuggestion}
            />
          ) : (
            <div
              ref={listRef}
              className="absolute inset-0 overflow-y-auto pb-40"
            >
              <div className="mx-auto w-full max-w-3xl">
                <Thread messages={messages} isThinking={isThinking} />
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
  );
};

export default ChatPortfolio;
