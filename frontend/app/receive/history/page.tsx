'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { WalletButton } from '@/components/WalletButton';
import { Spinner } from '@/components/ui/Spinner';
import { getRecipientHistory, getTransfer } from '@/lib/contracts';
import type { TransferRecord } from '@/types';
import { stroopsToUsdc, truncateAddress, formatDate } from '@/types';

export default function ReceiveHistoryPage() {
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
          <p className="text-body-lg text-outline">Connect wallet dulu</p>
        </main>
      </div>
    );
  }

  // Filter only transfers where this address is a recipient
  const myTransfers = transfers.filter(t =>
    t.splits.some(s => s.recipient === address)
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 px-margin-mobile py-lg space-y-lg max-w-md mx-auto w-full">
        <h2 className="text-headline-sm text-on-surface">Riwayat Penerimaan</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-xl">
            <Spinner />
          </div>
        ) : myTransfers.length === 0 ? (
          <div className="text-center py-xl">
            <p className="text-body-md text-outline">Belum ada penerimaan</p>
          </div>
        ) : (
          <div className="space-y-sm">
            {myTransfers.map(transfer => {
              const mySplit = transfer.splits.find(s => s.recipient === address);
              if (!mySplit) return null;

              return (
                <div key={transfer.id} className="p-md bg-surface-container rounded-lg">
                  <div className="flex items-center justify-between mb-sm">
                    <div>
                      <p className="text-body-sm text-on-surface">
                        Dari: {truncateAddress(transfer.sender)}
                      </p>
                      <p className="text-label-sm text-outline">
                        {formatDate(transfer.timestamp)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-body-lg font-semibold text-primary">
                        +${stroopsToUsdc(mySplit.amount)} USDC
                      </p>
                      <p className="text-label-sm text-outline">{mySplit.label}</p>
                    </div>
                  </div>
                </div>
              );
            })}
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
        <Link href="/receive" className="text-on-surface hover:text-primary">
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
