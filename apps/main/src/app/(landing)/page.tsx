import { Hero } from "@/components/landing/Hero";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { BentoFeaturesSection } from "@/components/landing/BentoFeaturesSection";
import { ProfileToPortfolioSteps } from "@/components/landing/ProfileToPortfolioSteps";
import { LandingDemo } from "@/components/landing/LandingDemo";
import { FAQSection } from "@/components/landing/FAQSection";

import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <>
      <Hero />
      <BentoFeaturesSection />
      <ProfileToPortfolioSteps />
      <LandingDemo />
      {/* <FeaturesSection /> */}
      <FAQSection />
      <FinalCTA />
      <Footer />
    </>
  );
}
