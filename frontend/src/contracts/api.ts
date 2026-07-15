import { StoredTemplate } from '@/lib/types';
import { NETWORK_CONFIG, TOKEN_ADDRESSES, FAUCET_CONFIG, CONTRACT_ADDRESSES } from './config';
import {
  isConnected, getAddress, signTransaction,
} from '@stellar/freighter-api';
import { Server } from '@stellar/stellar-sdk/rpc';
import {
  TransactionBuilder, BASE_FEE, Operation, Asset, Memo, Keypair,
} from '@stellar/stellar-sdk';
import {
  trCreateTemplate, trUpdateTemplate, trGetTemplate, trGetUserTemplates, trDeactivateTemplate,
  srSendDirect, srTransfer,
} from './splitRouter';

// ═══ Status ═══

export function isContractDeployed(): boolean {
  return !!(
    CONTRACT_ADDRESSES.splitRouter?.startsWith('C') &&
    CONTRACT_ADDRESSES.templateRegistry?.startsWith('C')
  );
}

export function getContractInfo() {
  return {
    isDeployed: isContractDeployed(),
    network: NETWORK_CONFIG.network,
    splitRouter: CONTRACT_ADDRESSES.splitRouter,
    templateRegistry: CONTRACT_ADDRESSES.templateRegistry,
    usdcContract: TOKEN_ADDRESSES.usdcContract,
    rpcUrl: NETWORK_CONFIG.rpcUrl,
  };
}

// ═══ Template Management (TemplateRegistry) ═══

export async function createTemplate(
  sender: string,
  allocations: Array<{ label: string; recipient: string; percentage: number }>,
): Promise<string> {
  const totalBasisPoints = allocations.reduce((s, a) => s + Math.round(a.percentage * 100), 0);
  if (totalBasisPoints !== 10000) throw new Error(`Total alokasi harus 100%. Saat ini: ${totalBasisPoints / 100}%`);
  if (allocations.length < 1 || allocations.length > 5) throw new Error('Template harus punya 1-5 kategori');

  const contractAllocs = allocations.map(a => ({
    label: a.label,
    recipient: a.recipient,
    basisPoints: Math.round(a.percentage * 100),
  }));

  const txHash = await trCreateTemplate(sender, contractAllocs);
  return txHash;
}

export async function getTemplate(templateId: string): Promise<StoredTemplate | null> {
  try {
    const raw = await trGetTemplate(templateId);
    if (!raw) return null;
    const allocations = (raw.allocations || []).map((a: any) => ({
      category: typeof a.label === 'string' ? a.label : '',
      stellarAddress: typeof a.recipient === 'string' ? a.recipient : '',
      percentage: (typeof a.basis_points === 'number' ? a.basis_points : 0) / 100,
    }));
    const name = allocations.map((a: any) => `${a.category}: ${a.percentage}%`).join(', ');
    return {
      id: templateId,
      sender: typeof raw.sender === 'string' ? raw.sender : '',
      name,
      allocations,
      isActive: raw.is_active !== false,
    };
  } catch {
    return null;
  }
}

export async function getUserTemplates(sender: string): Promise<string[]> {
  try {
    return await trGetUserTemplates(sender);
  } catch {
    return [];
  }
}

export async function deactivateTemplate(sender: string, templateId: string): Promise<void> {
  await trDeactivateTemplate(sender, templateId);
}

export async function updateTemplate(
  sender: string,
  templateId: string,
  allocations: Array<{ label: string; recipient: string; percentage: number }>,
): Promise<void> {
  const contractAllocs = allocations.map(a => ({
    label: a.label,
    recipient: a.recipient,
    basisPoints: Math.round(a.percentage * 100),
  }));
  await trUpdateTemplate(sender, templateId, contractAllocs);
}

// ═══ Send (SplitRouter) ═══

export async function sendDirect(
  sender: string,
  to: string,
  amount: string,
): Promise<string> {
  const amountNum = parseFloat(amount);
  if (amountNum < 0.01) throw new Error('Jumlah minimum 0.01 USDC');
  return await srSendDirect(sender, to, amountNum);
}

export async function transfer(
  sender: string,
  templateId: string,
  amount: string,
): Promise<string> {
  const amountNum = parseFloat(amount);
  if (amountNum < 1) throw new Error('Jumlah minimum 1 USDC');
  return await srTransfer(sender, templateId, amountNum);
}

// ═══ Wallet Integration ═══

let rpcServer: Server | null = null;

function getRpcServer(): Server {
  if (!rpcServer) rpcServer = new Server(NETWORK_CONFIG.rpcUrl);
  return rpcServer;
}

export interface WalletStatus {
  isConnected: boolean;
  publicKey: string | null;
  error: string | null;
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
}

export async function checkWalletConnection(): Promise<WalletStatus> {
  try {
    const result = await isConnected();
    if (result.error) return { isConnected: false, publicKey: null, error: result.error };
    if (!result.isConnected) return { isConnected: false, publicKey: null, error: 'Freighter not connected' };
    const addressResult = await getAddress();
    if (addressResult.error) return { isConnected: false, publicKey: null, error: addressResult.error };
    return { isConnected: true, publicKey: addressResult.address, error: null };
  } catch (err) {
    return { isConnected: false, publicKey: null, error: err instanceof Error ? err.message : 'Connection failed' };
  }
}

