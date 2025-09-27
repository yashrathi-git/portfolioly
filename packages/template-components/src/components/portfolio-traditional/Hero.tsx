import type { PortfolioProfile } from "../../types/portfolio";
import { SocialIcon } from "./SocialIcon";

export type HeroProps = {
  profile: PortfolioProfile;
};

export const Hero = ({ profile }: HeroProps) => {
  return (
    <section className="relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full blur-3xl opacity-30 bg-[oklch(0.84_0.07_250)]" />
        <div className="absolute -bottom-32 -right-24 h-72 w-72 rounded-full blur-3xl opacity-20 bg-[oklch(0.74_0.15_310)]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,rgba(0,0,0,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.35)_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="mx-auto max-w-5xl px-6 pt-12 pb-8 sm:pt-16 sm:pb-10">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              {profile.name}
            </h1>
            <p className="mt-2 text-muted-foreground text-base sm:text-lg max-w-prose">
              {profile.headline}
            </p>
            {profile.location && (
              <p className="mt-1 text-sm text-muted-foreground/80">
                {profile.location}
              </p>
            )}
          </div>

          {(profile.profile_url || profile.avatarUrl) && (
            <img
              src={profile.profile_url || profile.avatarUrl!}
              alt={profile.name}
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl object-cover ring-1 ring-border shadow-sm"
            />
          )}
        </div>

        {/* Socials */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {profile.socials.map((s) => (
            <a
              key={`${s.type}-${s.href}`}
              href={s.href}
              className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-2 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              target="_blank"
              rel="noreferrer"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-card">
                <SocialIcon type={s.type} className="h-3.5 w-3.5" />
              </span>
              <span className="font-medium">
                {s.label || s.type.charAt(0).toUpperCase() + s.type.slice(1)}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
