// ===== Blockchain Types (Contract-aligned =====

// Allocation preference (stored in contract template)
export interface Allocation {
  category: string;      // "Kebutuhan Rumah"
  stellarAddress: string;  // GXXXX... (Stellar address)
  percentage: number;      // 45 (percentage, not basis_points)
}

// Template stored in contract
export interface StoredTemplate {
  id: string;
  sender: string;
  name: string;
  allocations: Allocation[];
  isActive: boolean;
}

// Transaction record (blockchain)
export interface ContractTransaction {
  id: string;
  sender: string;
  recipient: string;
  amount: string;       // BigInt as string (USDC stroops)
  timestamp: number;    // Unix timestamp
  status: 'success' | 'pending' | 'failed';
  error?: string;
}

// Legacy alias for backward compatibility
export type Transaction = LegacyTransaction;

// ===== UI State Types =====

export interface Contact {
  id: string;
  name: string;
  address: string;
  relation: string;
  avatarColor?: string;
}

export interface BudgetSplit {
  category: string;
  percentage: number;
  amount: number;
  amountIdr: number;
}

export interface WalletBalances {
  USDC: number;  // Display amount
  XLM: number;
  IDR: number;  // Fiat balance for display
}

// Legacy type - kept for reference
export interface LegacyTransaction {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  currency: string;
  amountIdr: number;
  destinationAddress: string;
  sourceAddress: string;
  timestamp: string;
  status: 'Pending' | 'Success' | 'Failed';
  notes?: string;
  txHash: string;
  splits?: Array<{ category: string; amount: number; percentage: number; amountIdr: number }>;
}

// ===== Helpers =====

// Convert stroops (7 decimals) to display amount
export function stroopsToDisplay(stroops: string): string {
  const num = BigInt(stroops);
  const STROOPS_PER_USDC = BigInt(10 ** 7);
  const whole = num / STROOPS_PER_USDC;
  const fraction = num % STROOPS_PER_USDC;
  return `${whole}.${fraction.toString().padStart(7, '0').slice(0, 2)}`;
}

// Convert display amount to stroops
export function displayToStroops(amount: string): string {
  const [whole, fraction = '0'] = amount.split('.');
  const padded = (whole + fraction.padEnd(7, '0').slice(0, 7));
  return BigInt(padded).toString();
}

// Format IDR for display
export function formatIDR(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}