export async function sendPayment(params: {
  destination: string;
  amount: string;
  asset: 'XLM' | 'USDC';
  memo?: string;
}): Promise<TransactionResult> {
  try {
    const walletStatus = await checkWalletConnection();
    if (!walletStatus.isConnected || !walletStatus.publicKey) throw new Error(walletStatus.error || 'Wallet not connected');
    const server = getRpcServer();
    const sourceAccount = await server.getAccount(walletStatus.publicKey);
    const txBuilder = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_CONFIG.networkPassphrase,
    });
    if (params.asset === 'XLM') {
      txBuilder.addOperation(Operation.payment({ destination: params.destination, asset: Asset.native(), amount: params.amount }));
    } else {
      txBuilder.addOperation(Operation.payment({ destination: params.destination, asset: new Asset('USDC', TOKEN_ADDRESSES.usdc), amount: params.amount }));
    }
    if (params.memo) txBuilder.addMemo(Memo.text(params.memo));
    txBuilder.setTimeout(300);
    const transaction = txBuilder.build();
    const signResult = await signTransaction(transaction.toXDR(), { networkPassphrase: NETWORK_CONFIG.networkPassphrase });
    if (signResult.error) throw new Error(signResult.error);
    const signedTransaction = TransactionBuilder.fromXDR(signResult.signedTxXdr, NETWORK_CONFIG.networkPassphrase);
    const result = await server.sendTransaction(signedTransaction);
    if (result.status === 'ERROR') throw new Error('Transaction failed');
    await server.pollTransaction(result.hash);
    return { success: true, hash: result.hash };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Transaction failed' };
  }
}

export async function getWalletBalances(publicKey: string): Promise<{ XLM: number; USDC: number }> {
  try {
    const response = await fetch(`${NETWORK_CONFIG.horizonUrl}/accounts/${publicKey}`);
    if (!response.ok) throw new Error('Failed to fetch account');
    const data = await response.json();
    const balances = data.balances || [];
    let xlm = 0;
    let usdc = 0;
    for (const b of balances) {
      if (b.asset_type === 'native') xlm = parseFloat(b.balance);
      else if (b.asset_code === 'USDC' && b.asset_issuer === TOKEN_ADDRESSES.usdc) usdc = parseFloat(b.balance);
    }
    return { XLM: xlm, USDC: usdc };
  } catch {
    return { XLM: 0, USDC: 0 };
  }
}

// ═══ Faucet Deposit ═══

export async function ensureTrustline(publicKey: string): Promise<{ success: boolean; error?: string; alreadyHad: boolean }> {
  try {
    const resp = await fetch(`${NETWORK_CONFIG.horizonUrl}/accounts/${publicKey}`);
    if (!resp.ok) return { success: false, alreadyHad: false, error: 'Account tidak ditemukan di Stellar network.' };
    const data = await resp.json();
    const hasTrustline = (data.balances || []).some((b: any) => b.asset_code === 'USDC' && b.asset_issuer === TOKEN_ADDRESSES.usdc);
    if (hasTrustline) return { success: true, alreadyHad: true };
    const server = getRpcServer();
    const sourceAccount = await server.getAccount(publicKey);
    const tx = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_CONFIG.networkPassphrase,
    })
      .addOperation(Operation.changeTrust({ asset: new Asset('USDC', TOKEN_ADDRESSES.usdc) }))
      .setTimeout(300)
      .build();
    const signResult = await signTransaction(tx.toXDR(), { networkPassphrase: NETWORK_CONFIG.networkPassphrase });
    if (signResult.error) return { success: false, alreadyHad: false, error: `User rejected: ${signResult.error}` };
    const signedTx = TransactionBuilder.fromXDR(signResult.signedTxXdr, NETWORK_CONFIG.networkPassphrase);
    const result = await server.sendTransaction(signedTx);
    if (result.status === 'ERROR') return { success: false, alreadyHad: false, error: 'Trustline transaction failed' };
    await server.pollTransaction(result.hash);
    return { success: true, alreadyHad: false };
  } catch (err) {
    return { success: false, alreadyHad: false, error: err instanceof Error ? err.message : 'Gagal setup trustline' };
  }
}

export async function faucetDeposit(destinationAddress: string, amount: number): Promise<TransactionResult> {
  try {
    if (!FAUCET_CONFIG.secretKey) return { success: false, error: 'Faucet not configured' };
    if (amount <= 0 || amount > 100000) return { success: false, error: 'Amount must be 1-100,000 USDC' };
    const faucetKp = Keypair.fromSecret(FAUCET_CONFIG.secretKey);
    const server = getRpcServer();
    const sourceAccount = await server.getAccount(FAUCET_CONFIG.publicKey);
    const tx = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_CONFIG.networkPassphrase,
    })
      .addOperation(Operation.payment({
        destination: destinationAddress,
        asset: new Asset('USDC', TOKEN_ADDRESSES.usdc),
        amount: amount.toString(),
      }))
      .addMemo(Memo.text('Lefta Deposit Faucet'))
      .setTimeout(300)
      .build();
    tx.sign(faucetKp);
    const result = await server.sendTransaction(tx);
    if (result.status === 'ERROR') return { success: false, error: 'Faucet transaction failed' };
    await server.pollTransaction(result.hash);
    return { success: true, hash: result.hash };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Faucet deposit gagal' };
  }
}
