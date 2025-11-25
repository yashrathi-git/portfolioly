import { Hero } from "@/components/landing/Hero";
import { BentoFeaturesSection } from "@/components/landing/BentoFeaturesSection";
import { ProfileToPortfolioSteps } from "@/components/landing/ProfileToPortfolioSteps";
import { LandingDemo } from "@/components/landing/LandingDemo";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

// Force static generation at build time
export const dynamic = "force-static";
export const revalidate = false;

export default function HomePage() {
  return (
    <>
      <Hero />
      <BentoFeaturesSection />
      <ProfileToPortfolioSteps />
      <LandingDemo />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </>
  );
}
