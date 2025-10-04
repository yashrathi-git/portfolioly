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

  // Enhanced loading state with better mobile design
  if (isLoading && !data) {
    return (
      <div
        className={`${styles.portfolioTheme} min-h-[100svh] w-full flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] px-4`}
      >
        <div className="text-center max-w-sm mx-auto">
          <div className="relative mb-6">
            <div className="animate-spin h-12 w-12 border-3 border-blue-500/30 border-t-blue-500 rounded-full mx-auto"></div>
            <div className="animate-pulse absolute inset-0 h-12 w-12 border-2 border-blue-300/20 rounded-full mx-auto"></div>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold mb-2">Loading Portfolio</h2>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
            Please wait while we prepare your portfolio...
          </p>
        </div>
      </div>
    );
  }

  // Enhanced error state with better mobile design
  if (error && !data) {
    return (
      <div
        className={`${styles.portfolioTheme} min-h-[100svh] w-full flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] px-4`}
      >
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6 text-4xl sm:text-5xl">⚠️</div>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-red-600 dark:text-red-400">
            Failed to Load Portfolio
          </h2>
          <p className="text-sm sm:text-base text-[var(--muted-foreground)] mb-6 leading-relaxed">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium text-sm min-h-[44px]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Enhanced empty state with better mobile design
  if (!effectiveData || !effectiveData.profile) {
    return (
      <div
        className={`${styles.portfolioTheme} min-h-[100svh] w-full flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] px-4`}
      >
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6 text-4xl sm:text-5xl">🤖</div>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3">Portfolio Coming Soon</h2>
          <p className="text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed">
            We couldn't find enough information to show the traditional layout.
            Our AI assistant will help fill in the details soon.
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

        {/* Enhanced main content with better spacing and responsive padding */}
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 pb-20 sm:pb-24 space-y-12 sm:space-y-16 lg:space-y-20">
          {effectiveData.skills && effectiveData.skills.length > 0 && (
            <section className="scroll-mt-20" id="skills">
              <Skills items={effectiveData.skills} />
            </section>
          )}

          {effectiveData.projects && effectiveData.projects.length > 0 && (
            <section className="scroll-mt-20" id="projects">
              <Projects items={effectiveData.projects} />
            </section>
          )}

          {effectiveData.experience && effectiveData.experience.length > 0 && (
            <section className="scroll-mt-20" id="experience">
              <Experience items={effectiveData.experience} />
            </section>
          )}

          {effectiveData.education && effectiveData.education.length > 0 && (
            <section className="scroll-mt-20" id="education">
              <Education items={effectiveData.education} />
            </section>
          )}

          {effectiveData.achievements &&
            effectiveData.achievements.length > 0 && (
              <section className="scroll-mt-20" id="achievements">
                <div className="mb-8 sm:mb-10">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3">
                    Achievements
                  </h2>
                  <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                </div>
                <div className="grid gap-4 sm:gap-5 lg:gap-6 sm:grid-cols-2">
                  {effectiveData.achievements.map((a, index) => (
                    <div
                      key={`${a}-${index}`}
                      className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 lg:p-6 transition-all duration-200 hover:border-[var(--foreground)]/20 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mt-2 group-hover:scale-125 transition-transform duration-200"></div>
                        <p className="text-sm sm:text-base text-[var(--foreground)] leading-relaxed font-medium">
                          {a}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          {effectiveData.certificates &&
            effectiveData.certificates.length > 0 && (
              <section className="scroll-mt-20" id="certificates">
                <div className="mb-8 sm:mb-10">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3">
                    Certificates
                  </h2>
                  <div className="w-16 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
                </div>
                <div className="grid gap-4 sm:gap-5 lg:gap-6 sm:grid-cols-2">
                  {effectiveData.certificates.map((c, index) => (
                    <div
                      key={`${c}-${index}`}
                      className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 lg:p-6 transition-all duration-200 hover:border-[var(--foreground)]/20 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mt-0.5 group-hover:scale-110 transition-transform duration-200">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-sm sm:text-base text-[var(--foreground)] leading-relaxed font-medium">
                          {c}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
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