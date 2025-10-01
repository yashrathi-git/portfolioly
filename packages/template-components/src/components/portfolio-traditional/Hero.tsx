import type { TemplatePortfolioProfile } from "../../types/portfolio";
import { SocialIcon } from "./SocialIcon";

export type HeroProps = {
  profile: TemplatePortfolioProfile;
};

export const Hero = ({ profile }: HeroProps) => {
  if (!profile) {
    return null;
  }

  const hasName = Boolean(profile.name);
  const hasHeadline = Boolean(profile.headline);
  const hasLocation = Boolean(profile.location);
  const avatarSrc = profile.profile_photo_url || profile.avatarUrl;
  const hasSocials =
    Array.isArray(profile.socials) && profile.socials.length > 0;

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        {/* Avatar - Centered */}
        {avatarSrc && (
          <div className="flex justify-center mb-6">
            <img
              src={avatarSrc}
              alt={hasName ? profile.name : "Profile avatar"}
              className="h-28 w-28 sm:h-32 sm:w-32 rounded-full object-cover ring-2 ring-border shadow-md"
            />
          </div>
        )}

        {/* Main content - Centered */}
        <div className="text-center space-y-3">
          {hasName && (
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              {profile.name}
            </h1>
          )}

          {hasHeadline && (
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {profile.headline}
            </p>
          )}

          {hasLocation && (
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {profile.location}
            </p>
          )}
        </div>

        {/* Socials - Centered */}
        {hasSocials && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {profile.socials?.map((s) => (
              <a
                key={`${s.type}-${s.href}`}
                href={s.href}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:border-foreground/20"
                target="_blank"
                rel="noreferrer"
              >
                <span className="flex h-4 w-4 items-center justify-center text-muted-foreground">
                  <SocialIcon type={s.type} className="h-4 w-4" />
                </span>
                <span>
                  {s.label || s.type.charAt(0).toUpperCase() + s.type.slice(1)}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;
