export interface Allocation {
  label: string;
  recipient: string;
  basisPoints: number; // 0-10000
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

export const stroopsToUsdc = (stroops: bigint): string =>
  (Number(stroops) / 1_000_000).toFixed(2);

export const usdcToStroops = (usdc: number): bigint =>
  BigInt(Math.round(usdc * 1_000_000));

export const basisPointsToPercent = (bp: number): string =>
  (bp / 100).toFixed(0) + '%';

export const truncateAddress = (address: string): string => {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const ERROR_MESSAGES: Record<string, string> = {
  InvalidBasisPoints: 'Total persentase harus tepat 100%',
  TooManyAllocations: 'Maksimal 5 pos per template',
  DuplicateRecipient: 'Satu wallet tidak bisa muncul dua kali',
  LabelTooLong: 'Label maksimal 20 karakter',
  TemplateInactive: 'Template ini sudah tidak aktif',
  BelowMinimumAmount: 'Minimum transfer 1 USDC',
  USER_REJECTED: 'Transaksi dibatalkan',
  TemplateNotFound: 'Template tidak ditemukan',
  Unauthorized: 'Anda tidak memiliki akses ke template ini',
};
