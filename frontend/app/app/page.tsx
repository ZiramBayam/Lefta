import Link from "next/link";

export default function AppPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-container-padding">
      <Link
        href="/"
        className="absolute top-6 left-6 text-label-lg text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Kembali
      </Link>

      <div className="text-center flex flex-col items-center gap-8 max-w-sm">
        <div>
          <h1 className="text-display-lg font-bold text-on-surface mb-2">Lefta</h1>
          <p className="text-body-lg text-on-surface-variant">
            Kirim uang, terbagi otomatis.
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <Link
            href="/app/send"
            className="
              bg-primary-container text-on-primary-container
              w-full py-4 rounded-md
              text-headline-sm font-semibold text-center
              hover:brightness-95 active:scale-[0.98]
              transition-all duration-200
              min-h-[56px] flex items-center justify-center
            "
          >
            Kirim
          </Link>
          <Link
            href="/app/receive"
            className="
              bg-surface-container text-on-surface
              w-full py-4 rounded-md
              text-headline-sm font-semibold text-center
              hover:bg-surface-container-high active:scale-[0.98]
              transition-all duration-200
              min-h-[56px] flex items-center justify-center
            "
          >
            Cek Penerimaan
          </Link>
        </div>
      </div>
    </div>
  );
}
