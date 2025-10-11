"use client";

import { Sparkles } from "lucide-react";
import type { Message, ToolCall } from "./types";
import type { PortfolioData } from "../../types/portfolio";
import { AboutWidget } from "../widgets/AboutWidget";
import { ProjectsWidget } from "../widgets/ProjectsWidget";
import { SkillsWidget } from "../widgets/SkillsWidget";
import { ContactWidget } from "../widgets/ContactWidget";
import { WorkExperienceWidget } from "../widgets/WorkExperienceWidget";
import { EducationWidget } from "../widgets/EducationWidget";
import { typography } from "../../lib/typography";
import { cn } from "../../lib/utils";
import { MarkdownContent } from "../../utils/markdown";

type ThreadProps = {
  messages: Message[];
  isThinking?: boolean;
  portfolioData?: PortfolioData | null;
};

// Helper function to prepare widget data from portfolio data
const prepareWidgetData = (
  widgetType: string,
  portfolioData: PortfolioData | null | undefined,
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
            profile_photo_url: portfolioData.profile.profile_photo_url,
            avatarUrl: portfolioData.profile.avatarUrl, // Keep for backward compatibility
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
          role: p.role,
          one_line_description: p.one_line_description,
          highlights: p.highlights,
          technologies: p.technologies,
          github: p.github,
          live_link: p.live_link,
        })),
      };

    case "skills":
      return portfolioData.skills?.length
        ? {
            heading: "Skills",
            categories: [
              {
                title: "Skills",
                items: portfolioData.skills.map((skill: string) => ({
                  name: skill,
                  chip: true,
                })),
              },
            ],
          }
        : null;

    case "contact": {
      const contactItems: any[] = [];
      if (portfolioData.profile?.email) {
        contactItems.push({
          id: "email",
          kind: "email",
          label: portfolioData.profile.email,
          href: `mailto:${portfolioData.profile.email}`,
          sub: "Email",
        });
      }
      portfolioData.profile?.socials?.forEach((link: any, index: number) => {
        const id = `${link.type}-${index}`;
        if (link.type === "github") {
          contactItems.push({
            id,
            kind: "github",
            label: link.label || link.href,
            href: link.href,
            sub: "GitHub",
          });
        } else if (link.type === "linkedin") {
          contactItems.push({
            id,
            kind: "linkedin",
            label: link.label || link.href,
            href: link.href,
            sub: "LinkedIn",
          });
        } else {
          contactItems.push({
            id,
            kind: "website",
            label: link.label || link.href,
            href: link.href,
            sub: link.type,
          });
        }
      });
      return contactItems.length
        ? { heading: "Contact", items: contactItems }
        : null;
    }

    case "experience":
      if (!portfolioData.experience?.length) return null;
      const experiences = indices
        ? indices.map((i) => portfolioData.experience?.[i]).filter(Boolean)
        : portfolioData.experience;
      return {
        heading: "Work Experience",
        items: experiences.map((exp: any) => ({
          companyName: exp.companyName,
          role: exp.role,
          location: exp.location,
          start: exp.start,
          end: exp.end,
          points: exp.points,
        })),
      };

    case "education":
      if (!portfolioData.education?.length) return null;
      const educations = indices
        ? indices.map((i) => portfolioData.education?.[i]).filter(Boolean)
        : portfolioData.education;
      return {
        heading: "Education",
        items: educations.map((edu: any) => ({
          school: edu.school,
          degree: edu.degree,
          start: edu.start,
          end: edu.end,
          location: edu.location,
        })),
      };

    default:
      return null;
  }
};

