'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { WalletButton } from '@/components/WalletButton';
import { Spinner } from '@/components/ui/Spinner';
import { getSenderHistory, getTransfer } from '@/lib/contracts';
import type { TransferRecord } from '@/types';
import { stroopsToUsdc, truncateAddress, formatDate } from '@/types';

export default function SendHistoryPage() {
  const { address, isConnected } = useWallet();
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (address) {
      loadHistory();
    }
  }, [address]);

  const loadHistory = async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const ids = await getSenderHistory(address);
      const records: TransferRecord[] = [];
      for (const id of ids.slice(0, 20)) {
        try {
          const transfer = await getTransfer(id);
          records.push(transfer);
        } catch {
          // Skip failed reads
        }
      }
      setTransfers(records);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-margin-mobile">
          <p className="text-body-lg text-outline">Connect wallet dulu</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 px-margin-mobile py-lg space-y-lg max-w-md mx-auto w-full">
        <h2 className="text-headline-sm text-on-surface">Riwayat Kirim</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-xl">
            <Spinner />
          </div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-xl">
            <p className="text-body-md text-outline">Belum ada riwayat kirim</p>
          </div>
        ) : (
          <div className="space-y-sm">
            {transfers.map(transfer => (
              <div key={transfer.id} className="p-md bg-surface-container rounded-lg">
                <div className="flex items-center justify-between mb-sm">
                  <span className="text-label-sm text-outline">
                    {formatDate(transfer.timestamp)}
                  </span>
                  <span className="text-body-lg font-semibold text-primary">
                    ${stroopsToUsdc(transfer.totalAmount)} USDC
                  </span>
                </div>
                <div className="space-y-xs">
                  {transfer.splits.map((split, i) => (
                    <div key={i} className="flex items-center justify-between text-body-sm">
                      <span className="text-on-surface">{split.label}</span>
                      <span className="text-outline">
                        ${stroopsToUsdc(split.amount)} → {truncateAddress(split.recipient)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="p-margin-mobile pt-xl pb-lg flex items-center justify-between">
      <div className="flex items-center gap-md">
        <Link href="/send" className="text-on-surface hover:text-primary">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-headline-md text-on-surface font-bold">Riwayat</h1>
      </div>
      <WalletButton />
    </header>
  );
}
