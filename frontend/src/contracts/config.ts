/**
 * Contract Configuration
 * Contract addresses untuk setiap jaringan
 */

// Soroban mode (true = panggil real contract, false = mock mode)
export const USE_REAL_CONTRACT = process.env.NEXT_PUBLIC_USE_REAL_CONTRACT === 'true';

// Contract addresses
const splitRouterAddress = process.env.NEXT_PUBLIC_SPLIT_ROUTER_CONTRACT_ID || '';
const templateRegistryAddress = process.env.NEXT_PUBLIC_TEMPLATE_REGISTRY_CONTRACT_ID || '';

export const CONTRACT_ADDRESSES = {
  splitRouter: splitRouterAddress,
  templateRegistry: templateRegistryAddress,
};

// Network Configuration
export const NETWORK_CONFIG = {
  network: process.env.NEXT_PUBLIC_NETWORK || 'testnet',
  rpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
  horizonUrl: process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
};

// Token addresses
export const TOKEN_ADDRESSES = {
  usdc: process.env.NEXT_PUBLIC_USDC_ISSUER || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  usdcContract: process.env.NEXT_PUBLIC_USDC_CONTRACT || '',
};

// Faucet account (testnet only)
export const FAUCET_CONFIG = {
  secretKey: process.env.NEXT_PUBLIC_FAUCET_SECRET_KEY || '',
  publicKey: process.env.NEXT_PUBLIC_FAUCET_PUBLIC_KEY || '',
};
