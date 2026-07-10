'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-surface-container-highest pt-16 pb-8">
      <div className="mx-auto max-w-content px-margin-mobile">
        {/* Footer content */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 mb-12">
          {/* Brand */}
          <div>
            <span className="text-xl font-bold text-primary">Lefta</span>
            <p className="mt-3 text-body-sm text-on-surface-variant max-w-xs">
              Kirim USDC, langsung terbagi ke keluarga. Tanpa perantara, tanpa penundaan.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-label-lg text-on-surface mb-4">Navigasi</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-body-sm text-on-surface-variant hover:text-primary transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/send" className="text-body-sm text-on-surface-variant hover:text-primary transition-colors">
                  Kirim
                </Link>
              </li>
              <li>
                <Link href="/receive" className="text-body-sm text-on-surface-variant hover:text-primary transition-colors">
                  Cek Penerimaan
                </Link>
              </li>
            </ul>
          </div>

          {/* Tech stack */}
          <div>
            <h4 className="text-label-lg text-on-surface mb-4">Tech Stack</h4>
            <ul className="space-y-2">
              <li className="text-body-sm text-on-surface-variant">Stellar Network</li>
              <li className="text-body-sm text-on-surface-variant">Soroban Smart Contracts</li>
              <li className="text-body-sm text-on-surface-variant">USDC</li>
            </ul>
          </div>
        </div>

        {/* Contract addresses */}
        <div className="border-t border-outline py-8">
          <h4 className="text-label-lg text-on-surface mb-4">Contract Addresses (Testnet)</h4>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <span className="text-label-sm text-on-surface-variant">TemplateRegistry:</span>
              <span className="text-label-sm font-mono text-on-surface break-all">Coming soon after deployment</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-label-sm text-on-surface-variant">SplitRouter:</span>
              <span className="text-label-sm font-mono text-on-surface break-all">Coming soon after deployment</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-outline pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-label-sm text-on-surface-variant">
            © 2026 Lefta. Built for APAC Stellar Hackathon 2026.
          </p>
          <div className="flex gap-4">
            <a
              href="https://github.com/zirambayam/Lefta"
              target="_blank"
              rel="noopener noreferrer"
              className="text-label-sm text-on-surface-variant hover:text-primary transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>

        {/* Giant watermark */}
        <div className="overflow-hidden pb-6 mt-8">
          <div className="mx-auto max-w-content">
            <div
              className="select-none whitespace-nowrap text-center font-bold leading-none tracking-tighter text-on-surface/[0.05]"
              style={{ fontSize: '13vw' }}
            >
              Lefta
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
