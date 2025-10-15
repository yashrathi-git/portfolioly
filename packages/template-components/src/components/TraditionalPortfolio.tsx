import type { PortfolioData } from "../types/portfolio";
import { Hero } from "./portfolio-traditional/Hero";
import { Projects } from "./portfolio-traditional/Projects";
import { Education } from "./portfolio-traditional/Education";
import { Skills } from "./portfolio-traditional/Skills";
import { WorkExperience } from "./portfolio-traditional/WorkExperience";
import styles from "./portfolio-theme.module.css";
import PortfolioErrorBoundary from "./ErrorBoundary";
import {
  requiresExternalData,
  useComponentDataTracking,
} from "../utils/component-flags";

export type TraditionalPortfolioProps = {
  data?: PortfolioData | null;
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

        <main className="mx-auto w-full max-w-2xl px-6 pt-10 pb-16 space-y-10">
          {effectiveData.projects && effectiveData.projects.length > 0 && (
            <section>
              <Projects items={effectiveData.projects} />
            </section>
          )}

          {effectiveData.achievements &&
            effectiveData.achievements.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Achievements
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {effectiveData.achievements.map((a) => (
                    <li
                      key={a}
                      className="rounded-lg border border-border bg-card px-4 py-3 text-sm"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
            )}

          {effectiveData.certificates &&
            effectiveData.certificates.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Certificates
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {effectiveData.certificates.map((c) => (
                    <li
                      key={c}
                      className="rounded-lg border border-border bg-card px-4 py-3 text-sm"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </section>
            )}
        </main>
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
