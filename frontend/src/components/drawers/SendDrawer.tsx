'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, X, Search, ChevronRight, XCircle, Info, Wallet,
  Layers, Sparkles, Home as HomeIcon, Briefcase, Hammer, GraduationCap, 
  HeartPulse, CheckCircle2, Key, Share2 
} from 'lucide-react';
import { Contact, WalletBalances } from '@/lib/types';
import { useLanguage, useExchangeRates } from '@/context/AppContext';

interface BudgetSplit {
  category: string;
  percentage: number;
}

interface BudgetTemplate {
  id: string;
  name: string;
  isCustom?: boolean;
  allocations: BudgetSplit[];
}

interface SendDrawerProps {
  showSendDrawer: boolean;
  resetSendForm: () => void;
  sendStep: number;
  setSendStep: (step: number) => void;
  contactSearch: string;
  setContactSearch: (search: string) => void;
  contacts: Contact[];
  selectedContact: Contact | null;
  setSelectedContact: (contact: Contact | null) => void;
  customAddress: string;
  setCustomAddress: (address: string) => void;
  addressError: string;
  handleNextToAmount: () => void;
  amountError: string;
  setAmountError: (error: string) => void;
  balances: WalletBalances;
  sendAmount: string;
  setSendAmount: (amount: string) => void;
  sendNotes: string;
  setSendNotes: (notes: string) => void;
  isSplitActive: boolean;
  setIsSplitActive: (active: boolean) => void;
  budgetTemplates: BudgetTemplate[];
  setBudgetTemplates: React.Dispatch<React.SetStateAction<BudgetTemplate[]>>;
  splitPreset: string;
  setSplitPreset: (preset: string) => void;
  splitAllocations: BudgetSplit[];
  setSplitAllocations: React.Dispatch<React.SetStateAction<BudgetSplit[]>>;
  showSaveTemplateForm: boolean;
  setShowSaveTemplateForm: (show: boolean) => void;
  newTemplateName: string;
  setNewTemplateName: (name: string) => void;
  templateSaveSuccess: string;
  setTemplateSaveSuccess: (success: string) => void;
  handleNextToConfirm: () => void;
  executeSendTransaction: () => void;
  isSending: boolean;
  stellarAddress: string;
  copiedHash: string | null;
  handleCopyHash: (hash: string) => void;
}

