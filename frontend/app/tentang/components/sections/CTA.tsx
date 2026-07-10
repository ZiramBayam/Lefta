'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function CTA() {
  return (
    <section className="bg-primary-container py-24">
      <div className="mx-auto max-w-content px-margin-mobile">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-headline-md text-on-primary-container mb-6">
            Mulai kirim, semua kebagian.
          </h2>
          <p className="text-body-lg text-on-primary-container/80 max-w-xl mx-auto mb-8">
            Aplikasi sudah live di Stellar Testnet. Tidak perlu tunggu — coba sekarang dan rasakan sendiri kemudahan split otomatis.
          </p>
          <Link
            href="/send"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-8 py-4 text-label-lg text-white hover:bg-primary/90 transition-colors"
          >
            Mulai Kirim
            <span>→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
