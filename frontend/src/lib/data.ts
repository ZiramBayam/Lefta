import { StoredTemplate, Contact, LegacyTransaction } from './types';

// Default template allocations (actual allocations come from contract)
export const DEFAULT_ALLOCATIONS = {
  household: { category: 'Kebutuhan Rumah', percentage: 45 },
  business: { category: 'Modal Usaha', percentage: 20 },
  renovation: { category: 'Renovasi Rumah', percentage: 10 },
  education: { category: 'Pendidikan', percentage: 15 },
  emergency: { category: 'Dana Darurat', percentage: 10 },
};

// Default balances - used as fallback when no wallet connected
// Real balance is fetched from Stellar Horizon API
export const DEFAULT_BALANCES = {
  USDC: 0,      // Will be fetched from Horizon
  XLM: 0,       // Will be fetched from Horizon
  IDR: 0,       // Fiat balance from localStorage
};

// Default contacts - empty, loaded from contract templates or localStorage
export const MOCK_CONTACTS: Contact[] = [];

// Default templates - loaded from contract or localStorage
export const MOCK_TEMPLATES: StoredTemplate[] = [];

// Default transactions - loaded from contract or localStorage
export const MOCK_TRANSACTIONS: LegacyTransaction[] = [];

// Generate transaction hash for display
export function generateMockTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 8; i++) hash += chars[Math.floor(Math.random() * 16)];
  hash += '...';
  for (let i = 0; i < 4; i++) hash += chars[Math.floor(Math.random() * 16)];
  return hash;
}

// Aliases for backward compatibility
export const INITIAL_BALANCES = DEFAULT_BALANCES;
export const INITIAL_TRANSACTIONS = MOCK_TRANSACTIONS;
export const generateTxHash = generateMockTxHash;

// Local storage keys
export const STORAGE_KEYS = {
  TEMPLATES: 'lefta_templates',
  TRANSACTIONS: 'lefta_transactions',
  CONTACTS: 'lefta_contacts',
  BALANCES: 'lefta_balances',
} as const;

// Helper to load from localStorage with fallback
export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : fallback;
}

// Helper to save to localStorage
export function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}
