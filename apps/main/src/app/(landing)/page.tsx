import { Hero } from "@/components/landing/Hero";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { BentoFeaturesSection } from "@/components/landing/BentoFeaturesSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* <FeaturesSection /> */}
      <BentoFeaturesSection />
    </>
  );
}