export function SendDrawer({
  showSendDrawer,
  resetSendForm,
  sendStep,
  setSendStep,
  contactSearch,
  setContactSearch,
  contacts,
  selectedContact,
  setSelectedContact,
  customAddress,
  setCustomAddress,
  addressError,
  handleNextToAmount,
  amountError,
  setAmountError,
  balances,
  sendAmount,
  setSendAmount,
  sendNotes,
  setSendNotes,
  isSplitActive,
  setIsSplitActive,
  budgetTemplates,
  setBudgetTemplates,
  splitPreset,
  setSplitPreset,
  splitAllocations,
  setSplitAllocations,
  showSaveTemplateForm,
  setShowSaveTemplateForm,
  newTemplateName,
  setNewTemplateName,
  templateSaveSuccess,
  setTemplateSaveSuccess,
  handleNextToConfirm,
  executeSendTransaction,
  isSending,
  stellarAddress,
  copiedHash,
  handleCopyHash
}: SendDrawerProps) {
  const { t, language } = useLanguage();
  const { USDC_TO_IDR } = useExchangeRates();
  const sendAsset = 'USDC' as const;
  const [showShareModal, setShowShareModal] = React.useState(false);

  // Bangun teks pesan WA
  const buildWhatsAppText = () => {
    const recipientName = selectedContact ? selectedContact.name : 'keluarga';
    const amountIDR = (parseFloat(sendAmount) * USDC_TO_IDR).toLocaleString('id-ID');
    let msg = `✅ *Kiriman Uang via Lefta*\n\nHalo ${recipientName}! Saya baru saja kirim *${sendAmount} USDC* (≈ Rp ${amountIDR}) langsung ke wallet Stellar-mu.`;
    if (isSplitActive) {
      msg += `\n\n📊 *Rincian Alokasi:*`;
      splitAllocations.filter(a => a.percentage > 0).forEach(alloc => {
        const itemAmt = (parseFloat(sendAmount) * alloc.percentage) / 100;
        const itemIdr = (itemAmt * USDC_TO_IDR).toLocaleString('id-ID');
        msg += `\n• ${alloc.category}: ${alloc.percentage}% (${itemAmt.toFixed(2)} USDC / Rp ${itemIdr})`;
      });
    }
    if (sendNotes) msg += `\n\n💬 Pesan: "${sendNotes}"`;
    msg += `\n\n_Dikirim via Lefta — Web3 Remittance untuk keluarga Indonesia 🇮🇩_`;
    return msg;
  };

  return (
    <AnimatePresence>
      {showSendDrawer && (
        <motion.div 
          id="send-drawer-overlay"
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
            className="bg-surface rounded-t-[32px] sm:rounded-3xl max-h-[92%] sm:max-h-[85%] w-full sm:max-w-lg flex flex-col overflow-hidden border-t sm:border border-outline-variant/30 shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg text-on-surface">{t('send.title')}</h3>
              </div>
              <button onClick={resetSendForm} className="p-1.5 rounded-full bg-surface-container hover:bg-surface-container-high transition-all cursor-pointer">
                <X className="w-5 h-5 text-on-surface" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto no-scrollbar flex-1 flex flex-col gap-6">
              {/* Step 1: Destination Selection */}
              {sendStep === 1 && (
                <div className="flex flex-col gap-4">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('send.step1_title')}</span>
                  
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                    <input
                      type="text"
                      placeholder="Cari kontak keluarga..."
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-surface-container rounded-xl border border-outline-variant/10 focus:border-primary focus:outline-none text-sm text-on-surface"
                    />
                  </div>

                  {/* Contacts List */}
                  <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto no-scrollbar">
                    {contacts
                      .filter(c => c.name.toLowerCase().includes(contactSearch.toLowerCase()))
                      .map(contact => (
                        <div
                          key={contact.address}
                          onClick={() => {
                            setSelectedContact(contact);
                            setCustomAddress('');
                          }}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                            selectedContact?.address === contact.address
                              ? 'bg-primary-container/20 border-primary shadow-xs'
                              : 'bg-white border-outline-variant/15 hover:bg-surface-container-low'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full ${contact.avatarColor} text-white flex items-center justify-center font-bold text-sm`}>
                              {contact.name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-on-surface">{contact.name}</span>
                              <span className="text-[10px] text-on-surface-variant">{contact.relation}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                              {contact.address.slice(0, 4)}...{contact.address.slice(-4)}
                            </span>
                          </div>
                        </div>
                    ))}
                  </div>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-outline-variant/20"></div>
                    <span className="flex-shrink mx-4 text-xs font-semibold text-on-surface-variant bg-surface px-2">ATAU MASUKKAN ALAMAT STELLAR</span>
                    <div className="flex-grow border-t border-outline-variant/20"></div>
                  </div>

                  {/* Custom Address Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant">Alamat Wallet Stellar (G...)</label>
                    <input
                      type="text"
                      placeholder="Masukkan Alamat Stellar atau nama pengguna"
                      value={customAddress}
                      onChange={(e) => {
                        setCustomAddress(e.target.value);
                        setSelectedContact(null);
                      }}
                      className="w-full px-4 py-3 bg-white rounded-xl border border-outline-variant/30 focus:border-primary focus:outline-none text-sm text-on-surface"
                    />
                  </div>

                  {addressError && (
                    <span className="text-xs text-error font-medium flex items-center gap-1 bg-error-container/20 p-2.5 rounded-lg">
                      <XCircle className="w-4 h-4 text-error" /> {addressError}
                    </span>
                  )}

                  {/* CTA Next */}
                  <button
                    onClick={handleNextToAmount}
                    className="w-full py-4 bg-primary text-white font-bold rounded-xl active:scale-98 hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
                  >
                    Lanjutkan <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Step 2: Amount Input */}
              {sendStep === 2 && (
                <div className="flex flex-col gap-4">
                  {/* Recipient info */}
                  <div className="bg-surface-container-low border border-outline-variant/20 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                        {selectedContact ? selectedContact.name.charAt(0) : 'C'}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-on-surface">Kirim ke: {selectedContact ? selectedContact.name : 'Alamat Kustom'}</span>
                        <span className="text-[10px] font-mono text-on-surface-variant">{(selectedContact || customAddress ? (selectedContact?.address || customAddress).slice(0, 16) : '') + '...'}</span>
                      </div>
                    </div>
                    <button onClick={() => setSendStep(1)} className="text-[10px] font-bold text-primary hover:underline cursor-pointer">Ubah</button>
                  </div>

                  {/* Asset info - USDC only */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant text-left">Aset</label>
                    <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-sm font-bold text-emerald-800">USDC (Stellar Dollar)</span>
                    </div>
                  </div>

                  {/* Numeric Input */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-on-surface-variant">Masukkan Jumlah Kiriman</span>
                      <span className="font-bold text-primary">
                        Saldo: {balances.USDC} USDC
                      </span>
                    </div>
                    <div className="relative flex items-center bg-white rounded-xl border border-outline-variant/30 px-4 py-3">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value)}
                        className="w-full text-2xl font-bold text-on-surface focus:outline-none"
                      />
                      <span className="text-lg font-bold text-on-surface-variant ml-2">USDC</span>
                    </div>
                  </div>

                  {/* Real-time Exchange IDR equivalent */}
                  {sendAmount && !isNaN(parseFloat(sendAmount)) && (
                    <div className="bg-primary-container/20 border border-primary/25 rounded-xl p-3 flex flex-col gap-1 text-xs text-left">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant font-semibold">Keluarga Menerima (IDR)</span>
                        <span className="font-bold text-primary text-sm">
                          Rp {(parseFloat(sendAmount) * USDC_TO_IDR).toLocaleString('id-ID')} IDR
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-on-surface-variant font-medium">Kurs</span>
                        <span>1 USDC ≈ Rp {USDC_TO_IDR.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-on-surface-variant">
                        <span>Biaya Jaringan (Stellar gas)</span>
                        <span className="text-emerald-600 font-semibold">0.0001 XLM (≈ Rp 0,15) • INSTAN</span>
                      </div>
                    </div>
                  )}

                  {/* Note input */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-semibold text-on-surface-variant">Pesan / Catatan Tambahan (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: Uang bulanan belanja Ibu"
                      value={sendNotes}
                      onChange={(e) => setSendNotes(e.target.value)}
                      className="w-full px-4 py-3 bg-white rounded-xl border border-outline-variant/30 focus:border-primary focus:outline-none text-sm text-on-surface"
                    />
                  </div>

                  {/* Budget Split Allocation Toggler */}
                  <div className="flex flex-col gap-2 border-t border-outline-variant/10 pt-4 mt-1">
                    <div 
                      onClick={() => setIsSplitActive(!isSplitActive)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSplitActive 
                          ? 'bg-primary/5 border-primary shadow-xs' 
                          : 'bg-white border-outline-variant/30 hover:bg-surface-container-low'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl transition-colors ${isSplitActive ? 'bg-primary/15 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                            <Layers className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-extrabold text-on-surface">Atur Alokasi Pos Anggaran (Split)</span>
                            <span className="text-[10px] text-on-surface-variant leading-tight mt-0.5">Bagi dana agar aman & pas untuk kebutuhan keluarga</span>
                          </div>
                        </div>
                        <div className={`w-8 h-5 rounded-full p-0.5 transition-all flex items-center ${isSplitActive ? 'bg-primary justify-end' : 'bg-outline-variant/30 justify-start'}`}>
                          <div className="w-4 h-4 rounded-full bg-white shadow-xs animate-none" />
                        </div>
                      </div>
                    </div>

                    {isSplitActive && (
                      <div className="flex flex-col gap-3 bg-primary/5 border border-primary/10 p-3 rounded-2xl mt-1 text-left">
                        {/* Preset Buttons */}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold text-on-surface-variant">Pilih Template Alokasi:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {budgetTemplates.map((tpl) => (
                              <div key={tpl.id} className="relative">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSplitPreset(tpl.id);
                                    setSplitAllocations(tpl.allocations);
                                  }}
                                  className={`py-1.5 px-2.5 pr-6 rounded-xl text-[10px] font-extrabold transition-all border flex items-center gap-1 relative cursor-pointer ${
                                    splitPreset === tpl.id
                                      ? 'bg-primary text-white border-primary shadow-xs'
                                      : 'bg-white text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'
                                  }`}
                                >
                                  <span>{tpl.name}</span>
                                </button>
                                {tpl.isCustom && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setBudgetTemplates(prev => prev.filter(t => t.id !== tpl.id));
                                      if (splitPreset === tpl.id) {
                                        setSplitPreset('household');
                                        const hh = budgetTemplates.find(t => t.id === 'household');
                                        if (hh) setSplitAllocations(hh.allocations);
                                      }
                                    }}
                                    className="absolute top-1/2 -translate-y-1/2 right-1.5 text-on-surface-variant hover:text-error rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold active:scale-90"
                                    title="Hapus template kustom"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Allocation items list */}
                        <div className="flex flex-col gap-2.5 mt-1">
                          {splitAllocations.map((alloc) => {
                            const totalAmt = parseFloat(sendAmount) || 0;
                            const rate = USDC_TO_IDR;
                            const itemAmt = (totalAmt * alloc.percentage) / 100;
                            const itemIdr = itemAmt * rate;

                            return (
                              <div key={alloc.category} className="flex flex-col gap-1.5 bg-white p-2.5 rounded-xl border border-outline-variant/15 shadow-2xs">
                                <div className="flex justify-between items-center text-xs">
                                  <div className="flex items-center gap-1.5 font-extrabold text-on-surface">
                                    {alloc.category === 'Kebutuhan Rumah Tangga' && <HomeIcon className="w-3.5 h-3.5 text-sky-600" />}
                                    {alloc.category === 'Modal Usaha' && <Briefcase className="w-3.5 h-3.5 text-emerald-600" />}
                                    {alloc.category === 'Renovasi Rumah' && <Hammer className="w-3.5 h-3.5 text-amber-600" />}
                                    {alloc.category === 'Pendidikan Keluarga' && <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />}
                                    {alloc.category === 'Dana Darurat & Kesehatan' && <HeartPulse className="w-3.5 h-3.5 text-rose-600" />}
                                    <span>{alloc.category}</span>
                                  </div>
                                  <span className="font-mono font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md text-xs">{alloc.percentage}%</span>
                                </div>

                                {/* Calculated amounts */}
                                {totalAmt > 0 && (
                                  <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-semibold border-b border-dashed border-outline-variant/10 pb-1.5 mb-1">
                                    <span>Setara IDR: <strong className="text-on-surface">Rp {Math.round(itemIdr).toLocaleString('id-ID')}</strong></span>
                                    <span>{itemAmt.toFixed(2)} USDC</span>
                                  </div>
                                )}

                                {/* Slider controls & buttons */}
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSplitPreset('custom');
                                      setSplitAllocations(prev => prev.map(a => a.category === alloc.category ? { ...a, percentage: Math.max(0, a.percentage - 5) } : a));
                                    }}
                                    className="w-6 h-6 rounded-md bg-surface-container hover:bg-surface-container-high flex items-center justify-center font-bold text-xs select-none active:scale-90 border border-outline-variant/10 cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={alloc.percentage}
                                    onChange={(e) => {
                                      setSplitPreset('custom');
                                      const val = parseInt(e.target.value);
                                      setSplitAllocations(prev => prev.map(a => a.category === alloc.category ? { ...a, percentage: val } : a));
                                    }}
                                    className="flex-1 accent-primary h-1 bg-surface-container rounded-lg appearance-none cursor-pointer"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSplitPreset('custom');
                                      setSplitAllocations(prev => prev.map(a => a.category === alloc.category ? { ...a, percentage: Math.min(100, a.percentage + 5) } : a));
                                    }}
                                    className="w-6 h-6 rounded-md bg-surface-container hover:bg-surface-container-high flex items-center justify-center font-bold text-xs select-none active:scale-90 border border-outline-variant/10 cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Total percentage status indicator */}
                        {(() => {
                          const totalPct = splitAllocations.reduce((s, x) => s + x.percentage, 0);
                          const isCorrect = totalPct === 100;
                          return (
                            <div className="flex flex-col gap-2">
                              <div className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold ${
                                isCorrect 
                                  ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20' 
                                  : 'bg-amber-500/10 text-amber-800 border border-amber-500/20'
                              }`}>
                                <div className="flex items-center gap-1.5">
                                  {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Info className="w-4 h-4 text-amber-600" />}
                                  <span>Total Alokasi</span>
                                </div>
                                <span className="font-mono text-sm">{totalPct}% / 100%</span>
                              </div>

                              {/* Save Custom Template Action */}
                              {isCorrect && (
                                <div className="border-t border-dashed border-outline-variant/10 pt-2 mt-1">
                                  {!showSaveTemplateForm ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setShowSaveTemplateForm(true);
                                        setNewTemplateName('');
                                        setTemplateSaveSuccess('');
                                      }}
                                      className="w-full py-2 bg-primary/10 hover:bg-primary/15 text-primary rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" /> Simpan Alokasi Ini sebagai Template Baru
                                    </button>
                                  ) : (
                                    <div className="bg-white p-2.5 rounded-xl border border-outline-variant/20 flex flex-col gap-2 shadow-2xs">
                                      <span className="text-[10px] font-bold text-on-surface-variant">Nama Template Kustom:</span>
                                      <div className="flex gap-1.5">
                                        <input
                                          type="text"
                                          placeholder="Misal: Sembako & Pendidikan"
                                          value={newTemplateName}
                                          onChange={(e) => setNewTemplateName(e.target.value)}
                                          className="flex-1 px-2.5 py-1.5 bg-surface-container-lowest rounded-lg border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary font-semibold"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!newTemplateName.trim()) return;
                                            const newTpl = {
                                              id: `custom-${Date.now()}`,
                                              name: `✨ ${newTemplateName.trim()}`,
                                              isCustom: true,
                                              allocations: [...splitAllocations]
                                            };
                                            setBudgetTemplates(prev => [...prev, newTpl]);
                                            setSplitPreset(newTpl.id);
                                            setShowSaveTemplateForm(false);
                                            setNewTemplateName('');
                                            setTemplateSaveSuccess('Template kustom berhasil disimpan!');
                                            setTimeout(() => setTemplateSaveSuccess(''), 3000);
                                          }}
                                          className="px-3 bg-primary text-white font-bold rounded-lg text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                        >
                                          Simpan
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setShowSaveTemplateForm(false)}
                                          className="px-2 bg-surface-container text-on-surface-variant font-bold rounded-lg text-xs cursor-pointer"
                                        >
                                          Batal
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                  {templateSaveSuccess && (
                                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1.5 justify-center">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> {templateSaveSuccess}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {amountError && (
                    <span className="text-xs text-error font-medium flex items-center gap-1 bg-error-container/20 p-2.5 rounded-lg text-left">
                      <XCircle className="w-4 h-4 text-error" /> {amountError}
                    </span>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setSendStep(1)}
                      className="flex-1 py-4 bg-surface-container text-on-surface font-bold rounded-xl active:scale-98 hover:bg-surface-container-high transition-all cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button
                      onClick={handleNextToConfirm}
                      className="flex-[2] py-4 bg-primary text-white font-bold rounded-xl active:scale-98 hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Tinjau Kiriman
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation and Slide to Send */}
              {sendStep === 3 && (
                <div className="flex flex-col gap-4">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Tinjauan Terakhir</span>
                  
                  {/* recipient & Amount Receipt Card */}
                  <div className="bg-white border border-outline-variant/20 rounded-2xl p-5 flex flex-col gap-4 shadow-xs">
                    <div className="flex flex-col items-center justify-center border-b border-outline-variant/10 pb-4">
                      <span className="text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">Total Dikirim</span>
                      <span className="text-3xl font-extrabold text-on-surface mt-1">{sendAmount} USDC</span>
                      <span className="text-sm font-semibold text-primary mt-1">
                        Setara ≈ Rp {(parseFloat(sendAmount) * USDC_TO_IDR).toLocaleString('id-ID')} IDR
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5 text-xs text-left">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Penerima</span>
                        <span className="font-bold text-on-surface text-right">
                          {selectedContact ? selectedContact.name : 'Alamat Kustom'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Metode</span>
                        <span className="font-semibold text-on-surface">
                          Kirim Langsung
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Biaya Jaringan</span>
                        <span className="font-semibold text-emerald-600">0.0001 XLM (Rp 0,15)</span>
                      </div>
                      {sendNotes && (
                        <div className="flex flex-col bg-surface-container p-2.5 rounded-lg gap-1 border border-outline-variant/10 mt-1">
                          <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Memo / Catatan</span>
                          <span className="text-on-surface font-medium italic">"{sendNotes}"</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Budget Splits Summary inside Step 3 */}
                  {isSplitActive && (
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col gap-3 text-left">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" /> Ringkasan Alokasi Pos Anggaran
                      </span>
                      <div className="flex flex-col gap-2">
                        {splitAllocations
                          .filter(a => a.percentage > 0)
                          .map(alloc => {
                            const totalAmt = parseFloat(sendAmount) || 0;
                            const rate = USDC_TO_IDR;
                            const itemAmt = (totalAmt * alloc.percentage) / 100;
                            const itemIdr = itemAmt * rate;

                            return (
                              <div key={alloc.category} className="flex flex-col gap-1.5 bg-white p-2.5 rounded-xl border border-outline-variant/10">
                                <div className="flex justify-between items-center text-xs">
                                  <div className="flex items-center gap-1.5 font-bold text-on-surface">
                                    {alloc.category === 'Kebutuhan Rumah Tangga' && <HomeIcon className="w-3.5 h-3.5 text-sky-600" />}
                                    {alloc.category === 'Modal Usaha' && <Briefcase className="w-3.5 h-3.5 text-emerald-600" />}
                                    {alloc.category === 'Renovasi Rumah' && <Hammer className="w-3.5 h-3.5 text-amber-600" />}
                                    {alloc.category === 'Pendidikan Keluarga' && <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />}
                                    {alloc.category === 'Dana Darurat & Kesehatan' && <HeartPulse className="w-3.5 h-3.5 text-rose-600" />}
                                    <span>{alloc.category}</span>
                                  </div>
                                  <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md text-[10px]">{alloc.percentage}%</span>
                                </div>
                                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-primary h-full" style={{ width: `${alloc.percentage}%` }} />
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-medium">
                                  <span>Rp {Math.round(itemIdr).toLocaleString('id-ID')} IDR</span>
                                  <span>{itemAmt.toFixed(2)} USDC</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="flex gap-2 items-start bg-amber-500/10 p-3 rounded-xl border border-amber-500/25 text-left">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-relaxed text-amber-900">
                      Transaksi blockchain bersifat permanen dan tidak dapat dibatalkan. Pastikan alamat Stellar penerima sudah benar.
                    </p>
                  </div>

                  {/* Clickable Confirm Button (Alternative to slider) */}
                  <div className="flex flex-col gap-2 mt-2">
                    <button
                      onClick={executeSendTransaction}
                      disabled={isSending}
                      className="w-full py-4 bg-primary text-white font-bold rounded-xl active:scale-98 hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSending ? (
                        <>Memproses...</>
                      ) : (
                        <><CheckCircle2 className="w-5 h-5 text-primary-container" /> Konfirmasi & Kirim Sekarang</>
                      )}
                    </button>
                    <button
                      onClick={() => setSendStep(2)}
                      className="w-full py-3 bg-surface-container text-on-surface font-semibold rounded-xl text-center text-xs hover:bg-surface-container-high transition-all cursor-pointer"
                    >
                      Kembali Edit
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Loading Screen */}
              {sendStep === 4 && (
                <div className="flex flex-col gap-4 text-center">
                  <div className="text-center mb-2">
                    <h1 className="text-xl font-extrabold text-on-background mb-1">Status Transaksi</h1>
                    <p className="text-[11px] text-on-surface-variant">Demonstrasi status untuk flow transaksi Anda.</p>
                  </div>

                  <section className="bg-surface-container-high/40 border border-outline-variant/20 rounded-2xl p-6 relative overflow-hidden">
                    <div className="flex flex-col items-center text-center gap-6 relative z-10">
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-primary-container/20 animate-pulse"></div>
                        <div className="absolute inset-2 rounded-full border-4 border-primary-container/30"></div>
                        <div className="absolute inset-2 rounded-full border-4 border-primary-container border-t-transparent animate-spin"></div>
                        <Key className="text-primary w-8 h-8 animate-bounce" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-base font-extrabold text-on-surface">Menunggu Tanda Tangan</h2>
                        <p className="text-xs text-on-surface-variant max-w-[280px] leading-relaxed mx-auto">
                          Menunggu konfirmasi di wallet Anda. Mohon jangan tutup halaman ini.
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {/* Step 5: Success Screen */}
              {sendStep === 5 && (
                <div className="flex flex-col gap-4 text-center">
                  <div className="text-center mb-2">
                    <h1 className="text-xl font-extrabold text-on-background mb-1">Status Transaksi</h1>
                    <p className="text-[11px] text-on-surface-variant">Demonstrasi status untuk flow transaksi Anda.</p>
                  </div>

                  <section className="bg-surface-container-high/40 border border-outline-variant/20 rounded-2xl p-6 shadow-[0px_4px_20px_rgba(91,100,0,0.06)]">
                    <div className="flex flex-col items-center text-center gap-5">
                      <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
                        <CheckCircle2 className="w-8 h-8 stroke-[3]" />
                      </div>
                      
                      <div className="space-y-1">
                        <h2 className="text-base font-extrabold text-on-surface">Transaksi Berhasil</h2>
                        <div className="text-2xl font-black text-primary mt-1">
                          {sendAmount} USDC
                        </div>
                        <div className="text-xs font-bold text-on-surface-variant">
                          ≈ Rp {(parseFloat(sendAmount) * USDC_TO_IDR).toLocaleString('id-ID')} IDR
                        </div>
                      </div>

                      {/* Splits List */}
                      <div className="w-full bg-white rounded-xl p-4 space-y-4 border border-outline-variant/10 shadow-3xs text-left">
                        {isSplitActive ? (
                          splitAllocations.filter(a => a.percentage > 0).map((alloc, idx) => {
                            const itemAmt = (parseFloat(sendAmount) * alloc.percentage) / 100;
                            return (
                              <div key={alloc.category} className="flex justify-between items-center border-b border-surface-container pb-3 last:border-0 last:pb-0">
                                <div className="flex items-center gap-2">
                                  {alloc.category === 'Kebutuhan Rumah Tangga' && <HomeIcon className="w-4 h-4 text-sky-600" />}
                                  {alloc.category === 'Modal Usaha' && <Briefcase className="w-4 h-4 text-emerald-600" />}
                                  {alloc.category === 'Renovasi Rumah' && <Hammer className="w-4 h-4 text-amber-600" />}
                                  {alloc.category === 'Pendidikan Keluarga' && <GraduationCap className="w-4 h-4 text-indigo-600" />}
                                  {alloc.category === 'Dana Darurat & Kesehatan' && <HeartPulse className="w-4 h-4 text-rose-600" />}
                                  <span className="font-bold text-xs text-on-surface">{alloc.category}</span>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-xs text-on-surface">{itemAmt.toFixed(2)} USDC</div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Send className="w-4 h-4 text-primary" />
                              <span className="font-bold text-xs text-on-surface">Kirim Langsung</span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-xs text-on-surface">{sendAmount} USDC</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Share WA button */}
                      <button 
                        onClick={() => setShowShareModal(true)}
                        className="text-xs font-bold text-primary flex items-center gap-1.5 hover:underline mt-1 justify-center mx-auto cursor-pointer"
                      >
                        <span>Bagikan detail transaksi via WhatsApp</span>
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Share WA Modal */}
                      <AnimatePresence>
                        {showShareModal && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-4 backdrop-blur-xs"
                            onClick={() => setShowShareModal(false)}
                          >
                            <motion.div
                              initial={{ y: 40, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: 40, opacity: 0 }}
                              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                              onClick={e => e.stopPropagation()}
                              className="bg-surface w-full max-w-sm rounded-3xl overflow-hidden border border-outline-variant/30 shadow-2xl"
                            >
                              {/* Modal Header */}
                              <div className="flex justify-between items-center px-5 py-4 border-b border-outline-variant/10 bg-[#25D366]/10">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">💬</span>
                                  <span className="font-bold text-sm text-on-surface">Bagikan via WhatsApp</span>
                                </div>
                                <button onClick={() => setShowShareModal(false)} className="p-1 rounded-full hover:bg-surface-container cursor-pointer">
                                  <X className="w-4 h-4 text-on-surface" />
                                </button>
                              </div>

                              {/* Preview Pesan */}
                              <div className="p-5 flex flex-col gap-4">
                                <div>
                                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Preview Pesan:</span>
                                  <div className="mt-2 bg-[#DCF8C6] rounded-2xl rounded-tl-none p-4 text-xs text-gray-800 leading-relaxed whitespace-pre-line font-medium shadow-xs border border-[#b7e4a0]/50">
                                    {buildWhatsAppText()}
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-2">
                                  <a
                                    href={`https://wa.me/?text=${encodeURIComponent(buildWhatsAppText())}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setShowShareModal(false)}
                                    className="w-full py-3.5 bg-[#25D366] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition-all cursor-pointer"
                                  >
                                    <Share2 className="w-4 h-4" />
                                    Buka WhatsApp & Kirim
                                  </a>
                                  <button
                                    onClick={() => setShowShareModal(false)}
                                    className="w-full py-3 bg-surface-container text-on-surface font-semibold rounded-xl text-xs hover:bg-surface-container-high transition-all cursor-pointer"
                                  >
                                    Tutup
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <button 
                        onClick={resetSendForm}
                        className="w-full h-[56px] bg-primary text-white font-extrabold text-xs rounded-2xl hover:scale-102 active:scale-98 transition-all shadow-xs mt-3 cursor-pointer"
                      >
                        Kembali ke Beranda
                      </button>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
