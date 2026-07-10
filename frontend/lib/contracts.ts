import {
  Contract,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  Address,
  xdr,
} from '@stellar/stellar-sdk';
import { rpc } from '@stellar/stellar-sdk';
import { SOROBAN_RPC, NETWORK_PASSPHRASE, CONTRACT_IDS } from './freighter';
import type { Allocation, SplitTemplate, TransferRecord } from '@/types';

const server = new rpc.Server(SOROBAN_RPC);

// Generate a dummy keypair for read-only operations
const DUMMY_KEYPAIR = {
  publicKey: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWF',
};

// Helper to extract bytes from ScVal
function scValToHex(val: xdr.ScVal): string {
  try {
    const bytes = val.bytes();
    if (bytes) {
      return Buffer.from(bytes).toString('hex');
    }
  } catch {
    // Ignore
  }
  return '';
}

// Helper to extract string from ScVal
function scValToString(val: xdr.ScVal): string {
  try {
    const str = val.str();
    if (str) {
      return typeof str === 'string' ? str : str.toString();
    }
    return '';
  } catch {
    return '';
  }
}

// Helper to extract address from ScVal
function scValToAddress(val: xdr.ScVal): string {
  try {
    const addr = val.address();
    if (addr) {
      const accountId = addr.accountId();
      if (accountId) {
        return accountId.value().toString();
      }
    }
  } catch {
    // Ignore
  }
  return '';
}

// Helper to extract u32 from ScVal
function scValToU32(val: xdr.ScVal): number {
  try {
    return val.u32() ?? 0;
  } catch {
    return 0;
  }
}

// Helper to extract u64 from ScVal
function scValToU64(val: xdr.ScVal): bigint {
  try {
    const u64 = val.u64();
    if (u64) {
      return BigInt(u64.toString());
    }
  } catch {
    // Ignore
  }
  return BigInt(0);
}

// Helper to extract i128 from ScVal
function scValToI128(val: xdr.ScVal): bigint {
  try {
    const i128 = val.i128();
    if (i128) {
      // SDK v16: Int128Parts has lo (low) and hi (high) properties
      const parts = i128 as unknown as { lo: bigint; hi: bigint };
      return (parts.hi << BigInt(64)) + parts.lo;
    }
  } catch {
    // Ignore
  }
  return BigInt(0);
}

// Helper to extract vec from ScVal
function scValToVec(val: xdr.ScVal): xdr.ScVal[] {
  try {
    const vec = val.vec();
    return vec || [];
  } catch {
    return [];
  }
}

// Helper to extract bool from ScVal
function scValToBool(val: xdr.ScVal): boolean {
  // In SDK v16, check if it's a boolean type
  try {
    // Bool value is stored directly, check via switch
    const typeName = val.switch().name || '';
    return typeName === 'scvBool' ? true : false;
  } catch {
    return false;
  }
}

// Helper to check if ScVal is a map
function scValIsMap(val: xdr.ScVal): boolean {
  try {
    const map = val.map();
    return map !== undefined && map !== null;
  } catch {
    return false;
  }
}

// Prepare create_template transaction
export async function prepareCreateTemplate(
  senderAddress: string,
  allocations: Allocation[]
): Promise<string> {
  const account = await server.getAccount(senderAddress);

  // Build allocations as ScVec using factory methods (SDK v16 API)
  const allocVals: xdr.ScVal[] = allocations.map(a => {
    return xdr.ScVal.scvVec([
      xdr.ScVal.scvString(a.label),
      new Address(a.recipient).toScVal(),
      xdr.ScVal.scvU32(a.basisPoints),
    ]);
  });

  const allocationsScVal = xdr.ScVal.scvVec(allocVals);

  const contract = new Contract(CONTRACT_IDS.templateRegistry);
  const operation = contract.call(
    'create_template',
    new Address(senderAddress).toScVal(),
    allocationsScVal
  );

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulasi gagal: ${simResult.error}`);
  }

  const preparedTx = rpc.assembleTransaction(tx, simResult).build();
  return preparedTx.toXDR();
}

export function parseCreateTemplateResult(
  result: rpc.Api.GetSuccessfulTransactionResponse
): string {
  const returnValue = result.returnValue;
  if (!returnValue) {
    throw new Error('Transaksi sukses tapi tidak ada return value');
  }
  // BytesN<32> to hex string
  return scValToHex(returnValue);
}

// Get template by ID
export async function getTemplate(templateId: string): Promise<SplitTemplate> {
  const sourceAccount = await server.getAccount(DUMMY_KEYPAIR.publicKey);
  const contract = new Contract(CONTRACT_IDS.templateRegistry);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call('get_template', nativeToScVal(templateId, { type: 'bytes' }))
    )
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Gagal membaca template: ${simResult.error}`);
  }

  return parseTemplateFromScVal(simResult.result!.retval);
}

function parseTemplateFromScVal(val: xdr.ScVal): SplitTemplate {
  // SDK v16: val itself is the struct, access via map
  const mapEntries: Array<{ key: xdr.ScVal; val: xdr.ScVal }> = [];

  if (scValIsMap(val)) {
    const map = val.map();
    if (map) {
      map.forEach((e: { key: () => xdr.ScVal; val: () => xdr.ScVal }) => {
        mapEntries.push({ key: e.key(), val: e.val() });
      });
    }
  }

  const get = (key: string): xdr.ScVal => {
    const entry = mapEntries.find(e => scValToString(e.key) === key);
    if (!entry) throw new Error(`Missing key: ${key}`);
    return entry.val;
  };

  const allocationsVal = get('allocations');
  const allocationsVec = scValToVec(allocationsVal);
  const allocations: Allocation[] = [];

  for (const alloc of allocationsVec) {
    const innerVec = scValToVec(alloc);
    if (innerVec.length >= 3) {
      allocations.push({
        label: scValToString(innerVec[0]),
        recipient: scValToAddress(innerVec[1]),
        basisPoints: scValToU32(innerVec[2]),
      });
    }
  }

  return {
    id: scValToHex(get('id')),
    sender: scValToAddress(get('sender')),
    allocations,
    isActive: scValToBool(get('is_active')),
    createdAt: Number(scValToU64(get('created_at'))),
    updatedAt: Number(scValToU64(get('updated_at'))),
  };
}

