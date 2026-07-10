'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function ValueProposition() {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-content px-margin-mobile">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-headline-md text-on-surface mb-6">
              Satu transaksi, semua pos terisi.
            </h2>
            <p className="text-body-lg text-on-surface-variant mb-8 leading-relaxed">
              Berbeda dengan transfer biasa yang butuh pembagian manual setelah dana diterima, Lefta membagi USDC secara otomatis saat transfer dieksekusi. Atomic, transparan, tanpa perantara.
            </p>
            <Link
              href="/send"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-label-lg text-white hover:bg-primary/90 transition-colors"
            >
              Mulai Kirim
              <span>→</span>
            </Link>
          </motion.div>

          {/* Visual side - dashboard preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* Mock dashboard card */}
            <div className="rounded-2xl bg-surface-container p-6 shadow-lg border border-outline-variant">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <span className="text-label-lg text-on-surface">Split Preview</span>
                <span className="rounded-full bg-primary-container px-3 py-1 text-label-sm text-primary-container">
                  Live
                </span>
              </div>
              {/* Amount */}
              <div className="mb-6">
                <span className="text-display-lg text-primary">100 USDC</span>
              </div>
              {/* Split bars */}
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex justify-between">
                    <span className="text-label-sm text-on-surface">Kebutuhan Harian</span>
                    <span className="text-label-sm text-on-surface">60 USDC</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: '60%' }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between">
                    <span className="text-label-sm text-on-surface">Tabungan</span>
                    <span className="text-label-sm text-on-surface">25 USDC</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
                    <div className="h-full rounded-full bg-primary/70" style={{ width: '25%' }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between">
                    <span className="text-label-sm text-on-surface">Modal Usaha</span>
                    <span className="text-label-sm text-on-surface">15 USDC</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
                    <div className="h-full rounded-full bg-primary/40" style={{ width: '15%' }} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
