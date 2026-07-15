'use client';

import { useState } from 'react';
import { Transaction } from '@/lib/types';
import { ensureTrustline, faucetDeposit } from '@/contracts/api';

interface UseDepositFlowParams {
  stellarAddress: string;
  rates: { USDC_TO_IDR: number };
  setTransactions: (updater: (prev: Transaction[]) => Transaction[]) => void;
}

export function useDepositFlow({ stellarAddress, rates, setTransactions }: UseDepositFlowParams) {
  const [depositAmount, setDepositAmount] = useState('');
  const [depositStep, setDepositStep] = useState<1 | 2 | 3>(1);
  const [depositError, setDepositError] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositTxHash, setDepositTxHash] = useState('');

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

    const trustline = await ensureTrustline(stellarAddress);

    if (!trustline.success) {
      setDepositError(trustline.error || 'Gagal setup trustline. Coba lagi.');
      setIsDepositing(false);
      return;
    }

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
        txHash: result.hash,
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
        notes: 'Deposit Testnet Instan +1.000 USDC (On-Chain)',
        txHash: result.hash,
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
  };

  return {
    depositAmount, setDepositAmount,
    depositStep, setDepositStep,
    depositError, setDepositError,
    isDepositing,
    depositTxHash,
    executeDeposit,
    confirmDepositPayment,
    handleInstantDeposit1000,
    resetDepositForm,
  };
}
