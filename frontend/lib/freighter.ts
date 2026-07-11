// Wallet helpers for Freighter wallet integration
import { WalletState } from "@/types";

// Network constants
export const NETWORK_PASSPHRASE =
  "Test SDF Network ; September 2015";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";

// Check if Freighter wallet is installed
export const checkFreighterInstalled = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  return await (window as unknown as {.freighterApi?: { isConnected?: () => Promise<boolean> } }).freighterApi?.isConnected?.() ?? false;
};

// Connect wallet using Freighter
export const connectWallet = async (): Promise<string> => {
  if (typeof window === "undefined") {
    throw new Error("Wallet connection only available in browser");
  }

  const freighter = (window as unknown as {
    freighterApi?: {
      isConnected?: () => Promise<boolean>;
      getAddress?: () => Promise<string>;
      signTransaction?: (txXdr: string, opts?: Record<string, unknown>) => Promise<string>;
    };
  }).freighterApi;

  if (!freighter) {
    throw new Error("Freighter wallet tidak ditemukan. Silakan install Freighter terlebih dahulu.");
  }

  // Check connection
  const isConnected = await freighter.isConnected?.();
  if (!isConnected) {
    throw new Error("Freighter belum terhubung. Silakan buka Freighter dan hubungkan wallet.");
  }

  // Get address
  const address = await freighter.getAddress?.();
  if (!address) {
    throw new Error("Tidak dapat mengambil alamat wallet");
  }

  return address;
};

// Get current wallet address
export const getWalletAddress = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;

  const freighter = (window as unknown as {
    freighterApi?: {
      isConnected?: () => Promise<boolean>;
      getAddress?: () => Promise<string>;
    };
  }).freighterApi;

  if (!freighter) return null;

  try {
    const isConnected = await freighter.isConnected?.();
    if (!isConnected) return null;

    return await freighter.getAddress?.() ?? null;
  } catch {
    return null;
  }
};

// Sign XDR transaction
export const signXdr = async (
  xdr: string,
  networkPassphrase: string
): Promise<string> => {
  if (typeof window === "undefined") {
    throw new Error("Transaction signing only available in browser");
  }

  const freighter = (window as unknown as {
    freighterApi?: {
      signTransaction?: (txXdr: string, opts?: Record<string, unknown>) => Promise<string>;
    };
  }).freighterApi;

  if (!freighter?.signTransaction) {
    throw new Error("Freighter tidak支持签名功能");
  }

  return await freighter.signTransaction(xdr, {
    network: networkPassphrase,
  });
};

// Create wallet state hook helper
export const createWalletState = (): WalletState => ({
  address: null,
  isConnected: false,
  isLoading: false,
  error: null,
});

// Freighter available type declaration
declare global {
  interface Window {
    freighterApi?: {
      isConnected?: () => Promise<boolean>;
      getAddress?: () => Promise<string>;
      signTransaction?: (txXdr: string, opts?: Record<string, unknown>) => Promise<string>;
    };
  }
}
