'use client';

import { useState, useEffect, useCallback } from 'react';
import { WalletBalances } from '@/lib/types';

export function useStellarSync(stellarAddress: string) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [detectedNetwork, setDetectedNetwork] = useState<'Testnet' | 'Mainnet' | 'Simulated'>('Simulated');

  const syncStellarBalances = useCallback(async (
    addressToSync: string,
    onBalancesUpdate: (balances: Partial<WalletBalances>) => void,
  ) => {
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
        const preferredIssuer = process.env.NEXT_PUBLIC_USDC_ISSUER || '';

        for (const item of apiBalances) {
          if (item.asset_type === 'native') {
            xlmBalance = parseFloat(item.balance);
          } else if (item.asset_code === 'USDC') {
            const bal = parseFloat(item.balance);
            // Jika ada preferred issuer, prioritaskan issuer tersebut
            // Jika tidak ada atau issuer cocok, ambil yang balancenya terbesar
            if (preferredIssuer && item.asset_issuer === preferredIssuer) {
              usdcBalance = bal;
              break; // sudah ketemu issuer yang tepat, stop
            } else if (bal > usdcBalance) {
              usdcBalance = bal; // fallback: ambil balance terbesar
            }
          }
        }

        onBalancesUpdate({
          XLM: parseFloat(xlmBalance.toFixed(2)),
          USDC: parseFloat(usdcBalance.toFixed(2)),
        });

        setDetectedNetwork(isTestnet ? 'Testnet' : 'Mainnet');
        setSyncStatus('success');
      } else {
        setDetectedNetwork('Simulated');
        setSyncStatus('error');
      }
    } catch {
      setDetectedNetwork('Simulated');
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 4000);
    }
  }, []);

  return {
    isSyncing,
    syncStatus,
    detectedNetwork,
    syncStellarBalances,
  };
}
