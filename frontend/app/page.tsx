'use client';

import Link from 'next/link';
import { WalletButton } from '@/components/WalletButton';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-margin-mobile pt-xl pb-lg flex items-center justify-between">
        <h1 className="text-headline-md text-on-surface font-bold">Lefta</h1>
        <WalletButton />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-margin-mobile pb-xl">
        <div className="w-full max-w-sm space-y-xl">
          {/* Send */}
          <Link
            href="/send"
            className="block w-full p-lg bg-primary-container rounded-lg text-center group transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="w-12 h-12 mx-auto mb-md bg-primary rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <h2 className="text-headline-sm text-on-primary-container font-semibold mb-sm">
              Kirim
            </h2>
            <p className="text-body-md text-on-primary-container">
              Bagi USDC ke beberapa penerima sekaligus
            </p>
          </Link>

          {/* Receive */}
          <Link
            href="/receive"
            className="block w-full p-lg bg-surface-container rounded-lg text-center group transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="w-12 h-12 mx-auto mb-md bg-secondary rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h2 className="text-headline-sm text-on-surface font-semibold mb-sm">
              Cek Penerimaan
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Lihat saldo dan riwayat penerimaan
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
