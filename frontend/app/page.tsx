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
    <div className="min-h-screen bg-background">
      <LandingNav />
      <HeroSection />
      <MarqueeBar />
      <ProblemSection />
      <HowItWorks />
      <TrustSection />
      <SplitVisual />
      <OnChainProof />
      <StatsCounter />
      <FinalCta />
      <Footer />
    </div>
  );
}
