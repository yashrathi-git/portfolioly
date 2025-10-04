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
    <section className="relative overflow-hidden border-b border-[var(--border)] bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--card)]/30">
      {/* Enhanced background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        {/* Enhanced avatar with better mobile sizing */}
        {avatarSrc && (
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
              <img
                src={avatarSrc}
                alt={hasName ? profile.name : "Profile avatar"}
                className="relative h-32 w-32 sm:h-40 sm:w-40 lg:h-48 lg:w-48 rounded-full object-cover shadow-2xl border-4 border-[var(--background)] group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 rounded-full ring-4 ring-[var(--border)]/20 group-hover:ring-[var(--foreground)]/30 transition-all duration-300"></div>
            </div>
          </div>
        )}

        {/* Enhanced main content with better typography */}
        <div className="text-center space-y-4 sm:space-y-6">
          {hasName && (
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight bg-gradient-to-r from-[var(--foreground)] via-[var(--foreground)] to-[var(--foreground)]/80 bg-clip-text">
                {profile.name}
              </h1>
              <div className="w-24 sm:w-32 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto"></div>
            </div>
          )}

          {hasHeadline && (
            <p className="text-lg sm:text-xl lg:text-2xl text-[var(--muted-foreground)] max-w-3xl mx-auto leading-relaxed font-medium px-4">
              {profile.headline}
            </p>
          )}

          {hasLocation && (
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[var(--card)]/50 border border-[var(--border)]/50 backdrop-blur">
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--muted-foreground)]"
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
              <span className="text-sm sm:text-base text-[var(--muted-foreground)] font-medium">
                {profile.location}
              </span>
            </div>
          )}
        </div>

        {/* Enhanced socials with better mobile touch targets */}
        {hasSocials && (
          <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {profile.socials?.map((s) => (
              <a
                key={`${s.type}-${s.href}`}
                href={s.href}
                className="group inline-flex items-center gap-2 sm:gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)]/70 backdrop-blur px-4 py-3 sm:px-5 sm:py-4 text-sm sm:text-base font-medium transition-all duration-200 hover:border-[var(--foreground)]/20 hover:bg-[var(--card)] hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 min-h-[48px] min-w-[48px]"
                target="_blank"
                rel="noreferrer"
              >
                <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] group-hover:scale-110 transition-all duration-200">
                  <SocialIcon type={s.type} className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
                <span className="group-hover:text-[var(--foreground)] transition-colors duration-200">
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