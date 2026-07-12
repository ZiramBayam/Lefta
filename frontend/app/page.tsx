import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import ScrollReveal from "@/components/ScrollReveal";
import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import MarqueeBar from "@/components/landing/MarqueeBar";
import ProblemSection from "@/components/landing/ProblemSection";
import HowItWorks from "@/components/landing/HowItWorks";
import TrustSection from "@/components/landing/TrustSection";
import SplitVisual from "@/components/landing/SplitVisual";
import OnChainProof from "@/components/landing/OnChainProof";
import StatsCounter from "@/components/landing/StatsCounter";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <SmoothScrollProvider>
      <div className="min-h-screen bg-background">
        <LandingNav />
        <HeroSection />
        <ScrollReveal>
          <MarqueeBar />
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <ProblemSection />
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <HowItWorks />
        </ScrollReveal>
        <ScrollReveal delay={0.15}>
          <TrustSection />
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <SplitVisual />
        </ScrollReveal>
        <ScrollReveal delay={0.15}>
          <OnChainProof />
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <StatsCounter />
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <FinalCta />
        </ScrollReveal>
        <ScrollReveal>
          <Footer />
        </ScrollReveal>
      </div>
    </SmoothScrollProvider>
  );
}
