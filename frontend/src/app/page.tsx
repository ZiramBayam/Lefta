'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Wallet, Home as HomeIcon, Layers, History as HistoryIcon, CheckCircle2, XCircle, LogOut } from 'lucide-react';

import { Transaction } from '@/lib/types';
import { useLanguage, useExchangeRates } from '@/context/AppContext';
import { useWallet } from '@/context/WalletContext';

import { BottomNav } from '@/components/layout/BottomNav';
import { SidebarWidget } from '@/components/layout/SidebarWidget';
import { WalletModal } from '@/components/drawers/WalletModal';
import { TransactionDetailModal } from '@/components/drawers/TransactionDetailModal';
import { DepositDrawer } from '@/components/drawers/DepositDrawer';
import { SendDrawer } from '@/components/drawers/SendDrawer';
import { ReceiptDrawer } from '@/components/drawers/ReceiptDrawer';
import { HomeTab } from '@/components/tabs/HomeTab';
import { TemplatesTab } from '@/components/tabs/TemplatesTab';
import { HistoryTab } from '@/components/tabs/HistoryTab';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useStellarSync } from '@/hooks/useStellarSync';
import { useSendFlow } from '@/hooks/useSendFlow';
import { useDepositFlow } from '@/hooks/useDepositFlow';
import { useContacts } from '@/hooks/useContacts';
import { useBudgetTemplates } from '@/hooks/useBudgetTemplates';
import { useHorizonHistory } from '@/hooks/useHorizonHistory';

