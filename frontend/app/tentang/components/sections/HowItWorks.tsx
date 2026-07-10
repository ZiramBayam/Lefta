'use client';

import { motion } from 'framer-motion';

interface Step {
  number: string;
  title: string;
  description: string;
  contractRef?: string;
  featured?: boolean;
}

const steps: Step[] = [
  {
    number: '01',
    title: 'Buat Template',
    description: 'Sepakati sekali dengan keluarga: berapa persen ke kebutuhan harian, berapa ke tabungan, berapa ke modal usaha.',
    contractRef: 'TemplateRegistry.create_template',
  },
  {
    number: '02',
    title: 'Kirim USDC',
    description: 'Masukkan jumlah yang mau dikirim, pilih template yang sudah dibuat.',
    contractRef: 'SplitRouter.transfer',
  },
  {
    number: '03',
    title: 'Split Terjadi Otomatis',
    description: 'Smart contract membagi dana ke setiap wallet tujuan dalam satu transaksi, atomic — semua atau tidak sama sekali.',
    contractRef: 'SplitRouter.split',
    featured: true,
  },
  {
    number: '04',
    title: 'Keluarga Menerima',
    description: 'Setiap wallet penerima langsung mendapat bagian sesuai kesepakatan, tanpa perantara membagi ulang.',
    contractRef: 'SplitRouter.get_recipient_history',
  },
];

export function HowItWorks() {
  return (
    <section id="cara-kerja" className="bg-background py-24">
      <div className="mx-auto max-w-content px-margin-mobile">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="text-headline-md text-on-surface mb-4">Cara Kerja</h2>
          <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Empat langkah sederhana, tanpa perantara, tanpa penundaan.
          </p>
        </motion.div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              style={{
                minHeight: '280px',
                opacity: 1,
                maxHeight: 'none',
              }}
              className={`
                group relative flex flex-col rounded-2xl p-7
                bg-surface-container border border-outline-variant
                transition-all duration-300
                ${step.featured ? 'lg:col-span-2' : ''}
                hover:shadow-lg how-it-works-card
              `}
            >
              {/* Step number */}
              <span className="grid h-9 w-9 place-items-center rounded-full border border-outline bg-surface text-label-sm font-mono text-primary">
                {step.number}
              </span>

              {/* Title - always visible */}
              <h3 className="mt-auto text-headline-sm text-on-surface font-semibold">
                {step.title}
              </h3>

              {/* Detail content - reveal on hover */}
              <div className="step-detail">
                <p className="mt-4 text-body-md text-on-surface-variant leading-relaxed">
                  {step.description}
                </p>
                {step.contractRef && (
                  <div className="mt-6 border-t border-outline pt-4">
                    <span className="font-mono text-xs text-primary">
                      {step.contractRef}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Global styles for hover effect */}
      <style>{`
        .how-it-works-card .step-detail {
          opacity: 0;
          max-height: 0;
          overflow: hidden;
          transition: opacity 0.3s ease, max-height 0.3s ease;
        }

        @media (min-width: 769px) {
          .how-it-works-card:hover .step-detail {
            opacity: 1;
            max-height: 500px;
          }
        }

        @media (max-width: 768px) {
          .how-it-works-card .step-detail {
            opacity: 1;
            max-height: none;
          }
        }
      `}</style>
    </section>
  );
}
