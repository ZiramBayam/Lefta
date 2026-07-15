'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, X, Info, Sparkles, ChevronRight, XCircle, Copy, Check, CheckCircle2, HelpCircle, Lock, Home as HomeIcon, Briefcase, Hammer, GraduationCap, HeartPulse, RefreshCw, Layers } from 'lucide-react';
import { useLanguage } from '@/context/AppContext';

interface FoundClaim {
  id: string;
  sender: string;
  amount: number;
  currency: 'USDC' | 'XLM' | 'IDR';
  amountIdr: number;
  code: string;
  pin?: string;
  splits?: Array<{
    category: string;
    percentage: number;
    amount: number;
    amountIdr: number;
  }>;
}

interface ReceiptDrawerProps {
  showReceiptDrawer: boolean;
  resetClaimForm: () => void;
  foundClaim: FoundClaim | null;
  setFoundClaim: (claim: FoundClaim | null) => void;
  claimSuccess: boolean;
  receiptCode: string;
  setReceiptCode: (code: string) => void;
  claimSearchError: string;
  setClaimSearchError: (err: string) => void;
  handleSearchClaimCode: () => void;
  claimPinInput: string;
  setClaimPinInput: (pin: string) => void;
  claimPinError: string;
  setClaimPinError: (err: string) => void;
  isClaiming: boolean;
  executeClaim: () => void;
}