export default function Home() {
  const { language, setLanguage, t } = useLanguage();
  const rates = useExchangeRates();
  const wallet = useWallet();

  const [activeTab, setActiveTab] = useState<'home' | 'templates' | 'history'>('home');
  const [showSendDrawer, setShowSendDrawer] = useState(false);
  const [showDepositDrawer, setShowDepositDrawer] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showReceiptDrawer, setShowReceiptDrawer] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const [stellarAddress, setStellarAddress] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem('lefta_stellar_address');
    if (saved) setStellarAddress(saved);
  }, []);

  useEffect(() => {
    if (wallet.publicKey) {
      setStellarAddress(wallet.publicKey);
    }
  }, [wallet.publicKey]);

  useEffect(() => {
    if (typeof window !== 'undefined' && stellarAddress) {
      localStorage.setItem('lefta_stellar_address', stellarAddress);
    }
  }, [stellarAddress]);

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState(stellarAddress);

  const [balances, setBalances] = useLocalStorage('lefta_balances', {
    USDC: 0, XLM: 0, IDR: 0,
  });

  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('lefta_transactions', []);
  const [onChainTxs, setOnChainTxs] = useState<Transaction[]>([]);
  const [txFilter, setTxFilter] = useState<'all' | 'sent' | 'received'>('all');

  // Gabung transaksi on-chain + transaksi lokal (baru dibuat dari app)
  // On-chain jadi sumber kebenaran; transaksi lokal baru muncul di atas
  const allTransactions = React.useMemo(() => {
    const onChainIds = new Set(onChainTxs.map(t => t.txHash));
    const localOnly = transactions.filter(t => !onChainIds.has(t.txHash));
    return [...localOnly, ...onChainTxs];
  }, [onChainTxs, transactions]);

  const filteredTransactions = allTransactions.filter(tx => {
    if (txFilter === 'all') return true;
    return tx.type === txFilter;
  });

  const {
    isSyncing, syncStatus, detectedNetwork, syncStellarBalances,
  } = useStellarSync(stellarAddress);

  const { isFetchingHistory, fetchHorizonHistory } = useHorizonHistory();

  const sendFlow = useSendFlow({ balances, rates, stellarAddress, setTransactions });
  const depositFlow = useDepositFlow({
    stellarAddress, rates, setTransactions,
    onDepositSuccess: () => {
      syncStellarBalances(stellarAddress, (update) => {
        setBalances(prev => ({ ...prev, ...update }));
      });
    },
  });
  const { contacts } = useContacts();
  const {
    budgetTemplates, setBudgetTemplates,
    newTemplateName, setNewTemplateName,
    showSaveTemplateForm, setShowSaveTemplateForm,
    templateSaveSuccess, setTemplateSaveSuccess,
    createTemplateName, setCreateTemplateName,
    createAllocations, setCreateAllocations,
    showCreateForm, setShowCreateForm,
  } = useBudgetTemplates();

  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleResetWalletCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lefta_stellar_address');
      localStorage.removeItem('lefta_balances');
      localStorage.removeItem('lefta_transactions');
      localStorage.removeItem('lefta_contacts');
      localStorage.removeItem('lefta_budget_templates');
    }
    if (wallet.isConnected) {
      wallet.disconnect();
    }
    setShowWalletModal(false);
    window.location.reload();
  };

  const handleSync = () => {
    syncStellarBalances(stellarAddress, (update) => {
      setBalances(prev => ({ ...prev, ...update }));
    });
    fetchHorizonHistory(stellarAddress, rates.USDC_TO_IDR).then(txs => {
      if (txs.length > 0) setOnChainTxs(txs);
    });
  };

  useEffect(() => {
    syncStellarBalances(stellarAddress, (update) => {
      setBalances(prev => ({ ...prev, ...update }));
    });
    // Fetch on-chain history saat address berubah
    fetchHorizonHistory(stellarAddress, rates.USDC_TO_IDR).then(txs => {
      if (txs.length > 0) setOnChainTxs(txs);
    });
  }, [stellarAddress]);

  const getStatusBadge = (status: 'Success' | 'Pending' | 'Failed') => {
    switch (status) {
      case 'Success':
        return (
          <span className="inline-flex items-center gap-1 bg-primary-container text-on-primary-container font-semibold px-2 py-1 rounded-full text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> Sukses
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-semibold px-2 py-1 rounded-full text-xs">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" /> Memproses
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 font-semibold px-2 py-1 rounded-full text-xs">
            <XCircle className="w-3.5 h-3.5" /> Gagal
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-surface-container/10 flex flex-col">
      <header className="bg-surface/95 backdrop-blur-md sticky top-0 z-40 w-full border-b border-surface-container/80 py-3.5 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center w-full">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="text-primary w-5 h-5" />
            </div>
            <div>
              <h1 className="text-[20px] font-extrabold text-primary tracking-tight leading-none">Lefta</h1>
              <p className="text-[10px] text-on-surface-variant/80 font-medium tracking-wide mt-1 hidden sm:block">{t('brand.sub')}</p>
            </div>
          </div>

          <div className="hidden md:flex bg-surface-container p-1 rounded-xl gap-1">
            <button onClick={() => setActiveTab('home')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'home' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}>
              <HomeIcon className="w-3.5 h-3.5" /> {t('nav.home')}
            </button>
            <button onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'templates' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}>
              <Layers className="w-3.5 h-3.5" /> {t('nav.templates')}
            </button>
            <button onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'history' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}>
              <HistoryIcon className="w-3.5 h-3.5" /> {t('nav.history')}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-surface-container p-0.5 rounded-full border border-outline-variant/10 text-[10px] font-bold">
              <button onClick={() => setLanguage('ID')}
                className={`px-2 py-1 rounded-full transition-all cursor-pointer ${language === 'ID' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}>ID</button>
              <button onClick={() => setLanguage('EN')}
                className={`px-2 py-1 rounded-full transition-all cursor-pointer ${language === 'EN' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}>EN</button>
            </div>

            <button onClick={() => wallet.isConnected ? wallet.disconnect() : wallet.connect()}
              className={`bg-surface-container hover:bg-primary-container/20 active:scale-95 transition-all rounded-full px-3.5 py-1.5 flex items-center gap-2 border border-outline-variant/10 cursor-pointer min-h-[38px] ${wallet.error ? 'border-red-500/50' : ''}`}>
              {wallet.isConnecting ? (
                <><div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div><span className="text-xs font-bold text-amber-600">Connecting...</span></>
              ) : wallet.isConnected ? (
                <><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div><span className="font-mono text-xs font-bold text-on-surface tracking-wider">{stellarAddress.slice(0, 4)}...{stellarAddress.slice(-4)}</span><LogOut className="w-3 h-3 text-on-surface-variant" /></>
              ) : (
                <><Wallet className="w-4 h-4 text-on-surface-variant" /><span className="text-xs font-bold text-on-surface-variant">Connect</span></>
              )}
            </button>
          </div>
        </div>
      </header>

      {wallet.error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{wallet.error}</p>
          </div>
        </div>
      )}

      <main className="w-full max-w-6xl mx-auto px-4 py-6 flex-grow flex flex-col gap-6 pb-28 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
          <div className="lg:col-span-8 flex flex-col gap-6 w-full">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {activeTab === 'home' && (
                  <HomeTab
                    balances={balances}
                    isSyncing={isSyncing}
                    syncStatus={syncStatus}
                    detectedNetwork={detectedNetwork}
                    syncStellarBalances={handleSync}
                    setSendStep={sendFlow.setSendStep}
                    setShowSendDrawer={setShowSendDrawer}
                    setDepositStep={depositFlow.setDepositStep}
                    setDepositAmount={depositFlow.setDepositAmount}
                    setDepositError={depositFlow.setDepositError}
                    setShowDepositDrawer={setShowDepositDrawer}
                    setShowReceiptDrawer={setShowReceiptDrawer}
                  />
                )}

                {activeTab === 'templates' && (
                  <TemplatesTab
                    budgetTemplates={budgetTemplates}
                    setBudgetTemplates={setBudgetTemplates}
                    showCreateForm={showCreateForm}
                    setShowCreateForm={setShowCreateForm}
                    createTemplateName={createTemplateName}
                    setCreateTemplateName={setCreateTemplateName}
                    createAllocations={createAllocations}
                    setCreateAllocations={setCreateAllocations}
                    setIsSplitActive={sendFlow.setIsSplitActive}
                    setSplitPreset={sendFlow.setSplitPreset}
                    setSplitAllocations={sendFlow.setSplitAllocations}
                    setSendStep={sendFlow.setSendStep}
                    setShowSendDrawer={setShowSendDrawer}
                    stellarAddress={stellarAddress}
                  />
                )}

                {activeTab === 'history' && (
                  <HistoryTab
                    filteredTransactions={filteredTransactions}
                    txFilter={txFilter}
                    setTxFilter={setTxFilter}
                    setSelectedTx={setSelectedTx}
                    contacts={contacts}
                    isFetchingHistory={isFetchingHistory}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          <SidebarWidget
            stellarAddress={stellarAddress}
            copiedAddress={copiedAddress}
            handleCopyAddress={handleCopyAddress}
            handleResetWalletCache={handleResetWalletCache}
          />
        </div>
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="lg:hidden text-center pb-24 pt-4 text-[10px] text-on-surface-variant/50 flex flex-col gap-0.5 px-4">
        <p className="font-bold">Lefta Web3 Remittance Service Indonesia</p>
        <p>Memajukan inklusi keuangan keluarga pekerja migran lewat Jaringan Stellar Blockchain.</p>
      </div>

      <WalletModal
        showWalletModal={showWalletModal}
        setShowWalletModal={setShowWalletModal}
        stellarAddress={stellarAddress}
        setStellarAddress={setStellarAddress}
        isEditingAddress={isEditingAddress}
        setIsEditingAddress={setIsEditingAddress}
        addressInput={addressInput}
        setAddressInput={setAddressInput}
        copiedAddress={copiedAddress}
        handleCopyAddress={handleCopyAddress}
        handleResetWalletCache={handleResetWalletCache}
        setShowDepositDrawer={setShowDepositDrawer}
        setDepositStep={depositFlow.setDepositStep}
        setDepositAmount={depositFlow.setDepositAmount}
        setDepositError={depositFlow.setDepositError}
      />

      <TransactionDetailModal
        selectedTx={selectedTx}
        setSelectedTx={setSelectedTx}
        copiedHash={copiedHash}
        handleCopyHash={handleCopyHash}
        getStatusBadge={getStatusBadge}
      />

      <DepositDrawer
        showDepositDrawer={showDepositDrawer}
        depositAmount={depositFlow.depositAmount}
        setDepositAmount={depositFlow.setDepositAmount}
        depositStep={depositFlow.depositStep}
        setDepositStep={depositFlow.setDepositStep}
        depositError={depositFlow.depositError}
        setDepositError={depositFlow.setDepositError}
        executeDeposit={depositFlow.executeDeposit}
        handleInstantDeposit1000={depositFlow.handleInstantDeposit1000}
        resetDepositForm={() => { depositFlow.resetDepositForm(); setShowDepositDrawer(false); }}
        isDepositing={depositFlow.isDepositing}
        depositTxHash={depositFlow.depositTxHash}
      />

      <ReceiptDrawer
        showReceiptDrawer={showReceiptDrawer}
        setShowReceiptDrawer={setShowReceiptDrawer}
        stellarAddress={stellarAddress}
      />

      <SendDrawer
        showSendDrawer={showSendDrawer}
        resetSendForm={() => { sendFlow.resetSendForm(); setShowSendDrawer(false); }}
        sendStep={sendFlow.sendStep}
        setSendStep={sendFlow.setSendStep}
        contactSearch={sendFlow.contactSearch}
        setContactSearch={sendFlow.setContactSearch}
        contacts={contacts}
        selectedContact={sendFlow.selectedContact}
        setSelectedContact={sendFlow.setSelectedContact}
        customAddress={sendFlow.customAddress}
        setCustomAddress={sendFlow.setCustomAddress}
        addressError={sendFlow.addressError}
        handleNextToAmount={sendFlow.handleNextToAmount}
        amountError={sendFlow.amountError}
        setAmountError={sendFlow.setAmountError}
        balances={balances}
        sendAmount={sendFlow.sendAmount}
        setSendAmount={sendFlow.setSendAmount}
        sendNotes={sendFlow.sendNotes}
        setSendNotes={sendFlow.setSendNotes}
        isSplitActive={sendFlow.isSplitActive}
        setIsSplitActive={sendFlow.setIsSplitActive}
        budgetTemplates={budgetTemplates}
        setBudgetTemplates={setBudgetTemplates}
        splitPreset={sendFlow.splitPreset}
        setSplitPreset={sendFlow.setSplitPreset}
        splitAllocations={sendFlow.splitAllocations}
        setSplitAllocations={sendFlow.setSplitAllocations}
        showSaveTemplateForm={showSaveTemplateForm}
        setShowSaveTemplateForm={setShowSaveTemplateForm}
        newTemplateName={newTemplateName}
        setNewTemplateName={setNewTemplateName}
        templateSaveSuccess={templateSaveSuccess}
        setTemplateSaveSuccess={setTemplateSaveSuccess}
        handleNextToConfirm={sendFlow.handleNextToConfirm}
        executeSendTransaction={sendFlow.executeSendTransaction}
        isSending={sendFlow.isSending}
        stellarAddress={stellarAddress}
        copiedHash={copiedHash}
        handleCopyHash={handleCopyHash}
      />
    </div>
  );
}
