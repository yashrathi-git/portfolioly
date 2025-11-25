import Image from "next/image";
import { ImportDataBeamDemo } from "./ImportDataBeamDemo";

const BENTO_CONTENT = {
  eyebrow: "Ship portfolios faster",
  heading: "Everything you need to publish a polished story.",
  description:
    "Automated content ingestion, AI formatting, and built-in hosting come together in a flexible workspace designed for product engineers.",
  cards: {
    performance: {
      label: "Performance",
      title: "Lightning-fast builds",
      description:
        "Edge caching keeps your latest edits live without manual redeploys, so every share link stays blazing fast.",
      image: {
        src: "https://media.portfolioly.app/hero/bento/final.webp",
        alt: "Analytics dashboard showing performance metrics",
        objectPosition: "object-left",
      },
    },
    importData: {
      label: "Import",
      title: "Import data in one click",
      description:
        "Connect your LinkedIn, GitHub, or upload a resume—our AI extracts and structures your data instantly.",
    },
    speed: {
      label: "Speed",
      title: "Built for power users",
      description:
        "Import data from GitHub, LinkedIn, or PDFs, then remix layouts and copy with AI helpers built into the editor.",
      image: {
        src: "https://tailwindui.com/plus/img/component-images/bento-01-speed.png",
        alt: "Fast workflow mockup",
        objectPosition: "object-left",
      },
    },
    integrations: {
      label: "Integrations",
      title: "Connect your favorite tools",
      description:
        "Drop in metrics, demos, and live embeds from the rest of your stack without leaving the builder.",
      image: {
        src: "https://tailwindui.com/plus/img/component-images/bento-01-integrations.png",
        alt: "Integrations gallery",
        objectPosition: "object-center",
      },
    },
    network: {
      label: "Network",
      title: "Globally distributed CDN",
      description:
        "Automatic image optimization, video poster frames, and GIF support keep visuals crisp for recruiters everywhere.",
      image: {
        src: "https://tailwindui.com/plus/img/component-images/bento-01-network.png",
        alt: "Network map illustration",
        objectPosition: "object-center",
      },
    },
  },
} as const;

export function BentoFeaturesSection() {
  const { eyebrow, heading, description, cards } = BENTO_CONTENT;
  const { performance, importData, speed, integrations, network } = cards;

  return (
    <section className="bg-background py-32 sm:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
          <p className="text-sm font-semibold tracking-tight text-primary">
            {eyebrow}
          </p>
          <p className="mt-2 text-pretty text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
            {heading}
          </p>
          <p className="mt-4 text-lg text-muted-foreground">{description}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-16 lg:grid-cols-6 lg:grid-rows-2">
          <div className="relative lg:col-span-3">
            <div className="absolute inset-px rounded-lg bg-card/50 backdrop-blur-xl border border-border/50 max-lg:rounded-t-[2rem] lg:rounded-tl-[2rem]" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)] lg:rounded-tl-[calc(2rem+1px)]">
              <Image
                alt={performance.image.alt}
                src={performance.image.src}
                width={800}
                height={320}
                className={`h-80 w-full object-cover ${performance.image.objectPosition}`}
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
              <Image
                alt={speed.image.alt}
                src={speed.image.src}
                width={600}
                height={320}
                className={`h-80 w-full object-cover ${speed.image.objectPosition}`}
                sizes="(min-width: 1024px) 25vw, 100vw"
              />
              <div className="p-10 pt-4">
                <h3 className="text-sm/4 font-semibold text-primary">
                  {speed.label}
                </h3>
                <p className="mt-2 text-lg/7 font-medium tracking-tight text-foreground">
                  {speed.title}
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-muted-foreground">
                  {speed.description}
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-border/10 lg:rounded-bl-[2rem]" />
          </div>

          <div className="relative lg:col-span-2">
            <div className="absolute inset-px rounded-lg bg-card/50 backdrop-blur-xl border border-border/50" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
              <Image
                alt={integrations.image.alt}
                src={integrations.image.src}
                width={600}
                height={320}
                className={`h-80 w-full object-cover ${integrations.image.objectPosition}`}
                sizes="(min-width: 1024px) 25vw, 100vw"
              />
              <div className="p-10 pt-4">
                <h3 className="text-sm/4 font-semibold text-primary">
                  {integrations.label}
                </h3>
                <p className="mt-2 text-lg/7 font-medium tracking-tight text-foreground">
                  {integrations.title}
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-muted-foreground">
                  {integrations.description}
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-border/10" />
          </div>

          <div className="relative lg:col-span-2">
            <div className="absolute inset-px rounded-lg bg-card/50 backdrop-blur-xl border border-border/50 max-lg:rounded-b-[2rem] lg:rounded-br-[2rem]" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-b-[calc(2rem+1px)] lg:rounded-br-[calc(2rem+1px)]">
              <Image
                alt={network.image.alt}
                src={network.image.src}
                width={600}
                height={320}
                className={`h-80 w-full object-cover ${network.image.objectPosition}`}
                sizes="(min-width: 1024px) 25vw, 100vw"
              />
              <div className="p-10 pt-4">
                <h3 className="text-sm/4 font-semibold text-primary">
                  {network.label}
                </h3>
                <p className="mt-2 text-lg/7 font-medium tracking-tight text-foreground">
                  {network.title}
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-muted-foreground">
                  {network.description}
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
