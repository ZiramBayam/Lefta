const steps = [
  {
    num: "01",
    title: "Buat Template",
    desc: "Sepakati sekali dengan keluarga: berapa persen ke kebutuhan harian, berapa ke tabungan, berapa ke modal usaha.",
    ref: "TemplateRegistry.create_template",
  },
  {
    num: "02",
    title: "Kirim USDC",
    desc: "Masukkan jumlah yang mau dikirim, pilih template yang sudah dibuat. Preview pembagian real-time sebelum tanda tangan.",
    ref: "SplitRouter.transfer",
  },
  {
    num: "03",
    title: "Split Terjadi Otomatis",
    desc: "Smart contract membagi dana ke setiap wallet tujuan dalam satu transaksi, atomic — semua atau tidak sama sekali.",
    ref: "SplitRouter.transfer (internal)",
  },
  {
    num: "04",
    title: "Keluarga Menerima",
    desc: "Setiap wallet penerima langsung mendapat bagian sesuai kesepakatan, tanpa perantara membagi ulang.",
    ref: "SplitRouter.get_recipient_history",
  },
];

export default function HowItWorks() {
  return (
    <section id="cara-kerja" className="py-24 px-container-padding bg-surface-container-low">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-display-lg font-bold text-center text-on-surface mb-4">
          Cara Kerja
        </h2>
        <p className="text-body-lg text-center text-on-surface-variant mb-16 max-w-2xl mx-auto">
          Dari kirim sampai terima, dalam satu transaksi on-chain.
        </p>

        <div className="grid md:grid-cols-4 gap-4">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`${
                i === 0 ? "featured-card" : "group"
              } relative flex min-h-[300px] flex-col rounded-xl border p-7 transition-all duration-300 ${
                i === 0
                  ? "bg-surface-container border-primary-container/40"
                  : "bg-surface-container border-outline-variant/40 hover:border-primary-container/40"
              }`}
            >
              <span className="grid h-9 w-9 place-items-center rounded-full border font-mono text-[13px] border-outline text-primary">
                {step.num}
              </span>

              <h3 className="text-headline-sm font-semibold text-on-surface mt-auto">
                {step.title}
              </h3>

              <div className="detail-content">
                <p className="mt-3 text-body-md text-on-surface-variant leading-relaxed">
                  {step.desc}
                </p>
                <div className="mt-5 border-t border-outline-variant pt-4">
                  <span className="font-mono text-label-sm text-primary">
                    {step.ref}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
