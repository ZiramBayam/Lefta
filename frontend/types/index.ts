// TypeScript types for Lefta RemitSplit

export interface Allocation {
  label: string;
  recipient: string;
  basisPoints: number; // 0–10000 (100% = 10000)
}

export interface SplitTemplate {
  id: string;
  sender: string;
  allocations: Allocation[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SplitResult {
  recipient: string;
  label: string;
  amount: bigint;
}

export interface TransferRecord {
  id: string;
  sender: string;
  templateId: string;
  totalAmount: bigint;
  timestamp: number;
  splits: SplitResult[];
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export type TransactionStatus = "idle" | "waiting" | "success" | "error";

// Utility functions
export const stroopsToUsdc = (stroops: bigint): string =>
  (Number(stroops) / 1_000_000).toFixed(2);

export const usdcToStroops = (usdc: number): bigint =>
  BigInt(Math.round(usdc * 1_000_000));

export const basisPointsToPercent = (bp: number): string =>
  (bp / 100).toFixed(0);

export const truncateAddress = (address: string, chars = 4): string => {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

export const calculateAllocation = (
  totalAmount: number,
  basisPoints: number
): number => {
  return (totalAmount * basisPoints) / 10000;
};

// Error messages mapping
export const ERROR_MESSAGES: Record<string, string> = {
  InvalidBasisPoints: "Total persentase harus tepat 100%",
  TooManyAllocations: "Maksimal 5 pos per template",
  DuplicateRecipient: "Satu wallet tidak bisa muncul dua kali",
  LabelTooLong: "Label maksimal 20 karakter",
  TemplateInactive: "Template ini sudah tidak aktif",
  BelowMinimumAmount: "Minimum transfer 1 USDC",
  USER_REJECTED: "Transaksi dibatalkan",
  INSUFFICIENT_BALANCE: "Saldo tidak cukup untuk transaksi ini",
  NETWORK_ERROR: "Gagal terhubung ke jaringan Stellar",
  TIMEOUT: "Permintaan timeout, coba lagi",
};
