'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ArrowDownLeft, Layers, ChevronDown, ChevronUp, Wallet } from 'lucide-react';
import { useLanguage, useExchangeRates } from '@/context/AppContext';
import { getRecipientTransfers, getTransferDetail } from '@/contracts/api';

interface ReceiptDrawerProps {
  showReceiptDrawer: boolean;
  setShowReceiptDrawer: (show: boolean) => void;
  stellarAddress: string;
}

export function ReceiptDrawer({
  showReceiptDrawer,
  setShowReceiptDrawer,
  stellarAddress,
}: ReceiptDrawerProps) {
  const { t, language } = useLanguage();
  const { USDC_TO_IDR } = useExchangeRates();
  const [address, setAddress] = useState(stellarAddress);
  const [transfers, setTransfers] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!address.trim() || !address.startsWith('G')) {
      setError('Masukkan alamat Stellar yang valid (mulai dengan G)');
      return;
    }
    setError('');
    setLoading(true);
    setTransfers(null);

    try {
      const ids = await getRecipientTransfers(address.trim());
      const details = await Promise.all(
        ids.map(async (id: string) => {
          const d = await getTransferDetail(typeof id === 'string' ? id : '');
          return d ? { ...d, id: typeof id === 'string' ? id : '' } : null;
        })
      );
      setTransfers(details.filter(Boolean));
    } catch {
      setError('Gagal mengambil data. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const getMySplit = (tx: any) => {
    if (!tx.splits) return null;
    if (tx.direct) return tx.splits[0];
    return tx.splits.find((s: any) =>
      s.recipient === address.trim() || s.stellarAddress === address.trim()
    );
  };

  const formatAmount = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    const display = Math.abs(num) >= 1_000_000
      ? (num / 1_000_000).toFixed(2)
      : num.toFixed(2);
    return `${display} USDC`;
  };

  const idrEquivalent = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    const display = Math.abs(num) >= 1_000_000 ? num / 1_000_000 : num;
    return (display * USDC_TO_IDR).toLocaleString(language === 'ID' ? 'id-ID' : 'en-US');
  };

  const normalizeSplit = (s: any) => ({
    address: s.recipient || s.stellarAddress || '',
    label: s.label || s.category || '',
    amount: typeof s.amount === 'bigint' ? Number(s.amount) : (parseFloat(s.amount) || 0),
    percentage: s.percentage || 0,
  });

  const getTotalAmount = (tx: any) => {
    if (tx.total_amount) {
      const t = typeof tx.total_amount === 'bigint' ? Number(tx.total_amount) : parseFloat(tx.total_amount);
      return t >= 1_000_000 ? t / 1_000_000 : t;
    }
    return tx.splits?.reduce((sum: number, s: any) => {
      const amt = typeof s.amount === 'bigint' ? Number(s.amount) : (parseFloat(s.amount) || 0);
      return sum + (amt >= 1_000_000 ? amt / 1_000_000 : amt);
    }, 0) || 0;
  };

  const getSplitPct = (s: any, tx: any) => {
    if (s.percentage) return s.percentage;
    const total = typeof tx.total_amount === 'bigint' ? Number(tx.total_amount) : (parseFloat(tx.total_amount) || 0);
    const amt = typeof s.amount === 'bigint' ? Number(s.amount) : (parseFloat(s.amount) || 0);
    if (total > 0) return Math.round((amt / total) * 100);
    return 0;
  };

  const toggleExpand = (id: string) => {
    setExpandedTx(expandedTx === id ? null : id);
  };

  return (
    <AnimatePresence>
      {showReceiptDrawer && (
        <motion.div
          id="receipt-drawer-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 backdrop-blur-xs"
        >
          <motion.div
            initial={{ y: "100%", scale: 1 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="bg-surface rounded-t-[32px] sm:rounded-3xl max-h-[92%] sm:max-h-[85%] w-full sm:max-w-md flex flex-col overflow-hidden border-t sm:border border-outline-variant/30 shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg text-on-surface">
                  {language === 'ID' ? 'Cek Penerimaan' : 'Check Receipt'}
                </h3>
              </div>
              <button onClick={() => { setShowReceiptDrawer(false); setTransfers(null); setError(''); }} className="p-1.5 rounded-full bg-surface-container hover:bg-surface-container-high transition-all cursor-pointer">
                <X className="w-5 h-5 text-on-surface" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto no-scrollbar flex-1 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase">
                  {language === 'ID' ? 'Alamat Stellar Penerima' : 'Recipient Stellar Address'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); setError(''); }}
                    placeholder="G..."
                    className="w-full px-4 py-3 bg-white rounded-xl border border-outline-variant/30 focus:border-primary focus:outline-none text-sm font-mono font-bold text-on-surface"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      loading
                        ? 'bg-primary/50 text-white cursor-not-allowed'
                        : 'bg-primary text-white hover:opacity-90 cursor-pointer'
                    }`}
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                    ) : (
                      language === 'ID' ? 'Cari' : 'Search'
                    )}
                  </button>
                </div>
                {error && (
                  <span className="text-xs text-error font-semibold bg-error-container/20 p-2 rounded-lg">{error}</span>
                )}
              </div>

              {transfers && transfers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant gap-2 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/30">
                  <Wallet className="w-10 h-10 stroke-1 text-outline" />
                  <p className="text-sm font-semibold">
                    {language === 'ID' ? 'Tidak ada penerimaan ditemukan' : 'No receipts found'}
                  </p>
                  <p className="text-xs text-center px-6">
                    {language === 'ID'
                      ? 'Alamat ini belum pernah menerima transfer melalui Lefta.'
                      : 'This address has not received any transfers via Lefta.'}
                  </p>
                </div>
              )}

              {transfers && transfers.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-on-surface-variant uppercase">
                    {language === 'ID' ? `${transfers.length} penerimaan ditemukan` : `${transfers.length} receipts found`}
                  </span>

                  {transfers.map((tx: any) => {
                    const mySplit = getMySplit(tx);
                    const isExpanded = expandedTx === tx.id;

                    return (
                      <div
                        key={tx.id}
                        className="bg-white border border-outline-variant/20 rounded-xl overflow-hidden shadow-xs"
                      >
                        <button
                          onClick={() => toggleExpand(tx.id)}
                          className="w-full p-4 flex items-center gap-3 hover:bg-surface-container-low transition-all text-left cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                            <ArrowDownLeft className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <span className="text-sm font-bold text-on-surface truncate">
                                {tx.sender ? `${tx.sender.slice(0, 4)}...${tx.sender.slice(-4)}` : 'Unknown'}
                              </span>
                              <span className="text-sm font-bold text-emerald-600 flex-shrink-0 ml-2">
                                {getTotalAmount(tx).toFixed(2)} USDC
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {mySplit && (() => {
                                const ns = normalizeSplit(mySplit);
                                return (
                                  <span className="text-[10px] font-semibold bg-primary-container text-on-primary-container px-1.5 py-0.5 rounded-full truncate max-w-[180px]">
                                    {ns.label} · {getSplitPct(mySplit, tx)}%
                                  </span>
                                );
                              })()}
                              <span className="text-[10px] text-on-surface-variant ml-auto">
                                {new Date(tx.timestamp).toLocaleDateString(language === 'ID' ? 'id-ID' : 'en-US')}
                              </span>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-on-surface-variant flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-on-surface-variant flex-shrink-0" />}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-0 border-t border-outline-variant/10 mx-4">
                            {/* My Allocation (highlighted) */}
                            {mySplit && (() => {
                              const ns = normalizeSplit(mySplit);
                              const pct = getSplitPct(mySplit, tx);
                              return (
                                <div className="mt-3 bg-primary-container/20 border border-primary/15 rounded-xl p-3">
                                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                                    {language === 'ID' ? 'Alokasi Saya' : 'My Allocation'}
                                  </span>
                                  <div className="flex justify-between items-center mt-1.5">
                                    <span className="text-sm font-bold text-on-surface">{ns.label}</span>
                                    <div className="text-right">
                                      <span className="text-sm font-extrabold text-primary">
                                        {formatAmount(ns.amount)}
                                      </span>
                                      <span className="text-[10px] text-on-surface-variant block">
                                        Rp {idrEquivalent(ns.amount)} IDR
                                      </span>
                                    </div>
                                  </div>
                                  <div className="mt-1.5 w-full bg-white rounded-full h-1.5">
                                    <div
                                      className="bg-primary h-1.5 rounded-full"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Full Breakdown */}
                            {tx.splits && tx.splits.length > 0 && (
                              <div className="mt-3">
                                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                                  <Layers className="w-3 h-3" /> {language === 'ID' ? 'Rincian Lengkap' : 'Full Breakdown'}
                                </span>
                                <div className="flex flex-col gap-1 mt-1.5">
                                  {tx.splits.map((s: any, i: number) => {
                                    const ns = normalizeSplit(s);
                                    const isMine = ns.address === address.trim();
                                    const pct = getSplitPct(s, tx);
                                    return (
                                      <div
                                        key={i}
                                        className={`flex justify-between items-center text-[10px] p-2 rounded-lg border ${
                                          isMine
                                            ? 'bg-primary-container/10 border-primary/20'
                                            : 'bg-surface-container-low border-outline-variant/10'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          {isMine && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                                          <span className={`font-semibold truncate ${isMine ? 'text-primary' : 'text-on-surface'}`}>
                                            {ns.label}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                          <span className={`font-mono font-bold ${isMine ? 'text-primary' : 'text-on-surface-variant'}`}>
                                            {pct}%
                                          </span>
                                          <span className="font-mono font-bold text-emerald-600">
                                            {formatAmount(ns.amount)}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Sender & Tx Info */}
                            <div className="mt-3 text-[10px] text-on-surface-variant bg-surface-container-low p-2.5 rounded-lg flex flex-col gap-1">
                              <div className="flex justify-between">
                                <span>{language === 'ID' ? 'Pengirim' : 'Sender'}</span>
                                <span className="font-mono font-semibold text-on-surface">
                                  {tx.sender ? `${tx.sender.slice(0, 6)}...${tx.sender.slice(-6)}` : '-'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>{language === 'ID' ? 'Waktu' : 'Time'}</span>
                                <span className="font-semibold text-on-surface">
                                  {new Date(tx.timestamp).toLocaleString(language === 'ID' ? 'id-ID' : 'en-US')}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>ID</span>
                                <span className="font-mono font-semibold text-on-surface truncate max-w-[120px]">{tx.id}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
