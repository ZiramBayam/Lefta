'use client';

import { useState, useCallback } from 'react';
import { signTransaction as signXdr } from '@/lib/freighter';
import { TransactionBuilder } from '@stellar/stellar-sdk';
import { rpc } from '@stellar/stellar-sdk';
import { SOROBAN_RPC, NETWORK_PASSPHRASE, connectWallet } from '@/lib/freighter';
import type { WalletState } from '@/types';

const server = new rpc.Server(SOROBAN_RPC);

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isLoading: false,
    error: null,
  });

  const connect = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const address = await connectWallet();
      setState({ address, isConnected: true, isLoading: false, error: null });
    } catch (e) {
      setState(s => ({
        ...s,
        isLoading: false,
        error: e instanceof Error ? e.message : 'Gagal connect wallet',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({ address: null, isConnected: false, isLoading: false, error: null });
  }, []);

  const signAndSubmit = useCallback(
    async (
      unsignedXdr: string
    ): Promise<rpc.Api.GetSuccessfulTransactionResponse> => {
      if (!state.address) {
        throw new Error('Wallet belum terhubung');
      }

      let signedXdr: string;
      try {
        signedXdr = await signXdr(unsignedXdr, NETWORK_PASSPHRASE);
      } catch {
        throw new Error('USER_REJECTED');
      }

      const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
      const sendResult = await server.sendTransaction(tx);

      if (sendResult.status !== 'PENDING') {
        throw new Error(`Submit gagal: ${sendResult.status}`);
      }

      let getResult = await server.getTransaction(sendResult.hash);
      let attempts = 0;
      const maxAttempts = 15;

      while (getResult.status === 'NOT_FOUND' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        getResult = await server.getTransaction(sendResult.hash);
        attempts++;
      }

      if (getResult.status === 'SUCCESS') {
        return getResult as rpc.Api.GetSuccessfulTransactionResponse;
      } else if (getResult.status === 'FAILED') {
        throw new Error('Transaksi gagal. Silakan coba lagi.');
      } else {
        throw new Error('Timeout menunggu konfirmasi transaksi');
      }
    },
    [state.address]
  );

  return { ...state, connect, disconnect, signAndSubmit };
}