// Helper function to render a widget based on tool call
const renderWidget = (
  toolCall: ToolCall,
  portfolioData: PortfolioData | null | undefined
) => {
  const widgetData = prepareWidgetData(
    toolCall.widget,
    portfolioData,
    toolCall.indices
  );
  if (!widgetData) return null;

  switch (toolCall.widget) {
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
      {messages.map((m) => (
        <div key={m.id} className="flex gap-3">
          {m.role === "assistant" ? (
            <div className="mt-1 size-9 shrink-0 rounded-full bg-[var(--secondary)] flex items-center justify-center">
              <Sparkles className="size-4.5 text-[color:var(--secondary-foreground)]" />
            </div>
          ) : (
            <div className="mt-1 size-9 shrink-0 rounded-full bg-[oklch(0.84_0.07_250)] text-white flex items-center justify-center">
              U
            </div>
          )}

          {m.role === "assistant" && (m.widget || m.toolCalls) ? (
            <div
              className={cn(
                "flex-1 max-w-full md:max-w-[85%] leading-relaxed [&_*]:text-inherit [&_*]:leading-[inherit] space-y-4",
                typography.content.responsive
              )}
            >
              {/* Render text content if present */}
              {m.content && (
                <div className="rounded-2xl rounded-tl-none px-5 py-3.5 md:py-4 bg-[var(--secondary)] text-[color:var(--secondary-foreground)] shadow-sm">
                  <MarkdownContent
                    content={m.content}
                    overrides={{
                      p: {
                        component: ({ className, ...props }) => (
                          <p
                            {...props}
                            className={cn("m-0 whitespace-pre-wrap", className)}
                          />
                        ),
                      },
                    }}
                  />
                </div>
              )}

              {/* Render legacy widget format for backward compatibility */}
              {m.widget && (
                <>
                  {m.widget.name === "about" && (
                    <AboutWidget {...(m.widget.props as any)} />
                  )}
                  {m.widget.name === "projects" && (
                    <ProjectsWidget {...(m.widget.props as any)} />
                  )}
                  {m.widget.name === "skills" && (
                    <SkillsWidget {...(m.widget.props as any)} />
                  )}
                  {m.widget.name === "contact" && (
                    <ContactWidget {...(m.widget.props as any)} />
                  )}
                  {m.widget.name === "experience" && (
                    <WorkExperienceWidget {...(m.widget.props as any)} />
                  )}
                  {m.widget.name === "education" && (
                    <EducationWidget {...(m.widget.props as any)} />
                  )}
                </>
              )}

              {/* Render tool calls from API */}
              {m.toolCalls?.map((toolCall, idx) => (
                <div key={idx} className="space-y-2">
                  {toolCall.explanation && (
                    <div className="rounded-2xl rounded-tl-none px-5 py-3.5 md:py-4 bg-[var(--secondary)] text-[color:var(--secondary-foreground)] shadow-sm">
                      <p className="whitespace-pre-wrap">
                        {toolCall.explanation}
                      </p>
                    </div>
                  )}
                  {renderWidget(toolCall, portfolioData)}
                </div>
              ))}
            </div>
          ) : (
            <div
              className={cn(
                "max-w-full md:max-w-[85%] rounded-2xl px-5 py-3.5 md:py-4 leading-relaxed shadow-sm",
                typography.content.responsive,
                m.role === "assistant"
                  ? "bg-[var(--secondary)] text-[color:var(--secondary-foreground)] rounded-tl-none"
                  : "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-tr-none"
              )}
            >
              <MarkdownContent
                content={m.content}
                overrides={{
                  p: {
                    component: ({ className, ...props }) => (
                      <p
                        {...props}
                        className={cn("m-0 whitespace-pre-wrap", className)}
                      />
                    ),
                  },
                }}
              />
            </div>
          )}
        </div>
      ))}

      {isThinking && (
        <div className="flex gap-3">
          <div className="mt-1 size-9 shrink-0 rounded-full bg-[var(--secondary)] flex items-center justify-center">
            <Sparkles className="size-4.5 text-[color:var(--secondary-foreground)]" />
          </div>
          <div
            className={cn(
              "rounded-2xl rounded-tl-none px-5 py-3.5 md:py-4 bg-[var(--secondary)] text-[color:var(--secondary-foreground)] shadow-sm",
              typography.content.responsive
            )}
          >
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
