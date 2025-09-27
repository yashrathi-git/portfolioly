import type { PortfolioData } from "../types/portfolio";
import { Hero } from "./portfolio-traditional/Hero";
import { Projects } from "./portfolio-traditional/Projects";
import { Experience } from "./portfolio-traditional/Experience";
import { Education } from "./portfolio-traditional/Education";
import { Skills } from "./portfolio-traditional/Skills";
import styles from "./portfolio-theme.module.css";

export type TraditionalPortfolioProps = {
  data: PortfolioData;
};

export const TraditionalPortfolio = ({ data }: TraditionalPortfolioProps) => {
  return (
    <div
      className={`${styles.portfolioTheme} min-h-[100svh] w-full text-foreground`}
    >
      <Hero profile={data.profile} />

      <main className="mx-auto max-w-5xl px-6 pb-20">
        {data.skills && data.skills.length > 0 && (
          <section className="mt-10">
            <Skills items={data.skills} />
          </section>
        )}

        {data.projects && data.projects.length > 0 && (
          <section className="mt-12">
            <Projects items={data.projects} />
          </section>
        )}

        {data.experience && data.experience.length > 0 && (
          <section className="mt-12">
            <Experience items={data.experience} />
          </section>
        )}

        {data.education && data.education.length > 0 && (
          <section className="mt-12">
            <Education items={data.education} />
          </section>
        )}

        {data.achievements && data.achievements.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold tracking-tight">
              Achievements
            </h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {data.achievements.map((a) => (
                <li
                  key={a}
                  className="rounded-lg border border-border/70 bg-card px-4 py-3 text-sm shadow-sm"
                >
                  {a}
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.certificates && data.certificates.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold tracking-tight">
              Certificates
            </h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {data.certificates.map((c) => (
                <li
                  key={c}
                  className="rounded-lg border border-border/70 bg-card px-4 py-3 text-sm shadow-sm"
                >
                  {c}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
};
