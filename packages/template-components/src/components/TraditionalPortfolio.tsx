import type { DisplayPortfolioData } from "portfolioly-schema";
import { Hero } from "./portfolio-traditional/Hero";
import { Projects } from "./portfolio-traditional/Projects";
import { Education } from "./portfolio-traditional/Education";
import { Skills } from "./portfolio-traditional/Skills";
import { WorkExperience } from "./portfolio-traditional/WorkExperience";
import styles from "./portfolio-theme.module.css";
import PortfolioErrorBoundary from "./ErrorBoundary";
import BlurFade from "./magicui/blur-fade";
import { MarkdownContent } from "../utils/markdown";
import {
  SiUdemy,
  SiCoursera,
  SiEdx,
  SiUdacity,
  SiPluralsight,
  SiCodecademy,
  SiFreecodecamp,
  SiGoogle,
  SiMeta,
} from "@icons-pack/react-simple-icons";
import { Award } from "lucide-react";
import {
  requiresExternalData,
  useComponentDataTracking,
} from "../utils/component-flags";
import { BLUR_FADE_DELAY } from "../lib/constants/animations";

export type TraditionalPortfolioProps = {
  data?: DisplayPortfolioData | null;
  isLoading?: boolean;
  error?: string;
};

const getCertificateProvider = (issuer?: string) => {
  const lowerName = (issuer || "").toLowerCase();
  if (lowerName.includes("udemy")) return { icon: SiUdemy, color: "#A435F0" };
  if (lowerName.includes("coursera"))
    return { icon: SiCoursera, color: "#0056D2" };
  if (lowerName.includes("edx")) return { icon: SiEdx, color: "#D23228" };
  if (lowerName.includes("udacity"))
    return { icon: SiUdacity, color: "#00B3E5" };
  if (lowerName.includes("pluralsight"))
    return { icon: SiPluralsight, color: "#F15B2A" };
  if (lowerName.includes("codecademy"))
    return { icon: SiCodecademy, color: "#1F4056" };
  if (lowerName.includes("freecodecamp"))
    return { icon: SiFreecodecamp, color: "#0A0A23" };
  if (lowerName.includes("google")) return { icon: SiGoogle, color: "#4285F4" };
  if (lowerName.includes("meta") || lowerName.includes("facebook"))
    return { icon: SiMeta, color: "#0668E1" };

  return { icon: Award, color: "currentColor" };
};

const TraditionalPortfolioComponent = ({
  data,
  isLoading = false,
  error,
}: TraditionalPortfolioProps) => {
  // Track component data usage in development
  useComponentDataTracking("TraditionalPortfolio", data, {
    requiresExternalData: true,
    dataSource: "api",
    description:
      "Traditional portfolio layout requiring complete portfolio data including profile, projects, experience, education, and skills",
  });

  const effectiveData = data;

  // Show loading state
  if (isLoading && !data) {
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
  if (error && !data) {
    return (
      <div
        className={`${styles.portfolioTheme} min-h-[100svh] w-full flex items-center justify-center bg-[var(--background)] text-[var(--foreground)]`}
      >
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4 text-2xl">⚠️</div>
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
  console.log(effectiveData?.achievements);

  if (!effectiveData || !effectiveData.profile) {
    return (
      <div
        className={`${styles.portfolioTheme} min-h-[100svh] w-full flex items-center justify-center bg-[var(--background)] text-[var(--foreground)]`}
      >
        <div className="text-center max-w-md">
          <div className="text-2xl mb-4">🤖</div>
          <h2 className="text-xl font-semibold mb-2">Portfolio coming soon</h2>
          <p className="text-[var(--muted-foreground)]">
            We couldn’t find enough information to show the traditional layout.
            I’ll ask our AI assistant to help fill in the details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PortfolioErrorBoundary>
      <div
        className={`${styles.portfolioTheme} min-h-[100svh] w-full bg-[var(--background)] text-[var(--foreground)]`}
      >
        <Hero profile={effectiveData.profile} />
        {effectiveData.experience && effectiveData.experience.length > 0 && (
          <WorkExperience items={effectiveData.experience} />
        )}
        {effectiveData.education && effectiveData.education.length > 0 && (
          <Education items={effectiveData.education} />
        )}
        {effectiveData.skills && effectiveData.skills.length > 0 && (
          <div className="px-6 pb-12">
            <div className="mx-auto w-full max-w-2xl">
              <Skills items={effectiveData.skills} />
            </div>
          </div>
        )}

        {effectiveData.projects && effectiveData.projects.length > 0 && (
          <Projects items={effectiveData.projects} />
        )}

        {effectiveData.achievements && (
          <section id="achievements" className="px-6 pb-12">
            <div className="mx-auto w-full max-w-2xl">
              <div className="flex min-h-0 flex-col gap-y-3">
                <BlurFade delay={BLUR_FADE_DELAY * 11}>
                  <h2 className="text-2xl font-bold">Achievements</h2>
                </BlurFade>
                <BlurFade delay={BLUR_FADE_DELAY * 12}>
                  <MarkdownContent
                    content={effectiveData.achievements}
                    className="text-foreground"
                  />
                </BlurFade>
              </div>
            </div>
          </section>
        )}

        {effectiveData.certificates &&
          effectiveData.certificates.length > 0 && (
            <section id="certificates" className="px-6 pb-12">
              <div className="mx-auto w-full max-w-2xl">
                <div className="flex min-h-0 flex-col gap-y-3">
                  <BlurFade delay={BLUR_FADE_DELAY * 13}>
                    <h2 className="text-2xl font-bold">Certificates</h2>
                  </BlurFade>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {effectiveData.certificates.map((cert, idx) => {
                      const provider = getCertificateProvider(cert.issuer);
                      const Icon = provider.icon;
                      const CardContent = (
                        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground transition-colors hover:bg-accent/50 h-full">
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background"
                            style={{ color: provider.color }}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium line-clamp-1">
                              {cert.name}
                            </span>
                            {cert.issuer && (
                              <span className="text-xs text-muted-foreground">
                                {cert.issuer}
                              </span>
                            )}
                          </div>
                        </div>
                      );

                      return (
                        <BlurFade
                          key={`${cert.name}-${idx}`}
                          delay={BLUR_FADE_DELAY * 13 + idx * 0.05}
                        >
                          {cert.link ? (
                            <a
                              href={cert.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block h-full"
                            >
                              {CardContent}
                            </a>
                          ) : (
                            CardContent
                          )}
                        </BlurFade>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}
      </div>
    </PortfolioErrorBoundary>
  );
};

// Apply the external data requirement flag
export const TraditionalPortfolio = requiresExternalData({
  dataSource: "api",
  description:
    "Traditional portfolio layout requiring complete portfolio data including profile, projects, experience, education, and skills",
})(TraditionalPortfolioComponent);
