const cards = [
  {
    title: "TemplateRegistry",
    desc: "Menyimpan kesepakatan pembagian di on-chain — tidak bisa diubah sepihak setelah disetujui kedua pihak.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    title: "SplitRouter",
    desc: "Mengeksekusi pembagian dalam satu transaksi atomic — tidak ada skenario sebagian terkirim, sebagian tidak.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 3 21 3 21 8" />
        <line x1="4" y1="20" x2="21" y2="3" />
        <polyline points="21 16 21 21 16 21" />
        <line x1="15" y1="15" x2="21" y2="21" />
        <line x1="4" y1="4" x2="9" y2="9" />
      </svg>
    ),
  },
  {
    title: "Freighter Wallet",
    desc: "Setiap transaksi ditandatangani langsung oleh pengirim — tidak ada pihak ketiga yang memegang kendali dana.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="6" width="22" height="12" rx="2" ry="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M5 10v4" />
        <path d="M19 10v4" />
      </svg>
    ),
  },
];

export default function TrustSection() {
  return (
    <section className="py-24 px-container-padding bg-surface-container-lowest">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-display-lg font-bold text-center text-on-surface mb-4">
          Dibangun di Atas Stellar
        </h2>
        <p className="text-body-lg text-center text-on-surface-variant mb-16 max-w-2xl mx-auto">
          Tiga komponen sistem yang bekerja bersama — dijelaskan dalam bahasa yang bisa dipahami siapapun.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-surface-container rounded-xl p-8 flex flex-col gap-5"
            >
              <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
                {card.icon}
              </div>
              <div>
                <h3 className="text-headline-sm text-on-surface font-semibold mb-2">
                  {card.title}
                </h3>
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
