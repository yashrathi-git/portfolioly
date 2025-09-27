"use client";

import { Sparkles } from "lucide-react";
import type { Message } from "./types";
import { AboutWidget } from "../widgets/AboutWidget";
import { ProjectsWidget } from "../widgets/ProjectsWidget";
import { SkillsWidget } from "../widgets/SkillsWidget";
import { ContactWidget } from "../widgets/ContactWidget";
import { WorkExperienceWidget } from "../widgets/WorkExperienceWidget";
import { EducationWidget } from "../widgets/EducationWidget";

type ThreadProps = {
  messages: Message[];
  isThinking?: boolean;
};

export const Thread = ({ messages, isThinking }: ThreadProps) => {
  return (
    <div className="space-y-5 pt-2">
      {messages.map((m) => (
        <div key={m.id} className="flex gap-3">
          {m.role === "assistant" ? (
            <div className="mt-1 size-9 shrink-0 rounded-full bg-[var(--secondary)] flex items-center justify-center">
              <Sparkles className="size-4.5 text-[color:var(--secondary-foreground)]" />
            </div>
          ) : (
            <div className="mt-1 size-9 shrink-0 rounded-full bg-[oklch(0.84_0.07_250)] text-white flex items-center justify-center">U</div>
          )}

          {m.role === "assistant" && m.widget ? (
            <div className="flex-1 max-w-full md:max-w-[85%] text-[17px] md:text-[19px] leading-relaxed [&_*]:text-inherit [&_*]:leading-[inherit]">
              {m.widget.name === "about" && <AboutWidget {...(m.widget.props as any)} />}
              {m.widget.name === "projects" && <ProjectsWidget {...(m.widget.props as any)} />}
              {m.widget.name === "skills" && <SkillsWidget {...(m.widget.props as any)} />}
              {m.widget.name === "contact" && <ContactWidget {...(m.widget.props as any)} />}
              {m.widget.name === "experience" && <WorkExperienceWidget {...(m.widget.props as any)} />}
              {m.widget.name === "education" && <EducationWidget {...(m.widget.props as any)} />}
            </div>
          ) : (
            <div
              className={`max-w-full md:max-w-[85%] rounded-2xl px-5 py-3.5 md:py-4 text-[17px] md:text-[19px] leading-relaxed shadow-sm ${
                m.role === "assistant"
                  ? "bg-[var(--secondary)] text-[color:var(--secondary-foreground)] rounded-tl-none"
                  : "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-tr-none"
              }`}
            >
              {m.content.split("\n").map((line, i) => (
                <p key={i} className="whitespace-pre-wrap">
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      ))}

      {isThinking && (
        <div className="flex gap-3">
          <div className="mt-1 size-9 shrink-0 rounded-full bg-[var(--secondary)] flex items-center justify-center">
            <Sparkles className="size-4.5 text-[color:var(--secondary-foreground)]" />
          </div>
          <div className="rounded-2xl rounded-tl-none px-5 py-3.5 md:py-4 text-[17px] md:text-[19px] bg-[var(--secondary)] text-[color:var(--secondary-foreground)] shadow-sm">
            <div className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-[color:var(--muted-foreground)] animate-bounce [animation-delay:-0.2s]"></span>
              <span className="size-1.5 rounded-full bg-[color:var(--muted-foreground)] animate-bounce"></span>
              <span className="size-1.5 rounded-full bg-[color:var(--muted-foreground)] animate-bounce [animation-delay:0.2s]"></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Thread;