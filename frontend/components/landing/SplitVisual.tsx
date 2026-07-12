export default function SplitVisual() {
  const allocations = [
    { label: "Kebutuhan Harian", pct: 60, color: "bg-primary-container" },
    { label: "Tabungan", pct: 25, color: "bg-secondary-container" },
    { label: "Modal Usaha", pct: 15, color: "bg-tertiary-container" },
  ];

  return (
    <section className="py-24 px-container-padding">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-display-lg font-bold text-on-surface mb-4">
          Satu Transaksi, Tiga Tujuan
        </h2>
        <p className="text-body-lg text-on-surface-variant mb-16 max-w-2xl mx-auto">
          Smart contract auto-split dalam satu atomic transaction — tidak ada yang terlewat, tidak ada ekstra biaya.
        </p>

        <div className="flex flex-col items-center gap-8">
          <div className="flex items-center gap-4 px-8 py-6 bg-surface-container rounded-xl">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" className="text-primary">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 15H8v-2h3v2Zm0-4H8v-2h3v2Zm5 0h-3v-2h3v2Zm0 4h-3v-2h3v2Z"/>
            </svg>
            <span className="text-headline-sm font-semibold text-on-surface">Sender</span>
          </div>

          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-outline rotate-90">
            <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6-1.59-1.41Z"/>
          </svg>

          <div className="w-full max-w-md">
            <div className="flex h-12 rounded-md overflow-hidden">
              {allocations.map((a) => (
                <div
                  key={a.label}
                  className={`${a.color} flex items-center justify-center text-label-lg font-semibold text-on-primary-container`}
                  style={{ width: `${a.pct}%` }}
                >
                  {a.pct}%
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
            {allocations.map((a) => (
              <div key={a.label} className="flex flex-col items-center gap-2 p-4 bg-surface-container rounded-xl">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-primary">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 15H8v-2h3v2Zm0-4H8v-2h3v2Zm5 0h-3v-2h3v2Zm0 4h-3v-2h3v2Z"/>
                </svg>
                <span className="text-label-lg font-semibold text-on-surface text-center">{a.label}</span>
                <span className="text-display-lg font-bold text-primary">{a.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
