import { Hero } from "@/components/landing/Hero";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { BentoFeaturesSection } from "@/components/landing/BentoFeaturesSection";
import { ProfileToPortfolioSteps } from "@/components/landing/ProfileToPortfolioSteps";
import { LandingDemo } from "@/components/landing/LandingDemo";
import { FAQSection } from "@/components/landing/FAQSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProfileToPortfolioSteps />
      <LandingDemo />
      {/* <FeaturesSection /> */}
      <BentoFeaturesSection />
      <FAQSection />
    </>
  );
}
