'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, X, Info, Sparkles, ChevronRight, XCircle, Copy, Check, CheckCircle2 } from 'lucide-react';
import { useLanguage, useExchangeRates } from '@/context/AppContext';

interface DepositDrawerProps {
  showDepositDrawer: boolean;
  depositAmount: string;
  setDepositAmount: (amount: string) => void;
  depositStep: 1 | 2 | 3;
  setDepositStep: (step: 1 | 2 | 3) => void;
  depositError: string;
  setDepositError: (error: string) => void;
  executeDeposit: () => void;
  confirmDepositPayment: () => void;
  handleInstantDeposit1000: () => void;
  resetDepositForm: () => void;
  isDepositing?: boolean;
  depositTxHash?: string;
}

export function DepositDrawer({
  showDepositDrawer,
  depositAmount,
  setDepositAmount,
  depositStep,
  setDepositStep,
  depositError,
  setDepositError,
  executeDeposit,
  confirmDepositPayment,
  handleInstantDeposit1000,
  resetDepositForm,
  isDepositing = false,
  depositTxHash = ''
}: DepositDrawerProps) {
  const { t, language } = useLanguage();
  const { USDC_TO_IDR } = useExchangeRates();
  const depositAsset = 'USDC' as const;

  return (
    <AnimatePresence>
      {showDepositDrawer && (
        <motion.div
          id="deposit-drawer-overlay"
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
                <Coins className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-lg text-on-surface">{t('deposit.title')}</h3>
              </div>
              <button onClick={resetDepositForm} className="p-1.5 rounded-full bg-surface-container hover:bg-surface-container-high transition-all cursor-pointer">
                <X className="w-5 h-5 text-on-surface" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto no-scrollbar flex-1 flex flex-col gap-5">

              {/* Step 1: Input Amount & Asset */}
              {depositStep === 1 && (
                <div className="flex flex-col gap-4">
                  <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-2xl flex gap-3 text-xs text-emerald-800">
                    <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="font-bold">{language === 'ID' ? 'Informasi Deposit' : 'Deposit Information'}</span>
                      <p className="leading-relaxed text-on-surface-variant">
                        {t('deposit.step1_desc')}
                      </p>
                    </div>
                  </div>

                  {/* Quick Instant Testnet Faucet Trigger */}
                  <div className="bg-primary-container/10 border border-primary/20 p-4 rounded-2xl flex flex-col gap-2.5">
                    <div className="flex justify-between items-start text-left">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-primary flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> {language === 'ID' ? 'TESTNET FAUCET GRATIS' : 'FREE TESTNET FAUCET'}
                        </span>
                        <p className="text-[10px] text-on-surface-variant mt-0.5 leading-relaxed">
                          {language === 'ID'
                            ? 'Mau coba kirim remitansi langsung? Isi dompet Anda dengan 1.000 USDC instan secara gratis.'
                            : 'Want to try sending direct remittances? Top up your wallet with 1,000 instant USDC for free.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleInstantDeposit1000}
                      className="w-full py-2.5 bg-primary hover:bg-primary-hover active:scale-98 transition-all text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Coins className="w-4 h-4" /> {t('deposit.btn_instant_testnet')}
                    </button>
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-outline-variant/20"></div>
                    <span className="flex-shrink mx-3 text-[10px] font-black text-on-surface-variant bg-surface px-2 uppercase">
                      {language === 'ID' ? 'ATAU MASUKKAN MANUAL' : 'OR ENTER MANUALLY'}
                    </span>
                    <div className="flex-grow border-t border-outline-variant/20"></div>
                  </div>

                  {/* Asset info - USDC only */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">{t('deposit.asset_label')}:</label>
                    <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-sm font-bold text-emerald-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Stellar Dollar (USDC)
                    </div>
                  </div>

                  {/* Input Amount */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">{t('deposit.step1_title')} ({depositAsset}):</label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder={language === 'ID' ? 'Contoh: 100' : 'E.g., 100'}
                        value={depositAmount}
                        onChange={(e) => {
                          setDepositAmount(e.target.value);
                          setDepositError('');
                        }}
                        className="w-full px-4 py-3 bg-white rounded-xl border border-outline-variant/30 focus:border-emerald-600 focus:outline-none text-sm font-bold text-on-surface"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded">
                        {depositAsset}
                      </span>
                    </div>
                    {depositAmount && !isNaN(parseFloat(depositAmount)) && (
                      <span className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                        {t('home.equivalent_idr', { val: (parseFloat(depositAmount) * USDC_TO_IDR).toLocaleString(language === 'ID' ? 'id-ID' : 'en-US') })}
                      </span>
                    )}
                  </div>

                  {/* Presets Grid */}
                  <div className="flex flex-wrap gap-1.5">
                    {[10, 50, 100, 250, 500].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setDepositAmount(val.toString());
                          setDepositError('');
                        }}
                        className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high rounded-lg text-xs font-bold text-on-surface transition-all cursor-pointer"
                      >
                        +{val} {depositAsset}
                      </button>
                    ))}
                  </div>

                  {depositError && (
                    <span className="text-xs text-error font-semibold flex items-center gap-1 bg-error-container/20 p-2.5 rounded-lg">
                      <XCircle className="w-4 h-4 text-error" /> {depositError}
                    </span>
                  )}

                  {/* Submit form */}
                  <button
                    onClick={executeDeposit}
                    className="w-full py-4 bg-emerald-600 text-white font-extrabold rounded-xl active:scale-98 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer text-xs uppercase"
                  >
                    {t('deposit.btn_next')} <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Step 2: Payment Simulation (Virtual Account / QRIS) */}
              {depositStep === 2 && (
                <div className="flex flex-col gap-4">
                  <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 flex flex-col gap-3 text-left">
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">{t('deposit.step2_title')}</span>

                    <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                      <span className="text-xs text-on-surface-variant font-medium">{t('deposit.label_amount')}</span>
                      <span className="text-base font-extrabold text-on-surface">
                        Rp {(parseFloat(depositAmount) * USDC_TO_IDR).toLocaleString(language === 'ID' ? 'id-ID' : 'en-US')} IDR
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                      <span className="text-xs text-on-surface-variant font-medium">{language === 'ID' ? 'Nilai Deposit' : 'Deposit Value'}</span>
                      <span className="text-sm font-bold text-primary">
                        {depositAmount} USDC
                      </span>
                    </div>

                    {/* Payment Method Option */}
                    <div className="flex flex-col gap-1.5 py-1">
                      <span className="text-[10px] text-on-surface-variant font-bold uppercase">{t('deposit.va_label')}</span>
                      <div className="bg-white p-3 rounded-xl border border-outline-variant/15 flex justify-between items-center font-mono text-sm font-bold">
                        <span>8856 0812 3456 7890</span>
                        <button
                          onClick={() => navigator.clipboard.writeText('8856081234567890')}
                          className="text-primary hover:scale-110 active:scale-95 cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[10px] text-on-surface-variant leading-relaxed">
                      {t('deposit.step2_desc')}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={confirmDepositPayment}
                      disabled={isDepositing}
                      className={`w-full py-4 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 uppercase ${
                        isDepositing
                          ? 'bg-emerald-400 text-white cursor-not-allowed'
                          : 'bg-emerald-600 text-white active:scale-98 hover:bg-emerald-700 cursor-pointer'
                      } transition-all`}
                    >
                      {isDepositing ? (
                        <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Mengirim...</>
                      ) : (
                        <><Check className="w-5 h-5" /> {t('deposit.btn_confirm')}</>
                      )}
                    </button>
                    <button
                      onClick={() => setDepositStep(1)}
                      className="w-full py-2.5 bg-surface-container text-on-surface-variant font-bold text-xs rounded-xl hover:bg-surface-container-high transition-all cursor-pointer"
                    >
                      {t('btn.back')}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Success Screen */}
              {depositStep === 3 && (
                <div className="flex flex-col items-center justify-center text-center gap-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div className="flex flex-col">
                    <h4 className="text-lg font-black text-on-surface">{t('deposit.step3_title')}</h4>
                    <p className="text-xs text-on-surface-variant mt-1 px-4 leading-relaxed">
                      {language === 'ID'
                        ? `Dana sebesar ${depositAmount} USDC telah sukses ditambahkan ke saldo dompet Stellar Anda.`
                        : `Funds of ${depositAmount} USDC have been successfully added to your Stellar wallet.`}
                    </p>
                  </div>

                  {/* Details Receipt */}
                  <div className="w-full bg-surface-container-low p-4 rounded-2xl border border-outline-variant/15 text-left text-xs flex flex-col gap-2 mt-1">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">{language === 'ID' ? 'Metode' : 'Method'}</span>
                      <span className="font-bold text-on-surface">Faucet Testnet (On-Chain)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">{language === 'ID' ? 'Nominal Terkredit' : 'Credited Amount'}</span>
                      <span className="font-bold text-emerald-600">{depositAmount} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">{language === 'ID' ? 'Rupiah Terbayar' : 'Rupiah Paid'}</span>
                      <span className="font-bold text-on-surface">
                        Rp {(parseFloat(depositAmount) * USDC_TO_IDR).toLocaleString(language === 'ID' ? 'id-ID' : 'en-US')} IDR
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Stellar Ledger Hash</span>
                      <span className="font-mono text-[9px] text-primary truncate max-w-[150px]">
                        {depositTxHash ? depositTxHash.substring(0, 20) + '...' : 'Memproses...'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={resetDepositForm}
                    className="w-full py-4 bg-primary text-white font-bold rounded-xl text-sm hover:opacity-90 active:scale-98 transition-all mt-3 cursor-pointer"
                  >
                    {language === 'ID' ? 'Selesai' : 'Done'}
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
