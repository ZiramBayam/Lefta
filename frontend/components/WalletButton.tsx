'use client';

import React from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { truncateAddress } from '@/types';

export function WalletButton() {
  const { address, isConnected, isLoading, connect, disconnect } = useWallet();

  if (isLoading) {
    return (
      <Button disabled size="md">
        <Spinner size="sm" />
        <span className="ml-2">Menghubungkan...</span>
      </Button>
    );
  }

  if (!isConnected || !address) {
    return (
      <Button onClick={connect} variant="primary" size="md">
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="relative group">
      <Button
        variant="secondary"
        size="md"
        onClick={disconnect}
        className="group-hover:bg-error group-hover:text-on-error transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
        {truncateAddress(address)}
      </Button>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-surface-container-highest text-label-sm text-on-surface rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Klik untuk disconnect
      </div>
    </div>
  );
}