export function ReceiptDrawer({
  showReceiptDrawer,
  resetClaimForm,
  foundClaim,
  setFoundClaim,
  claimSuccess,
  receiptCode,
  setReceiptCode,
  claimSearchError,
  setClaimSearchError,
  handleSearchClaimCode,
  claimPinInput,
  setClaimPinInput,
  claimPinError,
  setClaimPinError,
  isClaiming,
  executeClaim
}: ReceiptDrawerProps) {
  const { t, language } = useLanguage();

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
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-secondary" />
                <h3 className="font-bold text-lg text-on-surface">{t('receipt.title')}</h3>
              </div>
              <button onClick={resetClaimForm} className="p-1.5 rounded-full bg-surface-container hover:bg-surface-container-high transition-all cursor-pointer">
                <X className="w-5 h-5 text-on-surface" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto no-scrollbar flex-1 flex flex-col gap-5">
              {!foundClaim && !claimSuccess && (
                <div className="flex flex-col gap-4 text-left">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('receipt.label_code')}</label>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      {t('receipt.step1_desc')}
                    </p>
                  </div>

                  {/* Code Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={language === 'ID' ? 'Contoh: LEFTA-SG-7721' : 'E.g., LEFTA-SG-7721'}
                      value={receiptCode}
                      onChange={(e) => {
                        setReceiptCode(e.target.value);
                        setClaimSearchError('');
                      }}
                      className="flex-1 px-4 py-3 bg-white rounded-xl border border-outline-variant/30 focus:border-primary focus:outline-none text-sm font-mono tracking-wider uppercase text-on-surface"
                    />
                    <button
                      onClick={handleSearchClaimCode}
                      className="px-5 bg-primary text-white font-bold rounded-xl text-xs hover:opacity-90 active:scale-95 transition-all flex items-center justify-center cursor-pointer uppercase"
                    >
                      {t('receipt.btn_search')}
                    </button>
                  </div>

                  {claimSearchError && (
                    <span className="text-xs text-error font-medium flex items-center gap-1.5 bg-error-container/20 p-3 rounded-lg leading-relaxed">
                      <XCircle className="w-5 h-5 text-error flex-shrink-0" /> {claimSearchError}
                    </span>
                  )}

                  {/* Quick demo codes suggestion */}
                  <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/15 flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-primary" /> Demo Codes
                    </span>
                    <div className="flex flex-col gap-1.5 text-xs text-on-surface">
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptCode('LEFTA-KAMPUNG-88');
                          setClaimSearchError('');
                        }}
                        className="text-left bg-white p-2 rounded border border-outline-variant/10 hover:bg-primary-container/10 transition-all flex justify-between items-center cursor-pointer"
                      >
                        <span className="font-mono font-bold text-primary">LEFTA-KAMPUNG-88</span>
                        <span className="text-[10px] text-on-surface-variant font-medium">Rp 775.000 (PIN: 8888)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptCode('LEFTA-IBU-USDC');
                          setClaimSearchError('');
                        }}
                        className="text-left bg-white p-2 rounded border border-outline-variant/10 hover:bg-primary-container/10 transition-all flex justify-between items-center cursor-pointer"
                      >
                        <span className="font-mono font-bold text-primary">LEFTA-IBU-USDC</span>
                        <span className="text-[10px] text-on-surface-variant font-medium">Rp 3.100.000 (PIN: 9999)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Claim Details Card */}
              {foundClaim && !claimSuccess && (
                <div className="flex flex-col gap-4 text-left">
                  <div className="bg-primary-container/10 border border-primary/20 rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-primary/10 pb-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">{t('receipt.sender_label')}</span>
                        <span className="text-base font-extrabold text-on-surface mt-0.5">{foundClaim.sender}</span>
                      </div>
                      <span className="text-[10px] bg-primary text-white font-bold font-mono px-2 py-1 rounded-full">
                        {foundClaim.code}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[11px] text-on-surface-variant font-bold">{t('receipt.total_idr_label')}</span>
                      <span className="text-2xl font-black text-primary mt-1">
                        Rp {foundClaim.amountIdr.toLocaleString(language === 'ID' ? 'id-ID' : 'en-US')} IDR
                      </span>
                      <span className="text-[11px] text-on-surface-variant mt-1">
                        (Setara {foundClaim.amount} {foundClaim.currency} • {language === 'ID' ? 'Kurs Jaringan Terkunci' : 'Network Exchange Rate Locked'})
                      </span>
                    </div>

                    <div className="bg-white/80 p-3 rounded-xl text-xs space-y-1.5 text-on-surface-variant">
                      <div className="flex justify-between text-on-surface font-semibold">
                        <span>Status</span>
                        <span className="text-emerald-600">Siap Dicairkan</span>
                      </div>
                      <p className="text-[10px] leading-relaxed">
                        {language === 'ID'
                          ? 'Dana ini telah diamankan oleh Smart Contract Stellar Anchor dan dapat langsung dicairkan ke saldo Rupiah dompet Anda atau dikirim ke Rekening Bank.'
                          : 'These funds have been secured by Stellar Anchor Smart Contracts and can be instantly withdrawn to your wallet IDR balance or sent to a Bank Account.'}
                      </p>
                    </div>
                  </div>

                  {/* Split allocation display on Claim screen */}
                  {foundClaim.splits && foundClaim.splits.length > 0 && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex flex-col gap-3">
                      <span className="text-[11px] font-extrabold text-amber-900 flex items-center gap-1.5 uppercase tracking-wide">
                        <Layers className="w-3.5 h-3.5 text-amber-600 animate-none" /> Alokasi Anggaran
                      </span>
                      <p className="text-[10px] text-amber-800 leading-normal">
                        {language === 'ID'
                          ? 'Pengirim membagi dana ini ke pos pengeluaran di bawah. Disarankan untuk membelanjakan sesuai peruntukannya demi kemandirian finansial keluarga.'
                          : 'The sender split these funds into the expense categories below. It is recommended to spend accordingly for family financial sustainability.'}
                      </p>
                      <div className="flex flex-col gap-2">
                        {foundClaim.splits.map((alloc) => (
                          <div key={alloc.category} className="bg-white/80 p-3 rounded-xl border border-outline-variant/10 flex flex-col gap-1.5 shadow-2xs">
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-1.5 font-bold text-on-surface">
                                {alloc.category === 'Kebutuhan Rumah Tangga' && <HomeIcon className="w-3.5 h-3.5 text-sky-600" />}
                                {alloc.category === 'Modal Usaha' && <Briefcase className="w-3.5 h-3.5 text-emerald-600" />}
                                {alloc.category === 'Renovasi Rumah' && <Hammer className="w-3.5 h-3.5 text-amber-600" />}
                                {alloc.category === 'Pendidikan Keluarga' && <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />}
                                {alloc.category === 'Dana Darurat & Kesehatan' && <HeartPulse className="w-3.5 h-3.5 text-rose-600" />}
                                <span>{getCategoryTranslation(alloc.category)}</span>
                              </div>
                              <span className="font-mono font-bold text-amber-800 bg-amber-500/10 px-2 py-0.5 rounded-md text-[10px]">{alloc.percentage}%</span>
                            </div>
                            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                              <div className="bg-amber-500 h-full" style={{ width: `${alloc.percentage}%` }} />
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-semibold">
                              <span>Rp {Math.round(alloc.amountIdr).toLocaleString(language === 'ID' ? 'id-ID' : 'en-US')} IDR</span>
                              <span>{alloc.amount.toFixed(2)} {foundClaim.currency}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Secure Claim PIN input for Option 1 */}
                  {foundClaim.pin && (
                    <div className="bg-amber-500/5 border border-amber-500/25 p-4 rounded-2xl flex flex-col gap-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5 text-left">
                          <Lock className="w-3.5 h-3.5 text-amber-600" /> {t('receipt.pin_label')}
                        </span>
                        <span className="text-[10px] text-amber-800 leading-normal text-left">
                          {t('receipt.pin_desc')}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="••••"
                          value={claimPinInput}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setClaimPinInput(val);
                            setClaimPinError('');
                          }}
                          className="w-full px-4 py-2.5 bg-white rounded-xl border border-outline-variant/30 text-center font-mono font-bold tracking-widest text-lg text-on-surface focus:border-amber-500 focus:outline-none"
                        />
                        {claimPinError && (
                          <span className="text-[10px] text-error font-semibold flex items-center gap-1 mt-0.5 text-left">
                            <XCircle className="w-3.5 h-3.5 font-bold text-error flex-shrink-0" /> {claimPinError}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Claim Action Selection */}
                  <div className="flex flex-col gap-2 mt-2">
                    <button
                      onClick={executeClaim}
                      disabled={isClaiming}
                      className="w-full py-4 bg-primary text-white font-bold rounded-xl active:scale-98 hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase"
                    >
                      {isClaiming ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" /> Memproses...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" /> {t('receipt.btn_claim')}
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        alert(language === 'ID'
                          ? 'Pencairan Bank: Menghubungkan ke API FinTech Bank Indonesia (Simulasi)...'
                          : 'Bank Withdrawal: Connecting to Bank Indonesia FinTech API (Simulation)...');
                        executeClaim();
                      }}
                      disabled={isClaiming}
                      className="w-full py-3.5 bg-surface-container text-on-surface font-bold rounded-xl text-xs hover:bg-surface-container-high transition-all cursor-pointer"
                    >
                      {language === 'ID' ? 'Cairkan ke Rekening Bank' : 'Disburse to Bank Account'}
                    </button>

                    <button
                      onClick={() => setFoundClaim(null)}
                      className="w-full py-2.5 text-on-surface-variant text-xs hover:underline text-center cursor-pointer"
                    >
                      {t('btn.back')}
                    </button>
                  </div>
                </div>
              )}

              {/* Claim Success Screen */}
              {claimSuccess && (
                <div className="flex flex-col gap-4 text-center py-6">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container mb-3 shadow-xs animate-pulse">
                      <Check className="w-8 h-8 stroke-[3]" />
                    </div>
                    <h4 className="text-lg font-bold text-primary">{t('receipt.step3_title')}</h4>
                    <p className="text-xs text-on-surface-variant mt-1">{t('receipt.step3_desc')}</p>
                  </div>

                  <div className="bg-white border border-outline-variant/20 rounded-xl p-4 text-left flex flex-col gap-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Metode</span>
                      <span className="font-bold text-on-surface">Instan IDR Wallet</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Jumlah Diterima</span>
                      <span className="font-bold text-emerald-600 text-sm">
                        Rp {foundClaim?.amountIdr.toLocaleString(language === 'ID' ? 'id-ID' : 'en-US')} IDR
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Dari Pengirim</span>
                      <span className="font-bold text-on-surface">{foundClaim?.sender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Kode Klaim</span>
                      <span className="font-mono text-on-surface font-semibold">{foundClaim?.code}</span>
                    </div>
                  </div>

                  <button
                    onClick={resetClaimForm}
                    className="w-full py-4 bg-primary text-white font-bold rounded-xl text-sm hover:opacity-90 active:scale-98 transition-all mt-4 cursor-pointer"
                  >
                    {language === 'ID' ? 'Selesai & Cek Saldo' : 'Done & Check Balance'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
