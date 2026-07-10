'use client';

import { motion } from 'framer-motion';

export function Hero() {
  return (
    <section className="relative h-[205vh]">
      {/* Sticky container */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Background gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #f9faf5 0%, #edeee9 50%, #d1e231 100%)',
          }}
        />

        {/* Animated particles (CSS-only) */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-20 hero-particle"
              style={{
                width: `${20 + i * 30}px`,
                height: `${20 + i * 30}px`,
                background: '#5b6400',
                left: `${10 + i * 15}%`,
                top: `${20 + i * 10}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* Split Headline - centered overlap */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full max-w-4xl px-6">
            {/* Left word - right-aligned, scaled for overlap */}
            <h1
              className="absolute left-1/2 text-right font-bold leading-tight"
              style={{
                transform: 'translateX(-100%) scale(1.15)',
                fontSize: 'clamp(2.5rem, 8vw, 5rem)',
                color: '#1a1c19',
              }}
            >
              Kirim uang.
            </h1>
            {/* Right word - left-aligned, scaled for overlap */}
            <h1
              className="absolute left-1/2 text-left font-bold leading-tight"
              style={{
                transform: 'scale(1.15)',
                fontSize: 'clamp(2.5rem, 8vw, 5rem)',
                color: '#5b6400',
              }}
            >
              Terbagi otomatis.
            </h1>
          </div>
        </div>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute bottom-[20vh] left-1/2 -translate-x-1/2 text-center max-w-lg px-6 text-body-lg text-on-surface-variant"
        >
          USDC dari luar negeri, langsung terbagi ke pos yang sudah disepakati — sekali kirim, semua kebagian.
        </motion.p>

        {/* Marquee ticker */}
        <div className="absolute bottom-0 inset-x-0 overflow-hidden border-t border-outline/20">
          <div className="flex hero-marquee">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex shrink-0">
                {['Stellar', 'Soroban', 'Freighter', 'USDC', 'Horizon RPC'].map((tech, j) => (
                  <span key={j} className="whitespace-nowrap px-6 font-mono text-sm text-on-surface-variant">
                    {tech}
                    {j < 4 && <span className="mx-2 opacity-50">·</span>}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-[10vh] left-1/2 -translate-x-1/2 text-center">
          <p className="text-sm text-on-surface-variant/60 mb-2">Scroll to explore</p>
          <span className="inline-block text-on-surface-variant/60 hero-scroll-indicator">
            ↓
          </span>
        </div>
      </div>

      {/* CSS keyframes */}
      <style>{`
        .hero-particle {
          animation: float 3s ease-in-out infinite;
        }
        .hero-particle:nth-child(1) { animation-duration: 3s; }
        .hero-particle:nth-child(2) { animation-duration: 3.5s; }
        .hero-particle:nth-child(3) { animation-duration: 4s; }
        .hero-particle:nth-child(4) { animation-duration: 4.5s; }
        .hero-particle:nth-child(5) { animation-duration: 5s; }
        .hero-particle:nth-child(6) { animation-duration: 5.5s; }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .hero-marquee {
          animation: marquee 20s linear infinite;
        }

        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .hero-scroll-indicator {
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(5px); }
        }
      `}</style>
    </section>
  );
}
