import { Toaster } from "@/components/ui/sonner";
import { HeroSection } from "@/components/sections/hero-section";
import { FeaturesSection } from "@/components/sections/features-section";
import { InteractiveDemoSection } from "@/components/sections/interactive-demo-section";
import { ProvesSection } from "@/components/sections/proves-section";
import { TechStackSection } from "@/components/sections/tech-stack-section";
import { FooterCtaSection } from "@/components/sections/footer-cta-section";

export default function App() {
  return (
    <div className="relative min-h-screen bg-black overflow-x-hidden">
      {/* Background gradient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1400px] h-[1400px] rounded-full blur-3xl opacity-20 bg-[radial-gradient(closest-side,rgba(6,182,212,0.4),rgba(0,0,0,0))]" />
        <div className="absolute bottom-0 right-0 w-[1000px] h-[1000px] translate-x-1/3 translate-y-1/3 rounded-full blur-3xl opacity-15 bg-[radial-gradient(closest-side,rgba(56,189,248,0.25),rgba(0,0,0,0))]" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <HeroSection />
        <FeaturesSection />
        <InteractiveDemoSection />
        <ProvesSection />
        <TechStackSection />
        <FooterCtaSection />
      </main>

      <Toaster position="top-right" />
    </div>
  );
}
