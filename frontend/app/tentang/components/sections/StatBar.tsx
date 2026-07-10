'use client';

import { motion } from 'framer-motion';

interface Stat {
  value: string;
  label: string;
}

const stats: Stat[] = [
  { value: '—', label: 'transfer selesai' },
  { value: '—', label: 'USDC ter-split' },
  { value: '—', label: 'detik rata-rata settlement' },
];

export function StatBar() {
  return (
    <section className="bg-surface-container py-16">
      <div className="mx-auto max-w-content px-margin-mobile">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-display-lg text-primary mb-2">{stat.value}</div>
              <div className="text-body-md text-on-surface-variant">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
