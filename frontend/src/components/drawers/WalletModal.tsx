'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, X, Check, Copy, QrCode, Settings, Coins } from 'lucide-react';
import { useLanguage } from '@/context/AppContext';

interface WalletModalProps {
  showWalletModal: boolean;
  setShowWalletModal: (show: boolean) => void;
  stellarAddress: string;
  setStellarAddress: (address: string) => void;
  addressInput: string;
  setAddressInput: (address: string) => void;
  isEditingAddress: boolean;
  setIsEditingAddress: (editing: boolean) => void;
  copiedAddress: boolean;
  handleCopyAddress: (address: string) => void;
  handleResetWalletCache: () => void;
  setShowDepositDrawer: (show: boolean) => void;
  setDepositStep: (step: 1 | 2 | 3) => void;
  setDepositAmount: (amount: string) => void;
  setDepositError: (error: string) => void;
}

export function WalletModal({
  showWalletModal,
  setShowWalletModal,
  stellarAddress,
  setStellarAddress,
  addressInput,
  setAddressInput,
  isEditingAddress,
  setIsEditingAddress,
  copiedAddress,
  handleCopyAddress,
  handleResetWalletCache,
  setShowDepositDrawer,
  setDepositStep,
  setDepositAmount,
  setDepositError,
}: WalletModalProps) {
  const { t, language } = useLanguage();

  return (
    <AnimatePresence>
      {showWalletModal && (
        <div id="wallet-modal-overlay" className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-surface w-full max-w-sm rounded-3xl overflow-hidden border border-outline-variant/30 shadow-2xl flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-outline-variant/10 bg-surface-container-low">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-primary" /> {t('wallet.title')}
              </span>
              <button
                onClick={() => setShowWalletModal(false)}
                className="p-1 rounded-full bg-surface-container hover:bg-surface-container-high cursor-pointer"
              >
                <X className="w-4 h-4 text-on-surface" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 flex flex-col gap-4">
              {/* Glowing Virtual Card */}
              <div className="bg-gradient-to-br from-primary via-primary/95 to-secondary text-white rounded-2xl p-4 flex flex-col justify-between h-[150px] relative overflow-hidden shadow-md">
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/70 font-semibold tracking-wider">{language === 'ID' ? 'KARTU DEBIT DEFI' : 'DEFI DEBIT CARD'}</span>
                    <span className="text-xs font-mono font-bold mt-0.5">LEFTA REMIT</span>
                  </div>
                  <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">L</div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-white/60 tracking-wider">{t('sidebar.address_label')}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs tracking-wider">
                      {stellarAddress.slice(0, 8)}...{stellarAddress.slice(-8)}
                    </span>
                    <button
                      onClick={() => handleCopyAddress(stellarAddress)}
                      className="hover:scale-110 active:scale-95 text-white/80 hover:text-white cursor-pointer"
                    >
                      {copiedAddress ? <Check className="w-3.5 h-3.5 text-primary-container" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Wallet QR Code Mockup */}
              <div className="flex items-center justify-center p-3 bg-surface-container-low rounded-2xl gap-3 border border-outline-variant/10">
                <QrCode className="w-12 h-12 stroke-[1.5] text-on-surface" />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-on-surface">{language === 'ID' ? 'Pindai QR Code' : 'Scan QR Code'}</span>
                  <p className="text-[10px] text-on-surface-variant max-w-[160px] leading-relaxed">
                    {language === 'ID'
                      ? 'Tunjukkan QR ini ke agen Lefta atau pengirim dari luar negeri untuk menerima dana instan.'
                      : 'Show this QR to a Lefta agent or international sender to receive instant funds.'}
                  </p>
                </div>
              </div>

              {/* Edit Stellar Address Section */}
              <div className="bg-surface-container border border-outline-variant/20 rounded-2xl p-4 flex flex-col gap-2.5 text-xs text-left">
                <span className="font-bold text-on-surface flex items-center gap-1">
                  <Settings className="w-4 h-4 text-primary" /> {language === 'ID' ? 'Pengaturan Akun & Dompet' : 'Account & Wallet Settings'}
                </span>
                <p className="text-[10px] text-on-surface-variant leading-relaxed">
                  {t('wallet.desc')}
                </p>

                {isEditingAddress ? (
                  <div className="flex flex-col gap-2 mt-1">
                    <input
                      type="text"
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      placeholder={language === 'ID' ? 'Masukkan alamat G...' : 'Enter G... address'}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-outline-variant/30 text-xs font-mono focus:outline-none focus:border-primary text-on-surface"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (!addressInput.trim() || !addressInput.startsWith('G') || addressInput.length < 25) {
                            alert(language === 'ID'
                              ? 'Alamat Stellar tidak valid. Harus dimulai dengan G dan minimal 25 karakter.'
                              : 'Invalid Stellar address. Must start with G and be at least 25 characters.');
                            return;
                          }
                          setStellarAddress(addressInput.trim());
                          setIsEditingAddress(false);
                        }}
                        className="flex-1 py-1.5 bg-primary text-white font-bold rounded-md text-[10px] hover:opacity-90 cursor-pointer"
                      >
                        {t('btn.save')}
                      </button>
                      <button
                        onClick={() => {
                          setAddressInput(stellarAddress);
                          setIsEditingAddress(false);
                        }}
                        className="flex-1 py-1.5 bg-surface-container-high text-on-surface font-bold rounded-md text-[10px] hover:bg-surface-container-highest cursor-pointer"
                      >
                        {t('btn.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAddressInput(stellarAddress);
                      setIsEditingAddress(true);
                    }}
                    className="w-full py-2 bg-white border border-outline-variant/30 text-on-surface font-bold rounded-lg text-[10px] hover:bg-surface-container-low transition-all cursor-pointer mt-1"
                  >
                    {t('wallet.btn_change')}
                  </button>
                )}
              </div>

              {/* Anchor Gateway Shortcut */}
              <button
                onClick={() => {
                  setShowWalletModal(false);
                  setDepositStep(1);
                  setDepositAmount('');
                  setDepositError('');
                  setShowDepositDrawer(true);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Coins className="w-4 h-4" /> {t('home.btn_deposit')}
              </button>

              {/* Reset Options */}
              <button
                onClick={handleResetWalletCache}
                className="w-full py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-lg text-[10px] transition-all uppercase tracking-wider cursor-pointer"
              >
                {t('wallet.btn_reset_desc')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
