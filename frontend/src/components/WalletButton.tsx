'use client';

import React from 'react';
import { useWallet } from '@/context/WalletContext';

export function WalletButton() {
  const { isConnected, isConnecting, publicKey, network, connect, disconnect, error } = useWallet();

  if (isConnected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-end">
          <span className="text-xs text-on-surface-variant">
            {network === 'TESTNET' ? 'Testnet' : 'Public'}
          </span>
          <span className="font-mono text-xs font-bold">
            {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
          </span>
        </div>
        <button
          onClick={disconnect}
          className="px-3 py-1.5 bg-surface-container rounded-full text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-error">{error}</span>
      )}
      <button
        onClick={connect}
        disabled={isConnecting}
        className="px-4 py-2 bg-primary text-white rounded-full text-sm font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  );
}

export function WalletStatus() {
  const { isConnected, publicKey, network } = useWallet();

  if (!isConnected || !publicKey) {
    return null;
  }

  return (
    <span className="text-xs text-emerald-600">
      {network === 'TESTNET' ? 'Testnet' : 'Mainnet'}: {publicKey.slice(0, 6)}...{publicKey.slice(-4)}
    </span>
  );
}
