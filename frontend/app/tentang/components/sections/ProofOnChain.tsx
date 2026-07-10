'use client';

import { motion } from 'framer-motion';

interface ProofStep {
  number: string;
  title: string;
  description: string;
  txId?: string;
  explorerUrl?: string;
}

const proofSteps: ProofStep[] = [
  {
    number: '01',
    title: 'Template dibuat',
    description: 'Template pembagian disimpan di on-chain.',
  },
  {
    number: '02',
    title: 'Transfer dieksekusi',
    description: 'USDC dikirim dan di-split oleh smart contract.',
  },
  {
    number: '03',
    title: 'Dana diterima',
    description: 'Setiap recipient mendapat bagian sesuai template.',
  },
];

export function ProofOnChain() {
  return (
    <section id="bukti" className="bg-surface-container-lowest py-24">
      <div className="mx-auto max-w-content px-margin-mobile">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="text-headline-md text-on-surface mb-4">Proof, on-chain</h2>
          <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Setiap transaksi tercatat di Stellar blockchain dan bisa diverifikasi siapa saja.
          </p>
        </motion.div>

        {/* Proof steps */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {proofSteps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group rounded-xl bg-surface p-6 border border-outline hover:border-primary transition-colors"
            >
              {/* Step header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-white text-label-sm font-mono">
                  {step.number}
                </span>
                <h3 className="text-headline-sm text-on-surface font-semibold">
                  {step.title}
                </h3>
              </div>

              {/* Description */}
              <p className="text-body-md text-on-surface-variant mb-4">
                {step.description}
              </p>

              {/* Transaction link - placeholder */}
              {step.txId ? (
                <a
                  href={step.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-label-sm text-primary hover:underline"
                >
                  <span className="truncate max-w-[200px]">{step.txId}</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 text-label-sm text-on-surface-variant">
                  <span className="opacity-50">Coming soon — deploy in progress</span>
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
