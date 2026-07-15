'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Wallet, Home as HomeIcon, Layers, History as HistoryIcon, CheckCircle2, XCircle, LogIn, LogOut } from 'lucide-react';

import { Transaction, WalletBalances, Contact, BudgetSplit } from '@/lib/types';
import { INITIAL_BALANCES, MOCK_CONTACTS } from '@/lib/data';
import { useLanguage, useExchangeRates } from '@/context/AppContext';
import { useWallet } from '@/context/WalletContext';

import { BottomNav } from '@/components/layout/BottomNav';
import { SidebarWidget } from '@/components/layout/SidebarWidget';
import { WalletModal } from '@/components/drawers/WalletModal';
import { TransactionDetailModal } from '@/components/drawers/TransactionDetailModal';
import { DepositDrawer } from '@/components/drawers/DepositDrawer';
import { SendDrawer } from '@/components/drawers/SendDrawer';
import { faucetDeposit, ensureTrustline, sendDirect, transfer } from '@/contracts/api';

import { HomeTab } from '@/components/tabs/HomeTab';
import { TemplatesTab } from '@/components/tabs/TemplatesTab';
import { HistoryTab } from '@/components/tabs/HistoryTab';

interface BudgetSplitAlloc {
  category: string;
  percentage: number;
}

interface BudgetTemplate {
  id: string;
  name: string;
  isCustom?: boolean;
  allocations: BudgetSplitAlloc[];
}

