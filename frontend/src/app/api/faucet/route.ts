import { NextRequest, NextResponse } from 'next/server';
import {
  TransactionBuilder, BASE_FEE, Operation, Asset, Memo, Keypair, Account,
} from '@stellar/stellar-sdk';

const FAUCET_SECRET_KEY = process.env.FAUCET_SECRET_KEY || '';
// Issuer harus sama dengan NEXT_PUBLIC_USDC_ISSUER yang dipakai di seluruh app
const USDC_ISSUER = process.env.NEXT_PUBLIC_USDC_ISSUER || '';

function getHorizonUrl(): string {
  return process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org';
}

function getNetworkPassphrase(): string {
  return process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
    ? 'Public Global Stellar Network ; September 2015'
    : 'Test SDF Network ; September 2015';
}

async function getFaucetAccount() {
  const horizonUrl = getHorizonUrl();
  const faucetKp = Keypair.fromSecret(FAUCET_SECRET_KEY);
  const res = await fetch(`${horizonUrl}/accounts/${faucetKp.publicKey()}`);
  if (!res.ok) return null;
  return res.json();
}

function getUsdcIssuer(accountData: any): string | null {
  // Prioritaskan env variable untuk konsistensi issuer di seluruh app.
  // Fallback ke issuer dari balance faucet jika env tidak diset.
  if (USDC_ISSUER) return USDC_ISSUER;
  const balance = (accountData.balances || []).find((b: any) => b.asset_code === 'USDC');
  return balance?.asset_issuer || null;
}

export async function GET() {
  try {
    if (!FAUCET_SECRET_KEY) {
      return NextResponse.json({ error: 'Faucet not configured' }, { status: 500 });
    }
    // Jika USDC_ISSUER sudah diset via env, tidak perlu fetch account
    if (USDC_ISSUER) {
      return NextResponse.json({ issuer: USDC_ISSUER });
    }
    const accountData = await getFaucetAccount();
    if (!accountData) {
      return NextResponse.json({ error: 'Faucet account not found' }, { status: 500 });
    }
    const issuer = getUsdcIssuer(accountData);
    if (!issuer) {
      return NextResponse.json({ error: 'Faucet has no USDC balance' }, { status: 500 });
    }
    return NextResponse.json({ issuer });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
  }
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
    const horizonUrl = getHorizonUrl();

    const accountData = await getFaucetAccount();
    if (!accountData) {
      return NextResponse.json({ success: false, error: 'Faucet account not found on network' }, { status: 500 });
    }

    const usdcIssuer = getUsdcIssuer(accountData);
    if (!usdcIssuer) {
      return NextResponse.json({ success: false, error: 'Faucet has no USDC balance' }, { status: 500 });
    }

    const sourceAccount = new Account(faucetKp.publicKey(), accountData.sequence);
    const tx = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: getNetworkPassphrase(),
    })
      .addOperation(Operation.payment({
        destination: address,
        asset: new Asset('USDC', usdcIssuer),
        amount: amount.toString(),
      }))
      .addMemo(Memo.text('Lefta Deposit Faucet'))
      .setTimeout(300)
      .build();

    tx.sign(faucetKp);

    const txBlob = tx.toEnvelope().toXDR('base64');
    const formData = new URLSearchParams();
    formData.append('tx', txBlob);

    const submitRes = await fetch(`${horizonUrl}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    const submitData = await submitRes.json();

    if (!submitRes.ok) {
      const codes = submitData?.extras?.result_codes;
      const errorDetail = codes?.transaction === 'tx_failed' && codes?.operations
        ? `op_failed: ${codes.operations.join(', ')}`
        : codes?.transaction || submitData?.title || JSON.stringify(submitData);
      return NextResponse.json({ success: false, error: `Transaction failed: ${errorDetail}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, hash: submitData.hash });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Faucet deposit failed',
    }, { status: 500 });
  }
}
