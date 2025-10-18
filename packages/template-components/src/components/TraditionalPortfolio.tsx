import type { DisplayPortfolioData } from "@portfolioly/schema";
import { Hero } from "./portfolio-traditional/Hero";
import { Projects } from "./portfolio-traditional/Projects";
import { Education } from "./portfolio-traditional/Education";
import { Skills } from "./portfolio-traditional/Skills";
import { WorkExperience } from "./portfolio-traditional/WorkExperience";
import styles from "./portfolio-theme.module.css";
import PortfolioErrorBoundary from "./ErrorBoundary";
import Markdown from "markdown-to-jsx";
import BlurFade from "./magicui/blur-fade";
import {
  requiresExternalData,
  useComponentDataTracking,
} from "../utils/component-flags";

export type TraditionalPortfolioProps = {
  data?: DisplayPortfolioData | null;
  isLoading?: boolean;
  error?: string;
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
          <div className="px-6 pb-16">
            <div className="mx-auto w-full max-w-2xl">
              <Skills items={effectiveData.skills} />
            </div>
          </div>
        )}

        {effectiveData.projects && effectiveData.projects.length > 0 && (
          <Projects items={effectiveData.projects} />
        )}

        {effectiveData.achievements &&
          effectiveData.achievements.length > 0 && (
            <section id="achievements" className="px-6 pb-16">
              <div className="mx-auto w-full max-w-2xl space-y-4">
                <BlurFade delay={0.04 * 11}>
                  <h2 className="text-xl font-bold">Achievements</h2>
                </BlurFade>
                <BlurFade delay={0.04 * 12}>
                  <Markdown className="prose prose-sm max-w-full text-pretty font-sans text-muted-foreground dark:prose-invert prose-ul:list-disc prose-ul:pl-5 prose-li:text-muted-foreground">
                    {effectiveData.achievements.join("\n")}
                  </Markdown>
                </BlurFade>
              </div>
            </section>
          )}

        {effectiveData.certificates &&
          effectiveData.certificates.length > 0 && (
            <section id="certificates" className="px-6 pb-16">
              <div className="mx-auto w-full max-w-2xl space-y-4">
                <BlurFade delay={0.04 * 13}>
                  <h2 className="text-xl font-bold">Certificates</h2>
                </BlurFade>
                <BlurFade delay={0.04 * 14}>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {effectiveData.certificates.map((c, idx) => (
                      <li
                        key={`${c}-${idx}`}
                        className="rounded-lg border border-border bg-card px-4 py-3 text-sm"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                </BlurFade>
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
