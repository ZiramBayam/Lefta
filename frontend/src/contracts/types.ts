/**
 * TypeScript types untuk contract interactions
 */

// Allocation - per category dengan recipient address
export interface Allocation {
  label: string;      // "Kebutuhan Rumah"
  recipient: string;   // Stellar address (G...)
  basisPoints: number; // 4500 = 45%
}

// Template yang disimpan di contract
export interface StoredTemplate {
  sender: string;     // Siapa yang bikin
  name: string;       // "Belanja Ibu"
  allocations: Allocation[];
  isActive: boolean;
}

// Result dari split calculation
export interface SplitResult {
  recipient: string;
  label: string;
  amount: string;      // BigInt as string (JS can't handle u128)
}

// Transfer record dari contract
export interface TransferRecord {
  id: string;
  sender: string;
  to: string;
  amount: string;
  timestamp: number;
}

// Contract errors
export enum ContractError {
  TransferNotFound = 1,
  TemplateNotFound = 2,
  TemplateInactive = 3,
  Unauthorized = 4,
  BelowMinimumAmount = 5,
  TooManyAllocations = 6,
  EmptyAllocations = 7,
  InvalidBasisPoints = 8,
  LabelTooLong = 9,
  InvalidRecipient = 10,
}

// Error messages
export const ERROR_MESSAGES: Record<ContractError, string> = {
  [ContractError.TransferNotFound]: 'Transfer tidak ditemukan',
  [ContractError.TemplateNotFound]: 'Template tidak ditemukan',
  [ContractError.TemplateInactive]: 'Template sudah dinonaktifkan',
  [ContractError.Unauthorized]: 'Anda bukan pemilik template ini',
  [ContractError.BelowMinimumAmount]: 'Jumlah minimum 1 USDC',
  [ContractError.TooManyAllocations]: 'Maksimal 5 kategori',
  [ContractError.EmptyAllocations]: 'Template harus punya minimal 1 kategori',
  [ContractError.InvalidBasisPoints]: 'Total persentase harus 100%',
  [ContractError.LabelTooLong]: 'Nama kategori maksimal 20 karakter',
  [ContractError.InvalidRecipient]: 'Alamat recipient tidak valid',
};

// Helper untuk convert basisPoints (4500 = 45%)
export const basisPointsToPercent = (bp: number): number => bp / 100;
export const percentToBasisPoints = (percent: number): number => percent * 100;

// Convert bigint string ke number (untuk display)
export const formatAmount = (amount: string, decimals: number = 7): string => {
  const num = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const whole = num / divisor;
  const fraction = num % divisor;
  return `${whole}.${fraction.toString().padStart(decimals, '0')}`;
};

// Parse user input ke bigint (USDC dengan 7 decimals)
export const parseAmount = (input: string): bigint => {
  const [whole, fraction = ''] = input.split('.');
  const paddedFraction = fraction.padEnd(7, '0').slice(0, 7);
  return BigInt(whole + paddedFraction);
};
