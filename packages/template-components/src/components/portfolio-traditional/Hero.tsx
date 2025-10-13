import Markdown from "markdown-to-jsx";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import BlurFade from "../magicui/blur-fade";
import BlurFadeText from "../magicui/blur-fade-text";
import type { TemplatePortfolioProfile } from "../../types/portfolio";
import { SocialIcon } from "./SocialIcon";

const BLUR_FADE_DELAY = 0.08;

export type HeroProps = {
  profile: TemplatePortfolioProfile;
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
  const avatarSrc = profile.profile_photo_url || profile.avatarUrl;
  const initials = getInitials(profile.name);
  const hasSocials =
    Array.isArray(profile.socials) && profile.socials.length > 0;

  return (
    <>
      <section id="hero" className="px-6 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-2xl space-y-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-start">
            <div className="flex flex-1 flex-col space-y-1.5">
              {firstName && (
                <BlurFadeText
                  delay={BLUR_FADE_DELAY}
                  className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none"
                  yOffset={8}
                  text={`Hi, I'm ${firstName} 👋`}
                />
              )}
              {headline && (
                <BlurFadeText
                  className="max-w-[600px] md:text-xl text-muted-foreground"
                  delay={BLUR_FADE_DELAY * 1.5}
                  text={headline}
                />
              )}
            </div>
            {(avatarSrc || initials) && (
              <BlurFade delay={BLUR_FADE_DELAY * 1.5}>
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
            <BlurFade delay={BLUR_FADE_DELAY * 2}>
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
        <section id="about" className="px-6 pb-16">
          <div className="mx-auto w-full max-w-2xl space-y-4">
            <BlurFade delay={BLUR_FADE_DELAY * 3}>
              <h2 className="text-xl font-bold">About</h2>
            </BlurFade>
            <BlurFade delay={BLUR_FADE_DELAY * 4}>
              <Markdown className="prose max-w-full text-pretty font-sans text-sm text-muted-foreground dark:prose-invert">
                {summary}
              </Markdown>
            </BlurFade>
          </div>
        </section>
      )}
    </>
  );
};

export default Hero;
