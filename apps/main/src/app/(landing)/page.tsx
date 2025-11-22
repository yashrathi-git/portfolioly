import { Hero } from "@/components/landing/Hero";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { BentoFeaturesSection } from "@/components/landing/BentoFeaturesSection";
import { ProfileToPortfolioSteps } from "@/components/landing/ProfileToPortfolioSteps";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProfileToPortfolioSteps />
      {/* <FeaturesSection /> */}
      <BentoFeaturesSection />
    </>
  );
}