export default function Home() {
  const { language, setLanguage, t } = useLanguage();
  const rates = useExchangeRates();
  const wallet = useWallet();

  const [activeTab, setActiveTab] = useState<'home' | 'templates' | 'history'>('home');
  const [showSendDrawer, setShowSendDrawer] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Stellar address from wallet or fallback to saved/placeholder
  const [stellarAddress, setStellarAddress] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lefta_stellar_address');
      return saved || '';
    }
    return '';
  });

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState(stellarAddress);

  // Sync wallet address to state
  useEffect(() => {
    if (wallet.publicKey) {
      setStellarAddress(wallet.publicKey);
      setAddressInput(wallet.publicKey);
    }
  }, [wallet.publicKey]);

  // Save address when changed
  useEffect(() => {
    if (typeof window !== 'undefined' && stellarAddress) {
      localStorage.setItem('lefta_stellar_address', stellarAddress);
    }
  }, [stellarAddress]);

  const [balances, setBalances] = useState<WalletBalances>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lefta_balances');
      return saved ? JSON.parse(saved) : INITIAL_BALANCES;
    }
    return INITIAL_BALANCES;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lefta_transactions');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lefta_contacts');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lefta_balances', JSON.stringify(balances));
    }
  }, [balances]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lefta_transactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lefta_contacts', JSON.stringify(contacts));
    }
  }, [contacts]);

  const [showDepositDrawer, setShowDepositDrawer] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositStep, setDepositStep] = useState<1 | 2 | 3>(1);
  const [depositError, setDepositError] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositTxHash, setDepositTxHash] = useState('');

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [detectedNetwork, setDetectedNetwork] = useState<'Testnet' | 'Mainnet' | 'Simulated'>('Simulated');
  const [isSending, setIsSending] = useState(false);

  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [addContactError, setAddContactError] = useState('');

  const [sendStep, setSendStep] = useState<number>(1);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [customAddress, setCustomAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendNotes, setSendNotes] = useState('');
  const [sendTxHash, setSendTxHash] = useState('');
  const [addressError, setAddressError] = useState('');
  const [amountError, setAmountError] = useState('');

  const [isSplitActive, setIsSplitActive] = useState(false);
  const [splitAllocations, setSplitAllocations] = useState<BudgetSplitAlloc[]>([
    { category: 'Kebutuhan Rumah Tangga', percentage: 45 },
    { category: 'Modal Usaha', percentage: 20 },
    { category: 'Renovasi Rumah', percentage: 10 },
    { category: 'Pendidikan Keluarga', percentage: 15 },
    { category: 'Dana Darurat & Kesehatan', percentage: 10 },
  ]);
  const [splitPreset, setSplitPreset] = useState<string>('household');

  const [budgetTemplates, setBudgetTemplates] = useState<BudgetTemplate[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lefta_budget_templates');
      if (saved) return JSON.parse(saved);
    }
    return [
      {
        id: 'household',
        name: '🏠 Belanja Ibu',
        allocations: [
          { category: 'Kebutuhan Rumah Tangga', percentage: 50 },
          { category: 'Modal Usaha', percentage: 10 },
          { category: 'Renovasi Rumah', percentage: 10 },
          { category: 'Pendidikan Keluarga', percentage: 20 },
          { category: 'Dana Darurat & Kesehatan', percentage: 10 },
        ]
      },
      {
        id: 'business',
        name: '💼 Modal Usaha',
        allocations: [
          { category: 'Kebutuhan Rumah Tangga', percentage: 25 },
          { category: 'Modal Usaha', percentage: 50 },
          { category: 'Renovasi Rumah', percentage: 10 },
          { category: 'Pendidikan Keluarga', percentage: 5 },
          { category: 'Dana Darurat & Kesehatan', percentage: 10 },
        ]
      },
      {
        id: 'equal',
        name: '⚖️ Sama Rata',
        allocations: [
          { category: 'Kebutuhan Rumah Tangga', percentage: 20 },
          { category: 'Modal Usaha', percentage: 20 },
          { category: 'Renovasi Rumah', percentage: 20 },
          { category: 'Pendidikan Keluarga', percentage: 20 },
          { category: 'Dana Darurat & Kesehatan', percentage: 20 },
        ]
      }
    ];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lefta_budget_templates', JSON.stringify(budgetTemplates));
    }
  }, [budgetTemplates]);

  const [newTemplateName, setNewTemplateName] = useState('');
  const [showSaveTemplateForm, setShowSaveTemplateForm] = useState(false);
  const [templateSaveSuccess, setTemplateSaveSuccess] = useState('');

  const [createTemplateName, setCreateTemplateName] = useState('');
  const [createAllocations, setCreateAllocations] = useState<BudgetSplitAlloc[]>([
    { category: 'Kebutuhan Rumah Tangga', percentage: 30 },
    { category: 'Modal Usaha', percentage: 20 },
    { category: 'Renovasi Rumah', percentage: 10 },
    { category: 'Pendidikan Keluarga', percentage: 20 },
    { category: 'Dana Darurat & Kesehatan', percentage: 20 },
  ]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const [contactSearch, setContactSearch] = useState('');

  const [txFilter, setTxFilter] = useState<'all' | 'sent' | 'received'>('all');

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
    }
    // Disconnect wallet if connected
    if (wallet.isConnected) {
      wallet.disconnect();
    }
    setStellarAddress('');
    setAddressInput('');
    setBalances(INITIAL_BALANCES);
    setTransactions([]);
    setContacts([]);
    setShowWalletModal(false);
  };

  const handleNextToAmount = () => {
    if (!selectedContact && !customAddress.trim()) {
      setAddressError('Pilih kontak atau masukkan alamat Stellar tujuan');
      return;
    }
    if (customAddress.trim() && !customAddress.startsWith('G') && customAddress.length < 20) {
      setAddressError('Alamat Stellar tidak valid (harus dimulai dengan G)');
      return;
    }
    setAddressError('');
    setSendStep(2);
  };

  const handleNextToConfirm = () => {
    const numAmount = parseFloat(sendAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError('Masukkan jumlah pengiriman yang valid');
      return;
    }

    if (numAmount > balances.USDC) {
      setAmountError(`Saldo USDC tidak mencukupi (Maksimal: ${balances.USDC} USDC)`);
      return;
    }

    if (isSplitActive) {
      const totalPercentage = splitAllocations.reduce((sum, item) => sum + item.percentage, 0);
      if (totalPercentage !== 100) {
        setAmountError(`Total alokasi anggaran harus pas 100%. Saat ini masih ${totalPercentage}%.`);
        return;
      }
    }

    setAmountError('');
    setSendStep(3);
  };

  const executeSendTransaction = async () => {
    const numAmount = parseFloat(sendAmount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    if (!stellarAddress) { setAmountError('Wallet belum terhubung'); return; }

    setIsSending(true);
    setSendStep(4);

    try {
      const destAddr = selectedContact ? selectedContact.address : customAddress;
      const idrEquivalent = numAmount * rates.USDC_TO_IDR;
      let txHash = '';

      txHash = await sendDirect(stellarAddress, destAddr, sendAmount);
      const notes = `Kirim USDC ke ${selectedContact?.name || 'Alamat Stellar'}`;

      setSendTxHash(txHash);

      setTransactions(prev => [{
        id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'sent',
        amount: numAmount,
        currency: 'USDC',
        amountIdr: idrEquivalent,
        destinationAddress: destAddr,
        sourceAddress: stellarAddress,
        timestamp: new Date().toISOString(),
        status: 'Success',
        notes,
        txHash,
      }, ...prev]);

      setSendStep(5);
    } catch (err) {
      setAmountError(err instanceof Error ? err.message : 'Gagal mengirim transaksi');
      setSendStep(3);
    } finally {
      setIsSending(false);
    }
  };

  const resetSendForm = () => {
    setSendStep(1);
    setSelectedContact(null);
    setCustomAddress('');
    setSendAmount('');
    setSendNotes('');
    setIsSplitActive(false);
    setSplitPreset('household');
    setSplitAllocations([
      { category: 'Kebutuhan Rumah Tangga', percentage: 45 },
      { category: 'Modal Usaha', percentage: 20 },
      { category: 'Renovasi Rumah', percentage: 10 },
      { category: 'Pendidikan Keluarga', percentage: 15 },
      { category: 'Dana Darurat & Kesehatan', percentage: 10 },
    ]);
    setShowSendDrawer(false);
  };

  const syncStellarBalances = async (addressToSync = stellarAddress) => {
    if (!addressToSync || !addressToSync.startsWith('G') || addressToSync.length < 25) {
      setSyncStatus('error');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('idle');

    try {
      let response = await fetch(`https://horizon-testnet.stellar.org/accounts/${addressToSync}`);
      let isTestnet = true;
      
      if (!response.ok) {
        response = await fetch(`https://horizon.stellar.org/accounts/${addressToSync}`);
        isTestnet = false;
      }

      if (response.ok) {
        const data = await response.json();
        const apiBalances = data.balances || [];
        
        let xlmBalance = 0;
        let usdcBalance = 0;

        for (const item of apiBalances) {
          if (item.asset_type === 'native') {
            xlmBalance = parseFloat(item.balance);
          } else if (item.asset_code === 'USDC') {
            usdcBalance = parseFloat(item.balance);
          }
        }

        setBalances(prev => ({
          ...prev,
          XLM: parseFloat(xlmBalance.toFixed(2)),
          USDC: parseFloat(usdcBalance.toFixed(2))
        }));
        
        setDetectedNetwork(isTestnet ? 'Testnet' : 'Mainnet');
        setSyncStatus('success');
      } else {
        setDetectedNetwork('Simulated');
        setSyncStatus('error');
      }
    } catch (err) {
      console.error('Error syncing Stellar balances:', err);
      setDetectedNetwork('Simulated');
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 4000);
    }
  };

  useEffect(() => {
    syncStellarBalances(stellarAddress);
  }, [stellarAddress]);

  const executeDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setDepositError('Masukkan jumlah deposit yang valid');
      return;
    }
    setDepositError('');
    setDepositStep(2);
  };

  const confirmDepositPayment = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setDepositError('Jumlah deposit tidak valid');
      return;
    }

    if (!stellarAddress) {
      setDepositError('Wallet Stellar belum terhubung');
      return;
    }

    setIsDepositing(true);
    setDepositError('');

    // Step 1: Pastikan trustline USDC sudah ada (auto-sign via Freighter kalau belum)
    const trustline = await ensureTrustline(stellarAddress);

    if (!trustline.success) {
      setDepositError(trustline.error || 'Gagal setup trustline. Coba lagi.');
      setIsDepositing(false);
      return;
    }

    // Step 2: Kirim mUSDC dari faucet (langsung, ga perlu klik ulang)
    const result = await faucetDeposit(stellarAddress, amount);

    if (result.success && result.hash) {
      const amountIdr = amount * rates.USDC_TO_IDR;
      const newTx: Transaction = {
        id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'received',
        amount: amount,
        currency: 'USDC',
        amountIdr: amountIdr,
        destinationAddress: stellarAddress,
        sourceAddress: 'Lefta Faucet Testnet',
        timestamp: new Date().toISOString(),
        status: 'Success',
        notes: `Deposit ${amount} USDC via Faucet Testnet (On-Chain)`,
        txHash: result.hash
      };

      setTransactions(prev => [newTx, ...prev]);
      setDepositTxHash(result.hash);
      setDepositStep(3);
    } else {
      setDepositError(result.error || 'Deposit gagal. Coba lagi.');
    }

    setIsDepositing(false);
  };

  const handleInstantDeposit1000 = async () => {
    if (!stellarAddress) {
      setDepositError('Wallet Stellar belum terhubung');
      return;
    }

    setDepositAmount('1000');
    setDepositError('');
    setIsDepositing(true);

    const trustline = await ensureTrustline(stellarAddress);
    if (!trustline.success) {
      setDepositError(trustline.error || 'Gagal setup trustline. Coba lagi.');
      setIsDepositing(false);
      return;
    }

    const result = await faucetDeposit(stellarAddress, 1000);

    if (result.success && result.hash) {
      const amountIdr = 1000 * rates.USDC_TO_IDR;
      const newTx: Transaction = {
        id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'received',
        amount: 1000,
        currency: 'USDC',
        amountIdr: amountIdr,
        destinationAddress: stellarAddress,
        sourceAddress: 'Lefta Faucet Testnet',
        timestamp: new Date().toISOString(),
        status: 'Success',
        notes: `Deposit Testnet Instan +1.000 USDC (On-Chain)`,
        txHash: result.hash
      };

      setTransactions(prev => [newTx, ...prev]);
      setDepositTxHash(result.hash);
      setDepositStep(3);
    } else {
      setDepositError(result.error || 'Deposit gagal. Coba lagi.');
    }

    setIsDepositing(false);
  };

  const resetDepositForm = () => {
    setDepositAmount('');
    setDepositStep(1);
    setDepositError('');
    setDepositTxHash('');
    setIsDepositing(false);
    setShowDepositDrawer(false);
  };

  const filteredTransactions = transactions.filter(tx => {
    if (txFilter === 'all') return true;
    if (txFilter === 'sent') return tx.type === 'sent';
    if (txFilter === 'received') return tx.type === 'received';
    return true;
  });

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
    <div id="lefta-app-root" className="min-h-screen bg-surface-container/10 flex flex-col">
      {/* 1. Premium Responsive Header */}
      <header className="bg-surface/95 backdrop-blur-md sticky top-0 z-40 w-full border-b border-surface-container/80 py-3.5 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center w-full">
          {/* Left Brand Identity */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="text-primary w-5 h-5" />
            </div>
            <div>
              <h1 className="text-[20px] font-extrabold text-primary tracking-tight leading-none">Lefta</h1>
              <p className="text-[10px] text-on-surface-variant/80 font-medium tracking-wide mt-1 hidden sm:block">{t('brand.sub')}</p>
            </div>
          </div>

          {/* Center Header Tabs (Tablet & Desktop) */}
          <div className="hidden md:flex bg-surface-container p-1 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <HomeIcon className="w-3.5 h-3.5" /> {t('nav.home')}
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'templates'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> {t('nav.templates')}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <HistoryIcon className="w-3.5 h-3.5" /> {t('nav.history')}
            </button>
          </div>

          {/* Right Wallet Status Indicator & Language Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex bg-surface-container p-0.5 rounded-full border border-outline-variant/10 text-[10px] font-bold">
              <button
                onClick={() => setLanguage('ID')}
                className={`px-2 py-1 rounded-full transition-all cursor-pointer ${
                  language === 'ID'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                ID
              </button>
              <button
                onClick={() => setLanguage('EN')}
                className={`px-2 py-1 rounded-full transition-all cursor-pointer ${
                  language === 'EN'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                EN
              </button>
            </div>

            <button
              onClick={() => wallet.isConnected ? wallet.disconnect() : wallet.connect()}
              className={`bg-surface-container hover:bg-primary-container/20 active:scale-95 transition-all rounded-full px-3.5 py-1.5 flex items-center gap-2 border border-outline-variant/10 cursor-pointer min-h-[38px] ${
                wallet.error ? 'border-red-500/50' : ''
              }`}
              title={wallet.error || (wallet.isConnected ? 'Disconnect Wallet' : 'Connect Wallet')}
            >
              {wallet.isConnecting ? (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-amber-600">Connecting...</span>
                </>
              ) : wallet.isConnected ? (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="font-mono text-xs font-bold text-on-surface tracking-wider">
                    {stellarAddress.slice(0, 4)}...{stellarAddress.slice(-4)}
                  </span>
                  <LogOut className="w-3 h-3 text-on-surface-variant" />
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 text-on-surface-variant" />
                  <span className="text-xs font-bold text-on-surface-variant">
                    Connect
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {wallet.error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{wallet.error}</p>
          </div>
        </div>
      )}

      {/* 2. Responsive Main Layout */}
      <main className="w-full max-w-6xl mx-auto px-4 py-6 flex-grow flex flex-col gap-6 pb-28 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
          {/* Left/Main Workspace Area */}
          <div className="lg:col-span-8 flex flex-col gap-6 w-full">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {activeTab === 'home' && (
                  <HomeTab
                    balances={balances}
                    isSyncing={isSyncing}
                    syncStatus={syncStatus}
                    detectedNetwork={detectedNetwork}
                    syncStellarBalances={syncStellarBalances}
                    setSendStep={setSendStep}
                    setShowSendDrawer={setShowSendDrawer}
                    setDepositStep={setDepositStep}
                    setDepositAmount={setDepositAmount}
                    setDepositError={setDepositError}
                    setShowDepositDrawer={setShowDepositDrawer}
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
                    setIsSplitActive={setIsSplitActive}
                    setSplitPreset={setSplitPreset}
                    setSplitAllocations={setSplitAllocations}
                    setSendStep={setSendStep}
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
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Desktop Sidebar Widget */}
          <SidebarWidget
            stellarAddress={stellarAddress}
            copiedAddress={copiedAddress}
            handleCopyAddress={handleCopyAddress}
            handleResetWalletCache={handleResetWalletCache}
          />
        </div>
      </main>

      {/* Sticky Bottom Navigation Bar for Mobile */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Mobile Footer */}
      <div className="lg:hidden text-center pb-24 pt-4 text-[10px] text-on-surface-variant/50 flex flex-col gap-0.5 px-4">
        <p className="font-bold">Lefta Web3 Remittance Service Indonesia</p>
        <p>Memajukan inklusi keuangan keluarga pekerja migran lewat Jaringan Stellar Blockchain.</p>
      </div>

      {/* Modals & Drawers */}
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
        setDepositStep={setDepositStep}
        setDepositAmount={setDepositAmount}
        setDepositError={setDepositError}
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
        depositAmount={depositAmount}
        setDepositAmount={setDepositAmount}
        depositStep={depositStep}
        setDepositStep={setDepositStep}
        depositError={depositError}
        setDepositError={setDepositError}
        executeDeposit={executeDeposit}
        confirmDepositPayment={confirmDepositPayment}
        handleInstantDeposit1000={handleInstantDeposit1000}
        resetDepositForm={resetDepositForm}
        isDepositing={isDepositing}
        depositTxHash={depositTxHash}
      />

      <SendDrawer
        showSendDrawer={showSendDrawer}
        resetSendForm={resetSendForm}
        sendStep={sendStep}
        setSendStep={setSendStep}
        contactSearch={contactSearch}
        setContactSearch={setContactSearch}
        contacts={contacts}
        selectedContact={selectedContact}
        setSelectedContact={setSelectedContact}
        customAddress={customAddress}
        setCustomAddress={setCustomAddress}
        addressError={addressError}
        handleNextToAmount={handleNextToAmount}
        amountError={amountError}
        setAmountError={setAmountError}
        balances={balances}
        sendAmount={sendAmount}
        setSendAmount={setSendAmount}
        sendNotes={sendNotes}
        setSendNotes={setSendNotes}
        isSplitActive={isSplitActive}
        setIsSplitActive={setIsSplitActive}
        budgetTemplates={budgetTemplates}
        setBudgetTemplates={setBudgetTemplates}
        splitPreset={splitPreset}
        setSplitPreset={setSplitPreset}
        splitAllocations={splitAllocations}
        setSplitAllocations={setSplitAllocations}
        showSaveTemplateForm={showSaveTemplateForm}
        setShowSaveTemplateForm={setShowSaveTemplateForm}
        newTemplateName={newTemplateName}
        setNewTemplateName={setNewTemplateName}
        templateSaveSuccess={templateSaveSuccess}
        setTemplateSaveSuccess={setTemplateSaveSuccess}
        handleNextToConfirm={handleNextToConfirm}
        executeSendTransaction={executeSendTransaction}
        isSending={isSending}
        stellarAddress={stellarAddress}
        copiedHash={copiedHash}
        handleCopyHash={handleCopyHash}
      />
    </div>
  );
}
