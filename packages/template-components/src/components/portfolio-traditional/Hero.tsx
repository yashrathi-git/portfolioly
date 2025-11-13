import Markdown from "markdown-to-jsx";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import BlurFade from "../magicui/blur-fade";
import BlurFadeText from "../magicui/blur-fade-text";
import type { DisplayPortfolioProfile } from "portfolioly-schema";
import { SocialIcon } from "./SocialIcon";
import {
  BLUR_FADE_DELAY,
  SECTION_DELAYS,
} from "../../lib/constants/animations";

export type HeroProps = {
  profile: DisplayPortfolioProfile;
};

const getInitials = (name?: string | null) => {
  if (!name) {
    return "";
  }

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

export const Hero = ({ profile }: HeroProps) => {
  if (!profile) {
    return null;
  }

  const firstName = profile.name?.split(/\s+/)[0];
  const headline = profile.headline;
  const summary = profile.summary;
  const avatarSrc = profile.avatarUrl;
  const initials = getInitials(profile.name);
  const hasSocials =
    Array.isArray(profile.socials) && profile.socials.length > 0;

  return (
    <>
      <section id="hero" className="px-6 pt-16 sm:pt-24 pb-10">
        <div className="mx-auto w-full max-w-2xl space-y-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-start">
            <div className="flex flex-1 flex-col space-y-1.5">
              {firstName && (
                <BlurFadeText
                  delay={BLUR_FADE_DELAY * SECTION_DELAYS.hero}
                  className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none"
                  yOffset={8}
                  text={`Hi, I'm ${firstName} 👋`}
                />
              )}
              {headline && (
                <BlurFadeText
                  className="max-w-[600px] md:text-xl text-muted-foreground"
                  delay={BLUR_FADE_DELAY * SECTION_DELAYS.avatar}
                  text={headline}
                />
              )}
            </div>
            {(avatarSrc || initials) && (
              <BlurFade delay={BLUR_FADE_DELAY * SECTION_DELAYS.avatar}>
                <Avatar className="size-28 border">
                  {avatarSrc && (
                    <AvatarImage
                      alt={profile.name || "Profile avatar"}
                      src={avatarSrc}
                    />
                  )}
                  <AvatarFallback className="text-xl font-semibold text-muted-foreground">
                    {initials || ""}
                  </AvatarFallback>
                </Avatar>
              </BlurFade>
            )}
          </div>

          {hasSocials && (
            <BlurFade delay={BLUR_FADE_DELAY * SECTION_DELAYS.socials}>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {profile.socials?.map((s) => (
                  <a
                    key={`${s.type}-${s.href}`}
                    href={s.href}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-foreground/20"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="flex h-4 w-4 items-center justify-center text-muted-foreground">
                      <SocialIcon type={s.type} className="h-4 w-4" />
                    </span>
                    <span>
                      {s.label ||
                        s.type.charAt(0).toUpperCase() + s.type.slice(1)}
                    </span>
                  </a>
                ))}
              </div>
            </BlurFade>
          )}
        </div>
      </section>

      {summary && (
        <section id="about" className="px-6 pb-12">
          <div className="mx-auto w-full max-w-2xl">
            <div className="flex min-h-0 flex-col gap-y-3">
              <BlurFade delay={BLUR_FADE_DELAY * SECTION_DELAYS.about}>
                <h2 className="text-2xl font-bold">About</h2>
              </BlurFade>
              <BlurFade delay={BLUR_FADE_DELAY * SECTION_DELAYS.aboutContent}>
                <Markdown className="prose max-w-full text-pretty font-sans text-base leading-relaxed text-foreground dark:prose-invert prose-p:text-foreground prose-p:leading-relaxed prose-li:text-foreground">
                  {summary}
                </Markdown>
              </BlurFade>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default Hero;
