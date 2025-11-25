import Link from "next/link";
import { ShimmerButton } from "../ui/shimmer-button";

export function FinalCTA() {
  return (
    <section className="relative w-full py-24 overflow-hidden">
      <div className="container px-4 md:px-6 mx-auto relative z-10">
        <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
            Turn your Resume into a Portfolio. Instantly.
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground max-w-[600px]">
            Stop wasting hours on design. Paste your existing profile, and let
            our AI build you a stunning showcase in seconds.
          </p>

          <div className="pt-4">
            <Link href="/dashboard">
              <ShimmerButton className="h-12 px-8 text-base">
                Generate My Portfolio
              </ShimmerButton>
            </Link>
          </div>
        </div>
      </div>

      {/* Subtle background gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background opacity-50" />
    </section>
  );
}
