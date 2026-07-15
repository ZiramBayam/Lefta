import { NextRequest, NextResponse } from 'next/server';
import { Server } from '@stellar/stellar-sdk/rpc';
import {
  TransactionBuilder, BASE_FEE, Operation, Asset, Memo, Keypair,
} from '@stellar/stellar-sdk';

const FAUCET_SECRET_KEY = process.env.FAUCET_SECRET_KEY || '';
const FAUCET_PUBLIC_KEY = process.env.FAUCET_PUBLIC_KEY || '';

function getRpcUrl(): string {
  return process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
}

function getNetworkPassphrase(): string {
  return process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
    ? 'Public Global Stellar Network ; September 2015'
    : 'Test SDF Network ; September 2015';
}

function getUsdcIssuer(): string {
  return process.env.NEXT_PUBLIC_USDC_ISSUER || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
}

export async function POST(request: NextRequest) {
  try {
    if (!FAUCET_SECRET_KEY) {
      return NextResponse.json({ success: false, error: 'Faucet not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { address, amount } = body;

    if (!address || typeof address !== 'string') {
      return NextResponse.json({ success: false, error: 'Address required' }, { status: 400 });
    }
    if (typeof amount !== 'number' || amount <= 0 || amount > 100000) {
      return NextResponse.json({ success: false, error: 'Amount must be 1-100,000 USDC' }, { status: 400 });
    }

    const faucetKp = Keypair.fromSecret(FAUCET_SECRET_KEY);
    const server = new Server(getRpcUrl());
    const sourceAccount = await server.getAccount(FAUCET_PUBLIC_KEY);

    const tx = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: getNetworkPassphrase(),
    })
      .addOperation(Operation.payment({
        destination: address,
        asset: new Asset('USDC', getUsdcIssuer()),
        amount: amount.toString(),
      }))
      .addMemo(Memo.text('Lefta Deposit Faucet'))
      .setTimeout(300)
      .build();

    tx.sign(faucetKp);

    const result = await server.sendTransaction(tx);
    if (result.status === 'ERROR') {
      return NextResponse.json({ success: false, error: 'Faucet transaction failed' }, { status: 500 });
    }

    await server.pollTransaction(result.hash);
    return NextResponse.json({ success: true, hash: result.hash });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Faucet deposit failed',
    }, { status: 500 });
  }
}
