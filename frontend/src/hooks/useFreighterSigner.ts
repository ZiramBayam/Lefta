'use client';

import { useCallback, useState } from 'react';
import { Server } from '@stellar/stellar-sdk/rpc';
import {
  TransactionBuilder,
  Transaction,
  BASE_FEE,
  Operation,
  Asset,
  Memo,
} from '@stellar/stellar-sdk';
import {
  isConnected,
  getAddress,
  signTransaction,
} from '@stellar/freighter-api';

import { NETWORK_CONFIG, TOKEN_ADDRESSES } from '@/contracts/config';

// Soroban RPC Server
let rpcServer: Server | null = null;

function getRpcServer(): Server {
  if (!rpcServer) {
    rpcServer = new Server(NETWORK_CONFIG.rpcUrl);
  }
  return rpcServer;
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  xdr?: string;
  error?: string;
}

export interface SendPaymentParams {
  destination: string;
  amount: string;
  assetCode?: 'USDC' | 'XLM';
  memo?: string;
}

export interface UseFreighterSignerReturn {
  isReady: boolean;
  publicKey: string | null;
  error: string | null;
  checkConnection: () => Promise<boolean>;
  signAndSubmitTransaction: (params: SendPaymentParams) => Promise<TransactionResult>;
  getBalance: (publicKey: string) => Promise<{ xlm: number; usdc: number }>;
}

export function useFreighterSigner(): UseFreighterSignerReturn {
  const [isReady, setIsReady] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      const connectedResult = await isConnected();
      if (connectedResult.error || !connectedResult.isConnected) {
        setError('Freighter wallet not connected');
        setIsReady(false);
        setPublicKey(null);
        return false;
      }

      const addressResult = await getAddress();
      if (addressResult.error || !addressResult.address) {
        setError(addressResult.error || 'No public key found');
        setIsReady(false);
        return false;
      }

      setPublicKey(addressResult.address);
      setIsReady(true);
      return true;
    } catch (err) {
      console.error('[Freighter] Connection check failed:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsReady(false);
      setPublicKey(null);
      return false;
    }
  }, []);

  const getBalance = useCallback(async (pubKey: string): Promise<{ xlm: number; usdc: number }> => {
    try {
      const response = await fetch(
        `${NETWORK_CONFIG.horizonUrl}/accounts/${pubKey}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch account');
      }

      const data = await response.json();
      const balances = data.balances || [];

      let xlm = 0;
      let usdc = 0;

      for (const balance of balances) {
        if (balance.asset_type === 'native') {
          xlm = parseFloat(balance.balance);
        } else if (
          balance.asset_code === 'USDC' &&
          balance.asset_issuer === TOKEN_ADDRESSES.usdc
        ) {
          usdc = parseFloat(balance.balance);
        }
      }

      return { xlm, usdc };
    } catch (err) {
      console.error('[Freighter] Get balance failed:', err);
      return { xlm: 0, usdc: 0 };
    }
  }, []);

  const signAndSubmitTransaction = useCallback(async ({
    destination,
    amount,
    assetCode = 'XLM',
    memo,
  }: SendPaymentParams): Promise<TransactionResult> => {
    try {
      setError(null);

      // Check connection
      const connectedResult = await isConnected();
      if (connectedResult.error || !connectedResult.isConnected) {
        throw new Error('Freighter wallet not connected');
      }

      const addressResult = await getAddress();
      if (addressResult.error || !addressResult.address) {
        throw new Error(addressResult.error || 'No public key found');
      }

      const pubKey = addressResult.address;
      const server = getRpcServer();

      // Get source account
      const sourceAccount = await server.getAccount(pubKey);

      // Build transaction
      const transactionBuilder = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_CONFIG.networkPassphrase,
      });

      // Add payment operation
      if (assetCode === 'XLM') {
        transactionBuilder.addOperation(
          Operation.payment({
            destination,
            asset: Asset.native(),
            amount,
          })
        );
      } else {
        // USDC payment
        transactionBuilder.addOperation(
          Operation.payment({
            destination,
            asset: new Asset('USDC', TOKEN_ADDRESSES.usdc),
            amount,
          })
        );
      }

      // Add memo if provided
      if (memo) {
        transactionBuilder.addMemo(Memo.text(memo));
      }

      transactionBuilder.setTimeout(300);
      const transaction = transactionBuilder.build();

      // Sign with Freighter
      const signResult = await signTransaction(transaction.toXDR(), {
        networkPassphrase: NETWORK_CONFIG.networkPassphrase,
      });

      if (signResult.error) {
        throw new Error(signResult.error);
      }

      // Parse the signed transaction from XDR
      const signedTransaction = TransactionBuilder.fromXDR(
        signResult.signedTxXdr,
        NETWORK_CONFIG.networkPassphrase
      );

      // Submit transaction
      const result = await server.sendTransaction(signedTransaction);

      if (result.status === 'ERROR') {
        throw new Error('Transaction failed');
      }

      // Wait for confirmation
      const confirmResult = await server.pollTransaction(result.hash);

      if (confirmResult.status === 'FAILED') {
        return {
          success: false,
          hash: result.hash,
          error: 'Transaction failed',
        };
      }

      return {
        success: true,
        hash: result.hash,
        xdr: signResult.signedTxXdr,
      };
    } catch (err) {
      console.error('[Freighter] Transaction failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  return {
    isReady,
    publicKey,
    error,
    checkConnection,
    signAndSubmitTransaction,
    getBalance,
  };
}
