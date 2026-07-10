import { Nav } from './components/sections/Nav';
import { Hero } from './components/sections/Hero';
import { StatBar } from './components/sections/StatBar';
import { ValueProposition } from './components/sections/ValueProposition';
import { HowItWorks } from './components/sections/HowItWorks';
import { ProductCard } from './components/sections/ProductCard';
import { Trust } from './components/sections/Trust';
import { ProofOnChain } from './components/sections/ProofOnChain';
import { CTA } from './components/sections/CTA';
import { Footer } from './components/sections/Footer';

export default function TentangPage() {
  return (
    <main className="min-h-screen bg-background">
      <Nav />
      <Hero />
      <StatBar />
      <ValueProposition />
      <HowItWorks />
      <Trust />
      <ProofOnChain />
      <ProductCard />
      <CTA />
      <Footer />
    </main>
  );
}
