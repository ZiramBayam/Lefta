# Lefta

**Web3 remittance for Indonesian migrant workers — send USDC, auto-split on-chain to family budget categories.**

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-090909?logo=stellar)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Soroban-27.x-7B1FA2)](https://soroban.stellar.org)
[![Next.js](https://img.shields.io/badge/Next.js-15.3-000000?logo=next.js)](https://nextjs.org)
[![Rust](https://img.shields.io/badge/Rust-1.91-DEA584?logo=rust)](https://rust-lang.org)
[![MIT license](https://img.shields.io/badge/license-MIT-brightgreen)](LICENSE)

---

## Overview

Indonesian migrant workers (TKIs) send remittances home, but the money rarely reaches its intended use — education fees get spent on daily needs, business capital gets mixed with household money.

**Lefta** lets TKIs send USDC from abroad with pre-agreed budget splits baked into the transaction itself. Funds are automatically distributed on-chain to separate recipient wallets for Household, Education, Business, Renovation, or any custom category.

LINK: lefta-stellar.vercel.app
Built for the **APAC Stellar Hackathon 2026**.

---

## Features

- **Budget Templates** — Create on-chain split templates with up to 5 categories and percentage allocations
- **Auto-Split Transfers** — Send USDC once; the SplitRouter contract atomically distributes to each recipient
- **Direct Transfers** — Simple single-recipient USDC sends
- **Bilingual UI** — Full Indonesian (ID) and English (EN) support
- **Wallet Integration** — Connect via Freighter browser wallet
- **Real-Time Exchange Rates** — USDC/IDR rates from exchangerate-api.com and CoinGecko
- **Mock Mode** — Full UI development without blockchain (localStorage-backed)

---

## Architecture

```
┌──────────────┐    ┌─────────────────────┐    ┌─────────────────┐
│  Freighter   │    │  Next.js Frontend   │    │  Soroban RPC    │
│  (Wallet)    │◄──►│  (React/TypeScript) │───►│  (testnet)      │
└──────────────┘    └─────────────────────┘    └──────┬──────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │   SplitRouter   │
                                              │  (Soroban)      │
                                              └──┬──────────┬───┘
                                                 │          │
                                    ┌────────────▼──┐  ┌───▼──────────┐
                                    │TemplateRegistry│  │ USDC Token   │
                                    │  (Soroban)     │  │ (SAC)        │
                                    └────────────────┘  └──────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Rust + soroban-sdk 27.0.0 → WASM |
| Frontend | Next.js 15.3.8 (App Router), React 19, TypeScript 5.8 |
| Styling | Tailwind CSS v4, Framer Motion, Lucide React |
| Blockchain SDK | @stellar/stellar-sdk 16.x |
| Wallet | @stellar/freighter-api 6.x |
| Deployment | Vercel (frontend), Stellar Testnet (contracts) |

---

## Smart Contracts

### TemplateRegistry
`contracts/template-registry/src/lib.rs`

CRUD for split templates. Each template stores allocations as `(label, recipient_address, basis_points)`.

- `create_template` — Create a template with up to 5 allocations (must total 10000 bp)
- `update_template` — Modify allocations (sender only)
- `deactivate_template` — Soft-delete
- `get_template`, `get_sender_templates`, `is_active` — Read functions

### SplitRouter
`contracts/split-router/src/lib.rs`

Executes split transfers atomically. Pulls USDC from sender, calculates per-recipient amounts (last allocation absorbs rounding remainder), distributes to each recipient.

- `transfer` — Execute a split transfer using a template
- `send_direct` — Single-recipient USDC transfer (no split)
- `create_template`, `deactivate_template` — Template management

---

## Deployed Contracts (Stellar Testnet)

| Contract | Address |
|----------|---------|
| TemplateRegistry | `CDCWHFVVHHF6Y72OEWH7OTQX7YUYJR2LB627J6VW25UJWZQOCUCYKPCA` |
| SplitRouter | `CA3HYBGF47RFFR7EP36RL2LOAOWTNCLPIWHHBC3HMM67PWOX53OF7V22` |
| USDC (SAC) | `CAFFIKBNRYES5IMSHYOAHFQHUYFNB6DQYH6WICEGYP6X72LHOAY3SABL` |

**Network:** Stellar Testnet  
**Deployed:** 2026-07-15

---

## Getting Started

### Prerequisites

- Node.js 20+
- Rust 1.91.0 with `wasm32-unknown-unknown` target
- Stellar wallet ([Freighter](https://freighter.app) browser extension)
- `soroban-cli` (for contract deployment)

### Frontend

```bash
# Clone
git clone https://github.com/your-username/lefta.git
cd lefta/frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser with Freighter installed (switch to Testnet).

### Smart Contracts

```bash
cd contracts

# Run tests
cargo test

# Build WASM
cargo build --target wasm32-unknown-unknown --release

# Deploy to testnet (automated)
./deploy.sh
```

---

## Configuration

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_NETWORK` | Stellar network (`testnet`) |
| `NEXT_PUBLIC_HORIZON_URL` | Horizon RPC endpoint |
| `NEXT_PUBLIC_SOROBAN_RPC` | Soroban RPC endpoint |
| `NEXT_PUBLIC_USE_REAL_CONTRACT` | `"true"` for on-chain, unset for mock mode |
| `NEXT_PUBLIC_TEMPLATE_REGISTRY_CONTRACT_ID` | Deployed TemplateRegistry address |
| `NEXT_PUBLIC_SPLIT_ROUTER_CONTRACT_ID` | Deployed SplitRouter address |
| `NEXT_PUBLIC_USDC_CONTRACT` | USDC SAC contract address |
| `NEXT_PUBLIC_USDC_ISSUER` | USDC issuer account |
| `NEXT_PUBLIC_FAUCET_SECRET_KEY` | Testnet faucet signing key |
| `NEXT_PUBLIC_FAUCET_PUBLIC_KEY` | Testnet faucet public key |

---

## Testing

### Contracts

```bash
cd contracts
cargo test
```

Tests cover: split calculation (including rounding), allocation validation (empty, duplicate, total ≠ 10000, too many, label length), template ID uniqueness, and minimum amount enforcement.

## Project Structure

```
Lefta/
├── contracts/
│   ├── template-registry/src/lib.rs   # TemplateRegistry contract
│   ├── split-router/src/lib.rs        # SplitRouter contract
│   ├── Cargo.toml                     # Workspace config
│   ├── rust-toolchain.toml            # Rust toolchain pinning
│   ├── deployed.json                  # Deployed contract addresses
│   └── deploy.sh                      # Build + deploy script
├── frontend/
│   ├── src/
│   │   ├── app/                       # Next.js App Router pages + layout
│   │   ├── components/                # UI components (tabs, drawers, modals)
│   │   ├── context/                   # Wallet + App state management
│   │   ├── contracts/                 # Contract API + mock layer
│   │   ├── hooks/                     # Custom React hooks
│   │   └── lib/                       # Types, constants, helpers
│   ├── package.json
│   └── next.config.ts
├── docs/                              # Development documentation
└── .env.example                       # Environment variable template
```

---

## License

[MIT](LICENSE)
