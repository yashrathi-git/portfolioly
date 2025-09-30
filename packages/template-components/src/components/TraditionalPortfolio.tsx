import type { PortfolioData } from "../types/portfolio";
import { Hero } from "./portfolio-traditional/Hero";
import { Projects } from "./portfolio-traditional/Projects";
import { Experience } from "./portfolio-traditional/Experience";
import { Education } from "./portfolio-traditional/Education";
import { Skills } from "./portfolio-traditional/Skills";
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
        className={`${styles.portfolioTheme} min-h-[100svh] w-full relative overflow-hidden bg-[var(--background)] text-[var(--foreground)]`}
      >
        {/* Ambient gradient orbs - matching chat mode aesthetic */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-32 h-80 w-80 rounded-full blur-3xl opacity-40 dark:opacity-20 bg-[oklch(0.84_0.07_250)]" />
          <div className="absolute -bottom-40 -right-32 h-80 w-80 rounded-full blur-3xl opacity-30 dark:opacity-20 bg-[oklch(0.74_0.15_310)]" />
          {/* subtle grid overlay */}
          <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(0,0,0,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.35)_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-[0.08]" />
        </div>

        <Hero profile={effectiveData.profile} />

        <main className="relative mx-auto max-w-5xl px-6 pb-20">
          {effectiveData.skills && effectiveData.skills.length > 0 && (
            <section className="mt-10">
              <Skills items={effectiveData.skills} />
            </section>
          )}

          {effectiveData.projects && effectiveData.projects.length > 0 && (
            <section className="mt-12">
              <Projects items={effectiveData.projects} />
            </section>
          )}

          {effectiveData.experience && effectiveData.experience.length > 0 && (
            <section className="mt-12">
              <Experience items={effectiveData.experience} />
            </section>
          )}

          {effectiveData.education && effectiveData.education.length > 0 && (
            <section className="mt-12">
              <Education items={effectiveData.education} />
            </section>
          )}

          {effectiveData.achievements &&
            effectiveData.achievements.length > 0 && (
              <section className="mt-12">
                <h2 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">
                  Achievements
                </h2>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {effectiveData.achievements.map((a) => (
                    <li
                      key={a}
                      className="rounded-lg border border-[color:var(--border)]/70 bg-[var(--card)] px-4 py-3 text-sm shadow-sm text-[color:var(--card-foreground)]"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
            )}

          {effectiveData.certificates &&
            effectiveData.certificates.length > 0 && (
              <section className="mt-12">
                <h2 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">
                  Certificates
                </h2>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {effectiveData.certificates.map((c) => (
                    <li
                      key={c}
                      className="rounded-lg border border-[color:var(--border)]/70 bg-[var(--card)] px-4 py-3 text-sm shadow-sm text-[color:var(--card-foreground)]"
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
