export const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
export const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org';
export const SOROBAN_RPC = process.env.NEXT_PUBLIC_SOROBAN_RPC || 'https://soroban-testnet.stellar.org';
export const USDC_ISSUER = process.env.NEXT_PUBLIC_USDC_ISSUER || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

export const CONTRACT_IDS = {
  templateRegistry: process.env.NEXT_PUBLIC_TEMPLATE_REGISTRY_CONTRACT_ID || '',
  splitRouter: process.env.NEXT_PUBLIC_SPLIT_ROUTER_CONTRACT_ID || '',
};

export async function checkFreighterInstalled(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  return !!(window as { freighter?: unknown }).freighter;
}

export async function connectWallet(): Promise<string> {
  const { requestAccess } = await import('@stellar/freighter-api');
  const result = await requestAccess();
  if (result.error) {
    throw new Error(result.error.message || 'Failed to connect wallet');
  }
  return result.address;
}

export async function getWalletAddress(): Promise<string | null> {
  try {
    const { getAddress } = await import('@stellar/freighter-api');
    const result = await getAddress();
    if (result.error) {
      return null;
    }
    return result.address;
  } catch {
    return null;
  }
}

export async function signTransaction(
  xdr: string,
  networkPassphrase: string
): Promise<string> {
  const { signTransaction: sign } = await import('@stellar/freighter-api');
  const result = await sign(xdr, { networkPassphrase });
  if (result.error) {
    throw new Error(result.error.message || 'Failed to sign transaction');
  }
  return result.signedTxXdr;
}
