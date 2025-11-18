"use client";

import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { Message } from "./types";
import type { DisplayPortfolioData } from "portfolioly-schema";
import { AboutWidget } from "../widgets/AboutWidget";
import { ProjectsWidget } from "../widgets/ProjectsWidget";
import { SkillsWidget } from "../widgets/SkillsWidget";
import { ContactWidget } from "../widgets/ContactWidget";
import { WorkExperienceWidget } from "../widgets/WorkExperienceWidget";
import { EducationWidget } from "../widgets/EducationWidget";
import { typography } from "../../lib/typography";
import { cn } from "../../lib/utils";
import { MarkdownContent } from "../../utils/markdown";
import { parseMessageContent } from "../../utils/parseMessageContent";

type ThreadProps = {
  messages: Message[];
  isThinking?: boolean;
  portfolioData?: DisplayPortfolioData | null;
};

// Helper function to prepare widget data from portfolio data
const prepareWidgetData = (
  widgetType: string,
  portfolioData: DisplayPortfolioData | null | undefined,
  indices?: number[]
) => {
  if (!portfolioData) return null;

  switch (widgetType) {
    case "about":
      return portfolioData.profile
        ? {
            name: portfolioData.profile.name,
            title: portfolioData.profile.headline || "",
            summary:
              portfolioData.profile.summary ||
              portfolioData.profile.headline ||
              "",
            location: portfolioData.profile.location,
            profile_photo_url: portfolioData.profile.avatarUrl,
            avatarUrl: portfolioData.profile.avatarUrl, // Keep for backward compatibility
            skills: portfolioData.profile.tags,
          }
        : null;

    case "projects":
      if (!portfolioData.projects?.length) return null;
      const projects = indices
        ? indices.map((i) => portfolioData.projects?.[i]).filter(Boolean)
        : portfolioData.projects;
      return {
        heading: "Projects",
        projects: projects.map((p: any) => ({
          name: p.name,
          cardImageUrl: p.cardImageUrl,
          role: p.role,
          one_line_description: p.one_line_description,
          highlights: p.highlights,
          technologies: p.technologies,
          github: p.github,
          live_link: p.live_link,
          demo_video: p.demo_video,
          more_context: p.more_context,
          images: p.images,
        })),
      };

    case "skills":
      return portfolioData.skills?.length
        ? {
            heading: "Skills",
            skills: portfolioData.skills,
          }
        : null;

    case "contact": {
      const email = portfolioData.profile?.email;
      const socials = portfolioData.profile?.socials || [];

      // Find LinkedIn and GitHub from socials
      const linkedin = socials.find((s: any) => s.type === "linkedin")?.href;
      const github = socials.find((s: any) => s.type === "github")?.href;

      // Only return if at least one contact method exists
      if (!email && !linkedin && !github) return null;

      return {
        heading: "Get in Touch",
        email,
        linkedin,
        github,
      };
    }

    case "experience":
      return portfolioData.experience?.length
        ? {
            heading: "Work Experience",
            items: portfolioData.experience.map((exp: any) => ({
              companyName: exp.companyName,
              role: exp.role,
              location: exp.location,
              start: exp.start,
              end: exp.end,
              points: exp.points,
              technologies: exp.technologies,
              logoUrl: exp.logoUrl,
            })),
          }
        : null;

    case "education":
      return portfolioData.education?.length
        ? {
            heading: "Education",
            items: portfolioData.education.map((edu: any) => ({
              school: edu.school,
              degree: edu.degree,
              start: edu.start,
              end: edu.end,
              location: edu.location,
              grade: edu.grade,
              logoUrl: edu.logoUrl,
            })),
          }
        : null;

    default:
      return null;
  }
};

// Helper function to render a widget
const renderWidget = (
  widgetType: string,
  indices: number[] | undefined,
  portfolioData: DisplayPortfolioData | null | undefined
) => {
  const widgetData = prepareWidgetData(widgetType, portfolioData, indices);
  if (!widgetData) return null;

  switch (widgetType) {
    case "about":
      return <AboutWidget {...(widgetData as any)} />;
    case "projects":
      return <ProjectsWidget {...(widgetData as any)} />;
    case "skills":
      return <SkillsWidget {...(widgetData as any)} />;
    case "contact":
      return <ContactWidget {...(widgetData as any)} />;
    case "experience":
      return <WorkExperienceWidget {...(widgetData as any)} />;
    case "education":
      return <EducationWidget {...(widgetData as any)} />;
    default:
      return null;
  }
};

