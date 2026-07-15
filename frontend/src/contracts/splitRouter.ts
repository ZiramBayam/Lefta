import {
  Operation, TransactionBuilder, BASE_FEE, nativeToScVal, scValToNative, xdr, Address,
} from '@stellar/stellar-sdk';
import { Server } from '@stellar/stellar-sdk/rpc';
import { signTransaction } from '@stellar/freighter-api';
import { NETWORK_CONFIG, CONTRACT_ADDRESSES, TOKEN_ADDRESSES } from './config';

let rpcInstance: Server | null = null;
function getRpc(): Server {
  if (!rpcInstance) rpcInstance = new Server(NETWORK_CONFIG.rpcUrl);
  return rpcInstance;
}

function str(v: string) { return nativeToScVal(v, { type: 'string' }); }
function addrS(v: string) { return nativeToScVal(v, { type: 'address' }); }
function u32(v: number) { return nativeToScVal(v, { type: 'u32' } as any); }
function i128(v: number | bigint) { return nativeToScVal(BigInt(v), { type: 'i128' } as any); }
function bytes32(hex: string) {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  return nativeToScVal(Buffer.from(clean, 'hex'), { type: 'bytes' });
}

function invokeOp(contractId: string, method: string, args: xdr.ScVal[]) {
  return Operation.invokeContractFunction({ contract: contractId, function: method, args });
}

function toScValAlloc(a: { label: string; recipient: string; basisPoints: number }) {
  return nativeToScVal([
    nativeToScVal(a.label, { type: 'string' }),
    nativeToScVal(a.recipient, { type: 'address' }),
    nativeToScVal(a.basisPoints, { type: 'u32' } as any),
  ]);
}

function toScValAllocs(arr: Array<{ label: string; recipient: string; basisPoints: number }>) {
  return nativeToScVal(arr.map(toScValAlloc));
}

async function buildTx(publicKey: string, ops: any[]) {
  const server = getRpc();
  const source = await server.getAccount(publicKey);
  let builder = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_CONFIG.networkPassphrase,
  });
  for (const op of ops) builder = builder.addOperation(op);
  return builder.setTimeout(300).build();
}

async function signSubmit(publicKey: string, tx: any): Promise<string> {
  const server = getRpc();
  const signResult = await signTransaction(tx.toXDR(), {
    networkPassphrase: NETWORK_CONFIG.networkPassphrase,
  });
  if (signResult.error) throw new Error(`Freighter: ${signResult.error}`);
  const signedTx = TransactionBuilder.fromXDR(signResult.signedTxXdr, NETWORK_CONFIG.networkPassphrase);
  const result = await server.sendTransaction(signedTx);
  if (result.status === 'ERROR') {
    // Coba ambil detail error dari Soroban
    const errDetail = (result as any).errorResult
      ? JSON.stringify((result as any).errorResult)
      : 'Transaction rejected by network';
    throw new Error(errDetail);
  }
  const confirmed = await server.pollTransaction(result.hash);
  if (confirmed.status === 'FAILED') {
    const errDetail = (confirmed as any).resultXdr
      ? `Transaction failed: ${(confirmed as any).resultXdr}`
      : 'Transaction failed after submission';
    throw new Error(errDetail);
  }
  return result.hash;
}

async function simulateRes(contractId: string, method: string, args: xdr.ScVal[]) {
  const server = getRpc();
  const op = invokeOp(contractId, method, args);
  const src = await server.getAccount('GAR5G4MP53MLWJG3N6FVYNTD3NYQMFBCOFTJJP3ZG3L25S6NETZL3MGQ');
  const tx = new TransactionBuilder(src, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_CONFIG.networkPassphrase,
  })
    .addOperation(op)
    .setTimeout(300)
    .build();
  const sim: any = await server.simulateTransaction(tx);
  if (sim.error) throw new Error(`Simulate error: ${JSON.stringify(sim.error)}`);
  if (!sim.result) throw new Error('No result from simulate');
  return scValToNative(sim.result.retval);
}

// ═══ TemplateRegistry ═══

const TR = CONTRACT_ADDRESSES.templateRegistry;

export async function trGetTemplate(templateIdHex: string): Promise<any> {
  return simulateRes(TR, 'get_template', [bytes32(templateIdHex)]);
}

export async function trGetUserTemplates(sender: string): Promise<string[]> {
  const raw = await simulateRes(TR, 'get_sender_templates', [addrS(sender)]);
  return (raw as any[]).map((b: Uint8Array) => Buffer.from(b).toString('hex'));
}

export async function trIsActive(templateIdHex: string): Promise<boolean> {
  return simulateRes(TR, 'is_active', [bytes32(templateIdHex)]);
}

export async function trCreateTemplate(
  publicKey: string,
  allocations: Array<{ label: string; recipient: string; basisPoints: number }>,
): Promise<string> {
  const tx = await buildTx(publicKey, [
    invokeOp(TR, 'create_template', [addrS(publicKey), toScValAllocs(allocations)]),
  ]);
  return signSubmit(publicKey, tx);
}

export async function trUpdateTemplate(
  publicKey: string,
  templateIdHex: string,
  allocations: Array<{ label: string; recipient: string; basisPoints: number }>,
): Promise<string> {
  const tx = await buildTx(publicKey, [
    invokeOp(TR, 'update_template', [addrS(publicKey), bytes32(templateIdHex), toScValAllocs(allocations)]),
  ]);
  return signSubmit(publicKey, tx);
}

export async function trDeactivateTemplate(publicKey: string, templateIdHex: string): Promise<string> {
  const tx = await buildTx(publicKey, [
    invokeOp(TR, 'deactivate_template', [addrS(publicKey), bytes32(templateIdHex)]),
  ]);
  return signSubmit(publicKey, tx);
}

// ═══ SplitRouter ═══

const SR = CONTRACT_ADDRESSES.splitRouter;
const USDC_ADDR = TOKEN_ADDRESSES.usdcContract;

export async function srGetRecipientTransfers(recipient: string): Promise<string[]> {
  const raw = await simulateRes(SR, 'get_recipient_transfers', [addrS(recipient)]);
  return (raw as any[]).map((b: Uint8Array) => Buffer.from(b).toString('hex'));
}

export async function srGetTransfer(transferIdHex: string): Promise<any> {
  return simulateRes(SR, 'get_transfer', [bytes32(transferIdHex)]);
}

export async function srSendDirect(publicKey: string, to: string, amount: number): Promise<string> {
  const tx = await buildTx(publicKey, [
    invokeOp(SR, 'send_direct', [
      addrS(publicKey), addrS(to), i128(amount * 10_000_000), addrS(USDC_ADDR),
    ]),
  ]);
  return signSubmit(publicKey, tx);
}

export async function srTransfer(publicKey: string, templateIdHex: string, amount: number): Promise<string> {
  const tx = await buildTx(publicKey, [
    invokeOp(SR, 'transfer', [
      addrS(publicKey), bytes32(templateIdHex), i128(amount * 10_000_000), addrS(USDC_ADDR),
    ]),
  ]);
  return signSubmit(publicKey, tx);
}
