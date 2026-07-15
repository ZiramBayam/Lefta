'use client';

/**
 * Mock Implementation for Development
 * Uses localStorage as "contract storage"
 * Replace with actual contract calls after deploy
 */

import type { StoredTemplate } from '@/lib/types';

const STORAGE_KEYS = {
  TEMPLATES: 'lefta_mock_templates',
  TRANSFERS: 'lefta_mock_transfers',
};

// Generate deterministic ID from input
function generateId(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `mock_${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

// Get/set storage helpers
function getTemplates(): Record<string, StoredTemplate> {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
  return stored ? JSON.parse(stored) : {};
}

function setTemplates(templates: Record<string, StoredTemplate>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
}

// ===== Mock Contract Methods =====

export async function mockCreateTemplate(
  sender: string,
  name: string,
  allocations: Array<{ label: string; recipient: string; percentage: number }>
): Promise<string> {
  // Validate basis points (percentage * 100 = basis_points)
  const total = allocations.reduce((sum, a) => sum + a.percentage * 100, 0);
  if (total !== 10000) {
    throw new Error('Total basis_points harus 10000 (100%');
  }

  if (allocations.length === 0) {
    throw new Error('Template harus punya minimal 1 kategori');
  }

  if (allocations.length > 5) {
    throw new Error('Maksimal 5 kategori');
  }

  const templates = getTemplates();
  const nonce = Object.keys(templates).length;
  const id = generateId(`${sender}-${name}-${nonce}-${Date.now()}`);

  templates[id] = {
    id,
    sender,
    name,
    allocations: allocations.map(a => ({
      category: a.label,
      stellarAddress: a.recipient,
      percentage: a.percentage,
    })),
    isActive: true,
  };

  setTemplates(templates);
  return id;
}

export async function mockTransfer(
  sender: string,
  templateId: string,
  amount: string // in stroops (7 decimals)
): Promise<string> {
  const templates = getTemplates();
  const template = templates[templateId];

  if (!template) {
    throw new Error('Template tidak ditemukan');
  }

  if (!template.isActive) {
    throw new Error('Template sudah dinonaktifkan');
  }

  const amountNum = parseInt(amount);
  if (amountNum < 1_000_000) {
    throw new Error('Jumlah minimum 1 USDC');
  }

  // Calculate splits
  const splits = template.allocations.map(a => ({
    stellarAddress: a.stellarAddress,
    category: a.category,
    percentage: a.percentage,
    amount: Math.floor((amountNum * a.percentage * 100) / 10000).toString(),
  }));

  // Generate transfer ID
  const transferId = generateId(`tx-${sender}-${templateId}-${amount}-${Date.now()}`);

  // Simulate storage of transfer
  if (typeof window !== 'undefined') {
    const transfers = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSFERS) || '{}');
    transfers[transferId] = {
      id: transferId,
      sender,
      templateId,
      amount,
      splits,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
  }

  return transferId;
}

export async function mockSendDirect(
  sender: string,
  to: string,
  amount: string
): Promise<string> {
  const amountNum = parseInt(amount);
  if (amountNum < 1_000_000) {
    throw new Error('Jumlah minimum 1 USDC');
  }

  const transferId = generateId(`direct-${sender}-${to}-${amount}`);

  if (typeof window !== 'undefined') {
    const transfers = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSFERS) || '{}');
    transfers[transferId] = {
      id: transferId,
      sender,
      to,
      amount,
      timestamp: Date.now(),
      direct: true,
    };
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
  }

  return transferId;
}

export async function mockGetTemplate(templateId: string): Promise<StoredTemplate | null> {
  const templates = getTemplates();
  return templates[templateId] || null;
}

export async function mockGetUserTemplates(sender: string): Promise<string[]> {
  const templates = getTemplates();
  return Object.values(templates)
    .filter(t => t.sender === sender)
    .map(t => t.id);
}

export async function mockDeactivateTemplate(sender: string, templateId: string): Promise<void> {
  const templates = getTemplates();
  const template = templates[templateId];

  if (!template) {
    throw new Error('Template tidak ditemukan');
  }

  template.isActive = false;
  setTemplates(templates);
}

export async function mockGetTransfer(transferId: string) {
  if (typeof window === 'undefined') return null;
  const transfers = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSFERS) || '{}');
  return transfers[transferId] || null;
}

export async function mockGetSenderHistory(sender: string): Promise<string[]> {
  if (typeof window === 'undefined') return [];
  const transfers = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSFERS) || '{}');
  return Object.keys(transfers).filter(id => transfers[id]?.sender === sender);
}

// Clear mock data (for testing)
export function mockClearAll(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.TEMPLATES);
  localStorage.removeItem(STORAGE_KEYS.TRANSFERS);
}