export const Thread = ({
  messages,
  isThinking,
  portfolioData,
}: ThreadProps) => {
  return (
    <div className="space-y-5 pt-2">
      {messages.map((m, messageIndex) => {
        // Parse message content to extract text and widget parts
        const parts =
          m.role === "assistant"
            ? parseMessageContent(m.content)
            : [{ type: "text" as const, content: m.content }];

        // Only animate the message container on first appearance
        // Use messageIndex to determine if this is a new message
        const isNewMessage = messageIndex === messages.length - 1;

        return (
          <motion.div
            key={m.id}
            initial={isNewMessage ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex gap-2 sm:gap-3"
          >
            {m.role === "assistant" ? (
              <div className="mt-1 size-7 sm:size-9 shrink-0 rounded-full bg-[var(--secondary)] hidden sm:flex items-center justify-center">
                <Sparkles className="size-3.5 sm:size-4.5 text-[color:var(--secondary-foreground)]" />
              </div>
            ) : (
              <div className="mt-1 size-7 sm:size-9 shrink-0 rounded-full bg-[oklch(0.84_0.07_250)] text-white hidden sm:flex items-center justify-center text-sm sm:text-base">
                U
              </div>
            )}

            <div
              className={cn(
                "flex-1 max-w-full leading-relaxed [&_*]:text-inherit [&_*]:leading-[inherit] space-y-4",
                typography.content.responsive
              )}
            >
              {parts.map((part, idx) => {
                if (part.type === "text") {
                  // Only render text bubble if there's actual content
                  if (!part.content.trim()) return null;

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "rounded-2xl px-5 py-3.5 md:py-4 shadow-sm border",
                        m.role === "assistant"
                          ? "bg-card/80 backdrop-blur-sm border-border rounded-tl-none"
                          : "bg-primary/10 backdrop-blur-sm border-primary/30 rounded-tr-none"
                      )}
                    >
                      <MarkdownContent
                        content={part.content}
                        overrides={{
                          p: {
                            component: ({ className, ...props }) => (
                              <p
                                {...props}
                                className={cn(
                                  "m-0 whitespace-pre-wrap",
                                  className
                                )}
                              />
                            ),
                          },
                          ul: {
                            component: ({ className, ...props }) => (
                              <ul
                                {...props}
                                className={cn(
                                  "ml-5 list-disc space-y-1 my-2",
                                  className
                                )}
                              />
                            ),
                          },
                          ol: {
                            component: ({ className, ...props }) => (
                              <ol
                                {...props}
                                className={cn(
                                  "ml-5 list-decimal space-y-1 my-2",
                                  className
                                )}
                              />
                            ),
                          },
                          li: {
                            component: ({ className, ...props }) => (
                              <li {...props} className={cn("", className)} />
                            ),
                          },
                        }}
                      />
                    </div>
                  );
                } else if (part.type === "widget") {
                  // Render widget with fade-in animation only for new messages
                  return (
                    <motion.div
                      key={idx}
                      initial={isNewMessage ? { opacity: 0, y: 8 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        ease: [0.16, 1, 0.3, 1],
                        delay: isNewMessage ? 0.2 : 0,
                      }}
                    >
                      {renderWidget(part.widget, part.indices, portfolioData)}
                    </motion.div>
                  );
                }
                return null;
              })}
            </div>
          </motion.div>
        );
      })}

      {isThinking && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{
            duration: 0.3,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="flex gap-2 sm:gap-3"
        >
          <div className="mt-1 size-7 sm:size-9 shrink-0 rounded-full bg-[var(--secondary)] hidden sm:flex items-center justify-center">
            <Sparkles className="size-3.5 sm:size-4.5 text-[color:var(--secondary-foreground)]" />
          </div>
          <div
            className={cn(
              "rounded-2xl rounded-tl-none px-5 py-3.5 md:py-4 border shadow-sm bg-card/80 backdrop-blur-sm border-border",
              typography.content.responsive
            )}
          >
            <div className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-[color:var(--muted-foreground)] animate-bounce [animation-delay:-0.2s]"></span>
              <span className="size-1.5 rounded-full bg-[color:var(--muted-foreground)] animate-bounce"></span>
              <span className="size-1.5 rounded-full bg-[color:var(--muted-foreground)] animate-bounce [animation-delay:0.2s]"></span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Thread;
