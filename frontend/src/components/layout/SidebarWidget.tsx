'use client';

import React from 'react';
import { Globe, Check, Copy, RefreshCw } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { useLanguage, useExchangeRates } from '@/context/AppContext';

interface SidebarWidgetProps {
  stellarAddress: string;
  copiedAddress: boolean;
  handleCopyAddress: (address: string) => void;
  handleResetWalletCache: () => void;
}

export function SidebarWidget({
  stellarAddress,
  copiedAddress,
  handleCopyAddress,
  handleResetWalletCache
}: SidebarWidgetProps) {
  const { t } = useLanguage();
  const { USDC_TO_IDR, XLM_TO_IDR, lastUpdated, isLoading, refetch } = useExchangeRates();
  const { network } = useWallet();

  return (
    <div id="desktop-sidebar-widget" className="hidden lg:block lg:col-span-4 w-full sticky top-24 space-y-4">
      <div className="bg-white border border-outline-variant/30 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="font-extrabold text-base text-on-surface uppercase tracking-wide">Kurs Real-Time</h3>
          </div>
          <button
            onClick={refetch}
            disabled={isLoading}
            className={`p-1.5 rounded-full bg-surface-container hover:bg-surface-container-high transition-all cursor-pointer ${isLoading ? 'animate-spin' : ''}`}
            title="Refresh rates"
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
          </button>
        </div>

        <div className="flex flex-col gap-3 text-xs">
          <div className="flex justify-between items-center bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/5">
            <span className="font-semibold text-on-surface-variant">1 USDC</span>
            <span className="font-bold text-on-surface">Rp {USDC_TO_IDR.toLocaleString('id-ID')} IDR</span>
          </div>
          <div className="flex justify-between items-center bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/5">
            <span className="font-semibold text-on-surface-variant">1 XLM</span>
            <span className="font-bold text-on-surface">Rp {XLM_TO_IDR.toLocaleString('id-ID')} IDR</span>
          </div>
          {lastUpdated && (
            <div className="text-[10px] text-on-surface-variant text-center">
              Updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <div className="flex justify-between items-center bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/5">
            <span className="font-semibold text-on-surface-variant">Jaringan</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Stellar {network === 'TESTNET' ? 'Testnet' : 'Mainnet'}
            </span>
          </div>
        </div>

        <div className="border-t border-outline-variant/10 pt-3 flex flex-col gap-2.5">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{t('sidebar.address_label')}</span>
          <div className="bg-surface-container p-2.5 rounded-xl border border-outline-variant/10 flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] text-on-surface select-all truncate">{stellarAddress}</span>
            <button
              onClick={() => handleCopyAddress(stellarAddress)}
              className="text-primary hover:scale-110 active:scale-95 flex-shrink-0 cursor-pointer"
            >
              {copiedAddress ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="border-t border-outline-variant/10 pt-3 flex flex-col gap-1.5">
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            {t('sidebar.system_desc')}
          </p>
          <button
            onClick={handleResetWalletCache}
            className="w-full py-2.5 bg-surface-container hover:bg-error-container hover:text-on-error-container text-on-surface font-bold rounded-lg text-[10px] transition-all cursor-pointer mt-1"
          >
            {t('wallet.btn_reset_btn')}
          </button>
        </div>
      </div>

      {/* Aesthetic Footer Branding inside Desktop Sidebar */}
      <div className="text-center text-xs text-on-surface-variant/60 flex flex-col gap-1 w-full p-2">
        <p className="font-bold">Lefta Web3 Remittance Indonesia</p>
        <p className="text-[10px]">Memajukan inklusi keuangan keluarga pekerja migran lewat Jaringan Stellar Blockchain.</p>
      </div>
    </div>
  );
}
