'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, ArrowDownLeft, Layers, Check, Copy, ExternalLink } from 'lucide-react';
import { Transaction } from '@/lib/types';
import { useLanguage } from '@/context/AppContext';

interface TransactionDetailModalProps {
  selectedTx: Transaction | null;
  setSelectedTx: (tx: Transaction | null) => void;
  copiedHash: string | null;
  handleCopyHash: (hash: string) => void;
  getStatusBadge: (status: 'Success' | 'Pending' | 'Failed') => React.ReactNode;
}

export function TransactionDetailModal({
  selectedTx,
  setSelectedTx,
  copiedHash,
  handleCopyHash,
  getStatusBadge
}: TransactionDetailModalProps) {
  const { t, language } = useLanguage();
  const [showVerifyModal, setShowVerifyModal] = React.useState(false);

  const getCategoryTranslation = (catName: string) => {
    switch (catName) {
      case 'Kebutuhan Rumah Tangga':
        return t('cat.household');
      case 'Modal Usaha':
        return t('cat.business');
      case 'Renovasi Rumah':
        return t('cat.renovation');
      case 'Pendidikan Keluarga':
        return t('cat.education');
      case 'Dana Darurat & Kesehatan':
        return t('cat.emergency');
      default:
        return catName;
    }
  };

  return (
    <>
      <AnimatePresence>
        {selectedTx && (
          <div id="tx-detail-modal-overlay" className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface w-full max-w-sm rounded-3xl overflow-hidden border border-outline-variant/30 shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center px-4 py-3 border-b border-outline-variant/10 bg-surface-container-low">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{t('tx.title')}</span>
                <button onClick={() => setSelectedTx(null)} className="p-1 rounded-full bg-surface-container hover:bg-surface-container-high cursor-pointer">
                  <X className="w-4 h-4 text-on-surface" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 flex flex-col gap-4">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    selectedTx.type === 'sent' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {selectedTx.type === 'sent' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
                  </div>
                  <span className="text-2xl font-black text-on-surface">
                    {selectedTx.type === 'sent' ? '-' : '+'}{selectedTx.amount} {selectedTx.currency}
                  </span>
                  <span className="text-xs text-primary font-bold mt-0.5">
                    Rp {selectedTx.amountIdr.toLocaleString(language === 'ID' ? 'id-ID' : 'en-US')} IDR
                  </span>
                  <div className="mt-2.5">
                    {getStatusBadge(selectedTx.status)}
                  </div>
                </div>

                <div className="bg-surface-container-low rounded-xl p-3 text-xs flex flex-col gap-2 text-on-surface-variant">
                  <div className="flex justify-between">
                    <span>{language === 'ID' ? 'Waktu' : 'Time'}</span>
                    <span className="font-medium text-on-surface">
                      {new Date(selectedTx.timestamp).toLocaleString(language === 'ID' ? 'id-ID' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'ID' ? 'ID Transaksi' : 'Transaction ID'}</span>
                    <span className="font-mono font-semibold text-on-surface">{selectedTx.id}</span>
                  </div>
                  <div className="flex flex-col border-t border-outline-variant/10 pt-2 mt-1 gap-1">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      {selectedTx.type === 'sent' ? t('tx.to') : t('tx.from')}
                    </span>
                    <span className="font-mono text-[10px] text-on-surface bg-white p-1.5 rounded border border-outline-variant/10 overflow-x-auto whitespace-pre-wrap select-all">
                      {selectedTx.type === 'sent' ? selectedTx.destinationAddress : selectedTx.sourceAddress}
                    </span>
                  </div>
                  {selectedTx.notes && (
                    <div className="flex flex-col border-t border-outline-variant/10 pt-2 mt-1 gap-1">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{t('tx.memo')}</span>
                      <span className="text-on-surface italic">"{selectedTx.notes}"</span>
                    </div>
                  )}
                  {selectedTx.splits && selectedTx.splits.length > 0 && (
                    <div className="flex flex-col border-t border-outline-variant/10 pt-2 mt-1 gap-1.5">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                        <Layers className="w-3 h-3 text-primary" /> {t('tx.splits')}
                      </span>
                      <div className="flex flex-col gap-1 mt-0.5">
                        {selectedTx.splits.map(alloc => (
                          <div key={alloc.category} className="flex justify-between items-center text-[10px] bg-white p-1.5 rounded border border-outline-variant/10">
                            <span className="font-semibold text-on-surface">{getCategoryTranslation(alloc.category)}</span>
                            <span className="font-mono text-primary font-bold">{alloc.percentage}% (Rp {Math.round(alloc.amountIdr).toLocaleString(language === 'ID' ? 'id-ID' : 'en-US')})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col border-t border-outline-variant/10 pt-2 mt-1 gap-1">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Stellar Ledger Hash</span>
                    <span className="font-mono text-[9px] text-primary flex items-center gap-1">
                      {selectedTx.txHash}
                      <button onClick={() => handleCopyHash(selectedTx.txHash)} className="hover:scale-110 active:scale-95 cursor-pointer">
                        {copiedHash === selectedTx.txHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowVerifyModal(true)}
                  className="w-full py-2.5 bg-primary text-white font-bold rounded-xl text-xs hover:opacity-90 transition-all cursor-pointer"
                >
                  {language === 'ID' ? 'Verifikasi di Jaringan Stellar' : 'Verify on Stellar Network'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Blockchain Verification Modal */}
      <AnimatePresence>
        {showVerifyModal && selectedTx && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-xs"
            onClick={() => setShowVerifyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-surface w-full max-w-sm rounded-3xl overflow-hidden border border-outline-variant/30 shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center px-5 py-4 border-b border-outline-variant/10 bg-primary-container/30">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔗</span>
                  <span className="font-bold text-sm text-on-surface">{language === 'ID' ? 'Verifikasi Blockchain' : 'Blockchain Verification'}</span>
                </div>
                <button onClick={() => setShowVerifyModal(false)} className="p-1 rounded-full hover:bg-surface-container cursor-pointer">
                  <X className="w-4 h-4 text-on-surface" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {language === 'ID' ? 'Transaction Hash' : 'Transaction Hash'}
                  </span>
                  <div className="bg-surface-container-low rounded-xl p-3 font-mono text-[10px] text-on-surface break-all leading-relaxed border border-outline-variant/10">
                    {selectedTx.txHash}
                  </div>
                </div>

                <div className="text-xs text-on-surface-variant bg-surface-container-low rounded-xl p-3">
                  <p className="font-semibold mb-1">{language === 'ID' ? 'Tentang Verifikasi:' : 'About Verification:'}</p>
                  <p>{language === 'ID'
                    ? 'Hash ini adalah identitas unik transaksi di jaringan Stellar. Kamu bisa memverifikasi status dan detail transaksi di explorer blockchain.'
                    : 'This hash is the unique identifier of your transaction on the Stellar network. You can verify the status and details on the blockchain explorer.'
                  }</p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${selectedTx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-primary text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {language === 'ID' ? 'Buka Stellar Expert Explorer' : 'Open Stellar Expert Explorer'}
                  </a>
                  <button
                    onClick={() => {
                      handleCopyHash(selectedTx.txHash);
                    }}
                    className="w-full py-3 bg-surface-container text-on-surface font-semibold rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-surface-container-high transition-all cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    {language === 'ID' ? 'Salin Hash' : 'Copy Hash'}
                  </button>
                  <button
                    onClick={() => setShowVerifyModal(false)}
                    className="w-full py-3 bg-surface-container-low text-on-surface-variant font-medium rounded-xl text-xs hover:bg-surface-container transition-all cursor-pointer"
                  >
                    {language === 'ID' ? 'Tutup' : 'Close'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
