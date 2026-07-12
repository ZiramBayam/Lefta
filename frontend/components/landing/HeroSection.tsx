export default function HeroSection() {
  return (
    <section className="h-[205vh] relative">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-container/20 via-background to-background pointer-events-none" />

        {/* Split Headline — inspired by tanur.app overlap pattern */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full max-w-5xl px-container-padding h-0">
            <h1
              className="absolute left-1/2 text-right origin-right text-[clamp(2.5rem,10vw,6rem)] font-bold leading-[0.9] tracking-tight text-on-surface"
              style={{ transform: "translateX(-100%) scale(1.15)" }}
            >
              Kirim uang.
            </h1>
            <h1
              className="absolute left-1/2 text-left origin-left text-[clamp(2.5rem,10vw,6rem)] font-bold leading-[0.9] tracking-tight text-primary"
              style={{ transform: "scale(1.15)" }}
            >
              Terbagi otomatis.
            </h1>
          </div>
        </div>

        {/* Subheadline */}
        <div className="absolute bottom-[20vh] left-1/2 -translate-x-1/2 text-center max-w-lg px-6 w-full">
          <p className="text-body-lg text-on-surface-variant">
            USDC dari luar negeri, langsung terbagi ke pos yang sudah disepakati — sekali kirim, semua kebagian.
          </p>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-[10vh] left-1/2 -translate-x-1/2 text-center">
          <p className="text-label-sm text-on-surface-variant/60 mb-2">Scroll to explore</p>
          <span className="inline-block animate-bounce text-on-surface-variant/60">↓</span>
        </div>
      </div>
    </section>
  );
}
