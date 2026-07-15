'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, TrendingUp, ArrowUpRight, Receipt, Coins, Info } from 'lucide-react';
import { WalletBalances } from '@/lib/types';
import { useLanguage, useExchangeRates } from '@/context/AppContext';

interface HomeTabProps {
  balances: WalletBalances;
  isSyncing: boolean;
  syncStatus: 'idle' | 'success' | 'error';
  detectedNetwork: 'Testnet' | 'Mainnet' | 'Simulated';
  syncStellarBalances: () => void;
  setSendStep: (step: number) => void;
  setShowSendDrawer: (show: boolean) => void;
  setFoundClaim: (claim: any) => void;
  setReceiptCode: (code: string) => void;
  setShowReceiptDrawer: (show: boolean) => void;
  setDepositStep: (step: 1 | 2 | 3) => void;
  setDepositAmount: (amount: string) => void;
  setDepositError: (error: string) => void;
  setShowDepositDrawer: (show: boolean) => void;
}

export function HomeTab({
  balances,
  isSyncing,
  syncStatus,
  detectedNetwork,
  syncStellarBalances,
  setSendStep,
  setShowSendDrawer,
  setFoundClaim,
  setReceiptCode,
  setShowReceiptDrawer,
  setDepositStep,
  setDepositAmount,
  setDepositError,
  setShowDepositDrawer
}: HomeTabProps) {
  const { t, language } = useLanguage();
  const { USDC_TO_IDR } = useExchangeRates();

  return (
    <motion.div
      id="home-tab-container"
      key="home-tab"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-6"
    >
      {/* Balance Header */}
      <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-on-surface-variant font-medium tracking-wide">{t('home.available_balance')}</span>
            <button
              type="button"
              onClick={() => syncStellarBalances()}
              disabled={isSyncing}
              className={`p-1 hover:bg-surface-container active:scale-90 transition-all text-primary rounded-full cursor-pointer flex items-center justify-center ${isSyncing ? 'animate-spin opacity-50' : ''}`}
              title={t('home.sync_tooltip')}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            {syncStatus === 'success' && (
              <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded animate-pulse">{t('home.sync_live')}</span>
            )}
            {syncStatus === 'error' && (
              <span className="text-[9px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded animate-pulse font-mono">{t('home.sync_offline')}</span>
            )}
          </div>
          <span className="text-[10px] bg-secondary-container text-on-secondary-container font-semibold px-2 py-0.5 rounded-full">
            {detectedNetwork === 'Simulated' ? t('network.simulated') : `Stellar ${detectedNetwork}`}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-bold tracking-tight text-on-surface">
            {balances.USDC.toLocaleString(language === 'ID' ? 'id-ID' : 'en-US', { minimumFractionDigits: 2 })} <span className="text-lg font-semibold text-primary">USDC</span>
          </span>
          <span className="text-xs text-on-surface-variant mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-primary" /> {t('home.equivalent_idr', { val: (balances.USDC * USDC_TO_IDR + balances.IDR).toLocaleString(language === 'ID' ? 'id-ID' : 'en-US') })}
          </span>
        </div>
        <div className="h-px bg-outline-variant/20 my-1"></div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between items-center bg-white/50 p-2 rounded-lg">
            <span className="text-on-surface-variant">XLM</span>
            <span className="font-bold text-on-surface">{balances.XLM} XLM</span>
          </div>
          <div className="flex justify-between items-center bg-white/50 p-2 rounded-lg">
            <span className="text-on-surface-variant">{language === 'ID' ? 'Rupiah' : 'Rupiah (IDR)'}</span>
            <span className="font-bold text-on-surface">Rp {balances.IDR.toLocaleString(language === 'ID' ? 'id-ID' : 'en-US')}</span>
          </div>
        </div>
      </div>

      {/* Main Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Send Button ("Kirim") */}
        <button
          onClick={() => {
            setSendStep(1);
            setShowSendDrawer(true);
          }}
          className="w-full h-[145px] bg-primary-container text-on-primary-container rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-surface-container-high active:scale-95 transition-all duration-200 shadow-sm group relative overflow-hidden border border-primary/10 cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-14 h-14 rounded-full bg-white/30 flex items-center justify-center group-hover:-translate-y-1 transition-transform duration-300">
            <ArrowUpRight className="w-7 h-7 text-on-primary-container" />
          </div>
          <span className="font-bold text-base">{t('home.btn_send')}</span>
        </button>

        {/* Check Receipts Button ("Cek Penerimaan") */}
        <button
          onClick={() => {
            setFoundClaim(null);
            setReceiptCode('');
            setShowReceiptDrawer(true);
          }}
          className="w-full h-[145px] bg-surface-container text-on-surface rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-surface-container-high active:scale-95 transition-all duration-200 shadow-sm group relative overflow-hidden border border-outline-variant/20 cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-14 h-14 rounded-full bg-white/70 flex items-center justify-center group-hover:-translate-y-1 transition-transform duration-300">
            <Receipt className="w-7 h-7 text-secondary" />
          </div>
          <span className="font-bold text-base">{t('home.btn_check')}</span>
        </button>

        {/* Deposit Button ("Isi Saldo") */}
        <button
          onClick={() => {
            setDepositStep(1);
            setDepositAmount('');
            setDepositError('');
            setShowDepositDrawer(true);
          }}
          className="w-full h-[145px] bg-emerald-50 text-emerald-800 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-emerald-100/50 active:scale-95 transition-all duration-200 shadow-sm group relative overflow-hidden border border-emerald-100 cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center group-hover:-translate-y-1 transition-transform duration-300">
            <Coins className="w-7 h-7 text-emerald-600" />
          </div>
          <span className="font-bold text-base">{t('home.btn_deposit')}</span>
        </button>
      </div>

      {/* Info Tip / Education Banner */}
      <div className="bg-tertiary-container/20 border border-tertiary/20 rounded-2xl p-4 text-xs text-on-tertiary-container flex gap-3 text-left">
        <Info className="w-5 h-5 text-tertiary flex-shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <span className="font-bold text-on-surface">{t('home.edu_title')}</span>
          <p className="leading-relaxed text-on-surface-variant">
            {t('home.edu_desc')}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