// Get sender templates
export async function getSenderTemplates(senderAddress: string): Promise<string[]> {
  const sourceAccount = await server.getAccount(DUMMY_KEYPAIR.publicKey);
  const contract = new Contract(CONTRACT_IDS.templateRegistry);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call('get_sender_templates', new Address(senderAddress).toScVal())
    )
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Gagal membaca templates: ${simResult.error}`);
  }

  const vec = scValToVec(simResult.result!.retval);
  return vec.map(v => scValToHex(v));
}

// Prepare transfer transaction
export async function prepareTransfer(
  senderAddress: string,
  templateId: string,
  amount: bigint,
  usdcTokenId: string
): Promise<string> {
  const account = await server.getAccount(senderAddress);

  const contract = new Contract(CONTRACT_IDS.splitRouter);
  const operation = contract.call(
    'transfer',
    new Address(senderAddress).toScVal(),
    nativeToScVal(templateId, { type: 'bytes' }),
    nativeToScVal(amount, { type: 'i128' }),
    new Address(usdcTokenId).toScVal()
  );

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulasi gagal: ${simResult.error}`);
  }

  const preparedTx = rpc.assembleTransaction(tx, simResult).build();
  return preparedTx.toXDR();
}

export function parseTransferResult(
  result: rpc.Api.GetSuccessfulTransactionResponse
): string {
  const returnValue = result.returnValue;
  if (!returnValue) {
    throw new Error('Transaksi sukses tapi tidak ada return value');
  }
  return scValToHex(returnValue);
}

// Get transfer by ID
export async function getTransfer(transferId: string): Promise<TransferRecord> {
  const sourceAccount = await server.getAccount(DUMMY_KEYPAIR.publicKey);
  const contract = new Contract(CONTRACT_IDS.splitRouter);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call('get_transfer', nativeToScVal(transferId, { type: 'bytes' }))
    )
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Gagal membaca transfer: ${simResult.error}`);
  }

  return parseTransferFromScVal(simResult.result!.retval);
}

function parseTransferFromScVal(val: xdr.ScVal): TransferRecord {
  const mapEntries: Array<{ key: xdr.ScVal; val: xdr.ScVal }> = [];

  if (scValIsMap(val)) {
    const map = val.map();
    if (map) {
      map.forEach((e: { key: () => xdr.ScVal; val: () => xdr.ScVal }) => {
        mapEntries.push({ key: e.key(), val: e.val() });
      });
    }
  }

  const get = (key: string): xdr.ScVal => {
    const entry = mapEntries.find(e => scValToString(e.key) === key);
    if (!entry) throw new Error(`Missing key: ${key}`);
    return entry.val;
  };

  const splitsVal = get('splits');
  const splitsVec = scValToVec(splitsVal);
  const splits: { recipient: string; label: string; amount: bigint }[] = [];

  for (const split of splitsVec) {
    const innerVec = scValToVec(split);
    if (innerVec.length >= 3) {
      splits.push({
        recipient: scValToAddress(innerVec[0]),
        label: scValToString(innerVec[1]),
        amount: scValToI128(innerVec[2]),
      });
    }
  }

  return {
    id: scValToHex(get('id')),
    sender: scValToAddress(get('sender')),
    templateId: scValToHex(get('template_id')),
    totalAmount: scValToI128(get('total_amount')),
    timestamp: Number(scValToU64(get('timestamp'))),
    splits,
  };
}

// Get sender history
export async function getSenderHistory(senderAddress: string): Promise<string[]> {
  const sourceAccount = await server.getAccount(DUMMY_KEYPAIR.publicKey);
  const contract = new Contract(CONTRACT_IDS.splitRouter);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call('get_sender_history', new Address(senderAddress).toScVal())
    )
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simResult)) {
    return [];
  }

  const vec = scValToVec(simResult.result!.retval);
  return vec.map(v => scValToHex(v));
}

// Get recipient history
export async function getRecipientHistory(recipientAddress: string): Promise<string[]> {
  const sourceAccount = await server.getAccount(DUMMY_KEYPAIR.publicKey);
  const contract = new Contract(CONTRACT_IDS.splitRouter);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call('get_recipient_history', new Address(recipientAddress).toScVal())
    )
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simResult)) {
    return [];
  }

  const vec = scValToVec(simResult.result!.retval);
  return vec.map(v => scValToHex(v));
}

// Deactivate template
export async function prepareDeactivateTemplate(
  senderAddress: string,
  templateId: string
): Promise<string> {
  const account = await server.getAccount(senderAddress);
  const contract = new Contract(CONTRACT_IDS.templateRegistry);

  const operation = contract.call(
    'deactivate_template',
    new Address(senderAddress).toScVal(),
    nativeToScVal(templateId, { type: 'bytes' })
  );

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulasi gagal: ${simResult.error}`);
  }

  const preparedTx = rpc.assembleTransaction(tx, simResult).build();
  return preparedTx.toXDR();
}
