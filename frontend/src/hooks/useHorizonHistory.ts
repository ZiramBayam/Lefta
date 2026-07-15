'use client';

import { useState, useCallback } from 'react';
import { Transaction } from '@/lib/types';

const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const USDC_ISSUER = process.env.NEXT_PUBLIC_USDC_ISSUER || '';
const USDC_TO_IDR = 18080; // fallback rate, akan di-override dari context

interface UseHorizonHistoryReturn {
  isFetchingHistory: boolean;
  fetchHorizonHistory: (address: string, usdcToIdr: number) => Promise<Transaction[]>;
}

export function useHorizonHistory(): UseHorizonHistoryReturn {
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  const fetchHorizonHistory = useCallback(async (
    address: string,
    usdcToIdr: number,
  ): Promise<Transaction[]> => {
    if (!address || !address.startsWith('G')) return [];

    setIsFetchingHistory(true);
    try {
      // Fetch payments yang melibatkan address ini (max 100 transaksi terbaru)
      const res = await fetch(
        `${HORIZON_URL}/accounts/${address}/payments?limit=100&order=desc&include_failed=false`
      );
      if (!res.ok) return [];

      const data = await res.json();
      const records = data?._embedded?.records || [];

      const rate = usdcToIdr || USDC_TO_IDR;
      const transactions: Transaction[] = [];

      for (const op of records) {
        // Hanya proses payment operations
        if (op.type !== 'payment' && op.type !== 'create_account') continue;

        let amount = 0;
        let currency = 'XLM';
        let isSent = false;

        if (op.type === 'payment') {
          // Filter: hanya tampilkan USDC atau XLM
          if (op.asset_type === 'native') {
            currency = 'XLM';
            amount = parseFloat(op.amount);
          } else if (
            op.asset_code === 'USDC' &&
            (!USDC_ISSUER || op.asset_issuer === USDC_ISSUER)
          ) {
            currency = 'USDC';
            amount = parseFloat(op.amount);
          } else {
            continue; // skip aset lain
          }

          isSent = op.from === address;
        } else if (op.type === 'create_account') {
          // Account creation — biasanya XLM awal
          currency = 'XLM';
          amount = parseFloat(op.starting_balance || '0');
          isSent = op.funder === address;
        }

        if (amount <= 0) continue;

        const amountIdr = currency === 'USDC' ? amount * rate : 0;

        transactions.push({
          id: op.id,
          type: isSent ? 'sent' : 'received',
          amount,
          currency,
          amountIdr,
          destinationAddress: op.to || op.account || '',
          sourceAddress: op.from || op.funder || '',
          timestamp: op.created_at,
          status: 'Success',
          notes: op.transaction_memo || '',
          txHash: op.transaction_hash || '',
        });
      }

      return transactions;
    } catch {
      return [];
    } finally {
      setIsFetchingHistory(false);
    }
  }, []);

  return { isFetchingHistory, fetchHorizonHistory };
}
