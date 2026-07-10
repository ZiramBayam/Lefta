'use client';

import { motion } from 'framer-motion';

interface TrustItem {
  title: string;
  description: string;
  icon: string;
}

const trustItems: TrustItem[] = [
  {
    title: 'TemplateRegistry',
    description: 'Menyimpan kesepakatan pembagian di on-chain — tidak bisa diubah sepihak setelah disetujui kedua pihak.',
    icon: '📋',
  },
  {
    title: 'SplitRouter',
    description: 'Mengeksekusi pembagian dalam satu transaksi atomic — tidak ada skenario sebagian terkirim, sebagian tidak.',
    icon: '⚡',
  },
  {
    title: 'Freighter Wallet',
    description: 'Setiap transaksi ditandatangani langsung oleh pengirim — tidak ada pihak ketiga yang memegang kendali dana.',
    icon: '🔐',
  },
];

export function Trust() {
  return (
    <section id="keamanan" className="bg-surface-container-low py-24">
      <div className="mx-auto max-w-content px-margin-mobile">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="text-headline-md text-on-surface mb-4">Keamanan</h2>
          <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Setiap komponen dirancang untuk transparansi dan keamanan dana kamu.
          </p>
        </motion.div>

        {/* Trust cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {trustItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="rounded-xl bg-surface-container p-6 border border-outline-variant"
            >
              {/* Icon placeholder - using SVG instead of emoji */}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-container">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  {index === 0 && (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  )}
                  {index === 1 && (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  )}
                  {index === 2 && (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  )}
                </svg>
              </div>
              <h3 className="text-headline-sm text-on-surface font-semibold mb-2">{item.title}</h3>
              <p className="text-body-md text-on-surface-variant">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
