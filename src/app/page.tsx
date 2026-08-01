import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { ProcessSection } from "@/components/landing/process-section";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export default function Home() {
  return (
    <main>
      <SiteHeader />
      <HeroSection />
      <FeaturesSection />
      <ProcessSection />
      <PricingSection />
      <SiteFooter />
    </main>
  );
}