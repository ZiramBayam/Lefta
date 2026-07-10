'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { WalletButton } from '@/components/WalletButton';
import { Spinner } from '@/components/ui/Spinner';
import { RecipientDashboard } from '@/components/RecipientDashboard';
import { getRecipientHistory, getTransfer } from '@/lib/contracts';
import type { TransferRecord } from '@/types';

export default function ReceivePage() {
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
      const ids = await getRecipientHistory(address);
      const records: TransferRecord[] = [];
      for (const id of ids.slice(0, 50)) {
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
          <div className="text-center">
            <p className="text-body-lg text-outline mb-lg">
              Connect wallet dulu untuk cek penerimaan
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 px-margin-mobile py-lg space-y-lg max-w-md mx-auto w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-xl">
            <Spinner />
          </div>
        ) : address ? (
          <RecipientDashboard
            transfers={transfers}
            currentAddress={address}
          />
        ) : null}

        {/* History link */}
        <div className="pt-md text-center">
          <Link href="/receive/history" className="text-label-lg text-secondary hover:underline">
            Lihat Riwayat Lengkap →
          </Link>
        </div>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="p-margin-mobile pt-xl pb-lg flex items-center justify-between">
      <div className="flex items-center gap-md">
        <Link href="/" className="text-on-surface hover:text-primary">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-headline-md text-on-surface font-bold">Cek Penerimaan</h1>
      </div>
      <WalletButton />
    </header>
  );
}
