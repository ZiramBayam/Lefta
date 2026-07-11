// Contract call wrappers for TemplateRegistry and SplitRouter
import { Allocation, SplitTemplate, TransferRecord } from "@/types";
import { NETWORK_PASSPHRASE, HORIZON_URL, SOROBAN_RPC_URL } from "./freighter";

// Contract addresses (will be loaded from deployed.json
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _TEMPLATE_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_TEMPLATE_REGISTRY_ADDRESS || "";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _SPLIT_ROUTER_ADDRESS = process.env.NEXT_PUBLIC_SPLIT_ROUTER_ADDRESS || "";

// Mock data for development
const MOCK_TEMPLATES: SplitTemplate[] = [
  {
    id: "template-1",
    sender: "GDXK...4F2A",
    allocations: [
      { label: "Kebutuhan Harian", recipient: "GMPQ...9R7T", basisPoints: 6000 },
      { label: "Tabungan", recipient: "GSAK...2W1P", basisPoints: 2500 },
      { label: "Modal Usaha", recipient: "GBCX...7L9M", basisPoints: 1500 },
    ],
    isActive: true,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 7,
  },
  {
    id: "template-2",
    sender: "GDXK...4F2A",
    allocations: [
      { label: "Tabungan", recipient: "GXYZ...ABC1", basisPoints: 5000 },
      { label: "Modal", recipient: "GDEF...GHI2", basisPoints: 3000 },
      { label: "Kebutuhan", recipient: "GJKL...MNO3", basisPoints: 2000 },
    ],
    isActive: true,
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 2,
  },
];

const MOCK_TRANSFER_RECORDS: TransferRecord[] = [
  {
    id: "tx-001",
    sender: "GDXK...4F2A",
    templateId: "template-1",
    totalAmount: BigInt(100000000),
    timestamp: Date.now() - 86400000,
    splits: [
      { recipient: "GMPQ...9R7T", label: "Kebutuhan Harian", amount: BigInt(60000000) },
      { recipient: "GSAK...2W1P", label: "Tabungan", amount: BigInt(25000000) },
      { recipient: "GBCX...7L9M", label: "Modal Usaha", amount: BigInt(15000000) },
    ],
  },
  {
    id: "tx-002",
    sender: "GDXK...4F2A",
    templateId: "template-1",
    totalAmount: BigInt(50000000),
    timestamp: Date.now() - 86400000 * 3,
    splits: [
      { recipient: "GMPQ...9R7T", label: "Kebutuhan Harian", amount: BigInt(30000000) },
      { recipient: "GSAK...2W1P", label: "Tabungan", amount: BigInt(12500000) },
      { recipient: "GBCX...7L9M", label: "Modal Usaha", amount: BigInt(7500000) },
    ],
  },
];

// TemplateRegistry functions
export const getTemplate = async (templateId: string): Promise<SplitTemplate | null> => {
  // In production, this would call the contract
  // For now, return mock data
  return MOCK_TEMPLATES.find((t) => t.id === templateId) ?? null;
};

export const getSenderTemplates = async (/* eslint-disable-line @typescript-eslint/no-unused-vars */ _sender: string): Promise<SplitTemplate[]> => {
  // In production, this would call the contract
  // For now, return mock data filtered by sender
  return MOCK_TEMPLATES.filter((t) => t.isActive);
};

export const createTemplate = async (
  sender: string,
  allocations: Allocation[]
): Promise<string> => {
  // In production, this would call the contract
  const newTemplate: SplitTemplate = {
    id: `template-${Date.now()}`,
    sender,
    allocations,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  MOCK_TEMPLATES.push(newTemplate);
  return newTemplate.id;
};

export const updateTemplate = async (
  templateId: string,
  allocations: Allocation[]
): Promise<void> => {
  // In production, this would call the contract
  const index = MOCK_TEMPLATES.findIndex((t) => t.id === templateId);
  if (index !== -1) {
    MOCK_TEMPLATES[index].allocations = allocations;
    MOCK_TEMPLATES[index].updatedAt = Date.now();
  }
};

export const deactivateTemplate = async (templateId: string): Promise<void> => {
  // In production, this would call the contract
  const index = MOCK_TEMPLATES.findIndex((t) => t.id === templateId);
  if (index !== -1) {
    MOCK_TEMPLATES[index].isActive = false;
    MOCK_TEMPLATES[index].updatedAt = Date.now();
  }
};

// SplitRouter functions
export const transfer = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _sender: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _templateId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _amount: bigint
): Promise<{ transferId: string; txHash: string }> => {
  // In production, this would build and submit the transaction
  // For demo, return mock transfer ID
  return {
    transferId: `transfer-${Date.now()}`,
    txHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
  };
};

export const getTransfer = async (transferId: string): Promise<TransferRecord | null> => {
  // In production, this would query the contract
  return MOCK_TRANSFER_RECORDS.find((t) => t.id === transferId) ?? null;
};

export const getSenderHistory = async (sender: string): Promise<TransferRecord[]> => {
  // In production, this would query the contract
  return MOCK_TRANSFER_RECORDS.filter((t) => t.sender === sender);
};

export const getRecipientHistory = async (recipient: string): Promise<TransferRecord[]> => {
  // In production, this would query the contract
  return MOCK_TRANSFER_RECORDS.filter((t) =>
    t.splits.some((s) => s.recipient === recipient)
  );
};

// Add a new transfer to local history (for demo purposes)
export const addToHistory = (transfer: TransferRecord): void => {
  MOCK_TRANSFER_RECORDS.unshift(transfer);
};

// Stellar Explorer URL builder
export const getStellarExplorerUrl = (txHash: string): string => {
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
};

export { NETWORK_PASSPHRASE, HORIZON_URL, SOROBAN_RPC_URL };
