'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { isConnected, requestAccess, getNetwork, getAddress, WatchWalletChanges } from '@stellar/freighter-api';

type Network = 'PUBLIC' | 'TESTNET';

interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  publicKey: string | null;
  network: Network;
  error: string | null;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
    publicKey: null,
    network: 'TESTNET' as Network,
    error: null,
  });

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window === 'undefined') return;

      try {
        const result = await isConnected();
        if (result.isConnected) {
          const [addressResult, networkResult] = await Promise.all([
            getAddress(),
            getNetwork(),
          ]);
          if (addressResult.address) {
            setState({
              isConnected: true,
              isConnecting: false,
              publicKey: addressResult.address,
              network: (networkResult?.network === 'PUBLIC' ? 'PUBLIC' : 'TESTNET') as Network,
              error: null,
            });
          }
        }
      } catch (err) {
        console.error('[Wallet] Connection check failed:', err);
      }
    };

    const timer = setTimeout(checkConnection, 1000);
    return () => clearTimeout(timer);
  }, []);

  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const probe = await Promise.race([
        isConnected().then(() => true),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1500)),
      ]);

      if (!probe) {
        window.open('https://freighter.app/', '_blank');
        setState(prev => ({ ...prev, isConnecting: false }));
        return;
      }

      const accessResult = await requestAccess();
      if (!accessResult.address || accessResult.error) {
        throw new Error(accessResult.error?.message || 'No address returned from wallet');
      }

      const networkResult = await getNetwork();

      setState({
        isConnected: true,
        isConnecting: false,
        publicKey: accessResult.address,
        network: (networkResult?.network === 'PUBLIC' ? 'PUBLIC' : 'TESTNET') as Network,
        error: null,
      });
    } catch (err) {
      console.error('[Wallet] Connect failed:', err);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: err instanceof Error ? err.message : 'Connection failed',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      isConnecting: false,
      publicKey: null,
      network: 'TESTNET' as Network,
      error: null,
    });
  }, []);

  useEffect(() => {
    if (!state.isConnected || typeof window === 'undefined') return;

    try {
      const changes = new WatchWalletChanges();
      changes.watch((params) => {
        if (params.address && params.address !== state.publicKey) {
          setState(prev => ({ ...prev, publicKey: params.address }));
        }
        if (params.network) {
          setState(prev => ({ ...prev, network: params.network as Network }));
        }
      });
      return () => changes.stop();
    } catch {
      // WatchWalletChanges not available
    }
  }, [state.isConnected, state.publicKey]);

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
