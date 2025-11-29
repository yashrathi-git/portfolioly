import Image from "next/image";
import Link from "next/link";
import { ImportDataBeamDemo } from "./ImportDataBeamDemo";
import { Globe } from "@/components/ui/globe";
import { OpenSourceGraphic } from "./OpenSourceGraphic";
import { SEOGraphic } from "./SEOGraphic";

const BENTO_CONTENT = {
  heading: "Everything you need to stand out and get noticed",
  description:
    "Automated content ingestion, AI formatting, and one-click deploy come together in a flexible workspace designed for product engineers.",
  cards: {
    performance: {
      label: "Chat Mode",
      title: "Standout with chat mode",
      description:
        "Turn yourself into ChatGPT and let recruiters and visitors chat with your portfolio to learn about you.",
      image: {
        src: "https://media.portfolioly.app/hero/bento/final.webp",
        alt: "Chat mode portfolio interface",
        objectPosition: "object-center object-bottom",
      },
    },
    importData: {
      label: "Auto Generate",
      title: "Import data in one click",
      description:
        "Connect your LinkedIn, GitHub, or upload a resume—our AI extracts and structures your data instantly.",
    },
    oneClickDeploy: {
      label: "One Click Deploy",
      title: "Deploy in seconds",
      description:
        "Deploy in seconds to Vercel or publish to portfolioly.app, just one click away!",
    },
    customizeFreely: {
      label: "Open Source",
      title: "Customize Freely",
      description:
        "Portfolioly is fully open source. Fork the repo and customize every aspect of your template to match your style.",
      githubUrl: "https://github.com/yashrathi-git/portfolioly",
    },
    seoOptimized: {
      label: "SEO Optimized",
      title: "Get Discovered",
      description:
        "Built-in SEO best practices ensure your profile ranks on search engines, making it easier for recruiters to find you.",
    },
  },
} as const;

export function BentoFeaturesSection() {
  const { heading, description, cards } = BENTO_CONTENT;
  const {
    performance,
    importData,
    oneClickDeploy,
    customizeFreely,
    seoOptimized,
  } = cards;

  return (
    <section
      id="features"
      className="bg-background py-32 sm:py-40 scroll-mt-20"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {heading}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{description}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-6 lg:grid-rows-2">
          <div className="relative lg:col-span-3">
            <div className="absolute inset-px rounded-lg bg-card/50 backdrop-blur-xl border border-border/50 max-lg:rounded-t-[2rem] lg:rounded-tl-[2rem]" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)] lg:rounded-tl-[calc(2rem+1px)]">
              <Image
                alt={performance.image.alt}
                src={performance.image.src}
                width={800}
                height={320}
                className="h-80 w-full object-cover"
                style={{ objectPosition: "center 80%" }}
                sizes="(min-width: 1024px) 33vw, 100vw"
              />
              <div className="p-10 pt-4">
                <h3 className="text-sm/4 font-semibold text-primary">
                  {performance.label}
                </h3>
                <p className="mt-2 text-lg/7 font-medium tracking-tight text-foreground">
                  {performance.title}
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-muted-foreground">
                  {performance.description}
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-border/10 max-lg:rounded-t-[2rem] lg:rounded-tl-[2rem]" />
          </div>

          <div className="relative lg:col-span-3">
            <div className="absolute inset-px rounded-lg bg-card/50 backdrop-blur-xl border border-border/50 lg:rounded-tr-[2rem]" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-tr-[calc(2rem+1px)]">
              <div className="h-80 w-full">
                <ImportDataBeamDemo className="h-full" />
              </div>
              <div className="p-10 pt-4">
                <h3 className="text-sm/4 font-semibold text-primary">
                  {importData.label}
                </h3>
                <p className="mt-2 text-lg/7 font-medium tracking-tight text-foreground">
                  {importData.title}
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-muted-foreground">
                  {importData.description}
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-border/10 lg:rounded-tr-[2rem]" />
          </div>

          <div className="relative lg:col-span-2">
            <div className="absolute inset-px rounded-lg bg-card/50 backdrop-blur-xl border border-border/50 lg:rounded-bl-[2rem]" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-bl-[calc(2rem+1px)]">
              <div className="relative h-80 w-full flex items-center justify-center overflow-hidden">
                <Globe className="top-28" />
                <div className="pointer-events-none absolute inset-0 h-full bg-[radial-gradient(circle_at_50%_200%,rgba(0,0,0,0.2),rgba(255,255,255,0))]" />
              </div>
              <div className="p-10 pt-4">
                <h3 className="text-sm/4 font-semibold text-primary">
                  {oneClickDeploy.label}
                </h3>
                <p className="mt-2 text-lg/7 font-medium tracking-tight text-foreground">
                  {oneClickDeploy.title}
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-muted-foreground">
                  {oneClickDeploy.description}
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-border/10 lg:rounded-bl-[2rem]" />
          </div>

          <div className="relative lg:col-span-2">
            <div className="absolute inset-px rounded-lg bg-card/50 backdrop-blur-xl border border-border/50" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
              <OpenSourceGraphic className="h-80 w-full" />
              <div className="p-10 pt-4">
                <h3 className="text-sm/4 font-semibold text-primary">
                  {customizeFreely.label}
                </h3>
                <p className="mt-2 text-lg/7 font-medium tracking-tight text-foreground">
                  {customizeFreely.title}
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-muted-foreground">
                  <Link
                    href={customizeFreely.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Portfolioly
                  </Link>{" "}
                  is fully open source. Fork the repo and customize every aspect
                  of your template to match your style.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-border/10" />
          </div>

          <div className="relative lg:col-span-2">
            <div className="absolute inset-px rounded-lg bg-card/50 backdrop-blur-xl border border-border/50 max-lg:rounded-b-[2rem] lg:rounded-br-[2rem]" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-b-[calc(2rem+1px)] lg:rounded-br-[calc(2rem+1px)]">
              <SEOGraphic className="h-80 w-full" />
              <div className="p-10 pt-4">
                <h3 className="text-sm/4 font-semibold text-primary">
                  {seoOptimized.label}
                </h3>
                <p className="mt-2 text-lg/7 font-medium tracking-tight text-foreground">
                  {seoOptimized.title}
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-muted-foreground">
                  {seoOptimized.description}
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-border/10 max-lg:rounded-b-[2rem] lg:rounded-br-[2rem]" />
          </div>
        </div>
      </div>
    </section>
  );
}
