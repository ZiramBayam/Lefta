'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function ProductCard() {
  return (
    <section className="bg-surface-container-low py-24">
      <div className="mx-auto max-w-content px-margin-mobile">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-background p-8 lg:p-12 border border-outline"
        >
          {/* Badge */}
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-container px-4 py-2 text-label-sm text-primary-container font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Live on Stellar Testnet
            </span>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-end">
            <div>
              <h2 className="text-headline-md text-on-surface mb-4">
                Siap mengirim?
              </h2>
              <p className="text-body-lg text-on-surface-variant max-w-lg">
                Aplikasi inti Lefta sudah tersedia untuk digunakan. Hubungkan wallet Freighter kamu dan mulai kirim USDC dengan split otomatis ke keluarga.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row lg:justify-end">
              <Link
                href="/send"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-label-lg text-white hover:bg-primary/90 transition-colors"
              >
                Kirim Sekarang
                <span>→</span>
              </Link>
              <Link
                href="/receive"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-outline px-6 py-3 text-label-lg text-on-surface hover:bg-surface-container transition-colors"
              >
                Cek Penerimaan
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
