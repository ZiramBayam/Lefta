'use client';

import { useState } from 'react';
import { Contact, Transaction, WalletBalances } from '@/lib/types';
import { sendPayment } from '@/contracts/api';

export interface BudgetSplitAlloc {
  category: string;
  percentage: number;
}

interface UseSendFlowParams {
  balances: WalletBalances;
  rates: { USDC_TO_IDR: number };
  stellarAddress: string;
  setTransactions: (updater: (prev: Transaction[]) => Transaction[]) => void;
}

export function useSendFlow({ balances, rates, stellarAddress, setTransactions }: UseSendFlowParams) {
  const [sendStep, setSendStep] = useState(1);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [customAddress, setCustomAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendNotes, setSendNotes] = useState('');
  const [sendTxHash, setSendTxHash] = useState('');
  const [addressError, setAddressError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [isSplitActive, setIsSplitActive] = useState(false);
  const [splitAllocations, setSplitAllocations] = useState<BudgetSplitAlloc[]>([
    { category: 'Kebutuhan Rumah Tangga', percentage: 45 },
    { category: 'Modal Usaha', percentage: 20 },
    { category: 'Renovasi Rumah', percentage: 10 },
    { category: 'Pendidikan Keluarga', percentage: 15 },
    { category: 'Dana Darurat & Kesehatan', percentage: 10 },
  ]);
  const [splitPreset, setSplitPreset] = useState('household');

  const [contactSearch, setContactSearch] = useState('');

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

      const txResult = await sendPayment({
        destination: destAddr,
        amount: sendAmount,
        asset: 'USDC',
        memo: sendNotes || undefined,
      });
      if (!txResult.success || !txResult.hash) {
        throw new Error(txResult.error || 'Gagal mengirim transaksi');
      }
      const txHash = txResult.hash;
      const notes = `Kirim USDC ke ${selectedContact?.name || 'Alamat Stellar'}`;

      setSendTxHash(txHash);

      // Build splits data for transaction history
      const txSplits = isSplitActive
        ? splitAllocations
            .filter(a => a.percentage > 0)
            .map(alloc => {
              const itemAmount = (numAmount * alloc.percentage) / 100;
              return {
                category: alloc.category,
                percentage: alloc.percentage,
                amount: itemAmount,
                amountIdr: itemAmount * rates.USDC_TO_IDR,
              };
            })
        : undefined;

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
        splits: txSplits,
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
  };

  return {
    sendStep, setSendStep,
    selectedContact, setSelectedContact,
    customAddress, setCustomAddress,
    sendAmount, setSendAmount,
    sendNotes, setSendNotes,
    sendTxHash,
    addressError, setAddressError,
    amountError, setAmountError,
    isSending,
    contactSearch, setContactSearch,
    isSplitActive, setIsSplitActive,
    splitAllocations, setSplitAllocations,
    splitPreset, setSplitPreset,
    handleNextToAmount,
    handleNextToConfirm,
    executeSendTransaction,
    resetSendForm,
  };
}
