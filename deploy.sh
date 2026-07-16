#!/bin/bash
# Deployment script for Lefta Soroban Contracts
# Usage: ./deploy.sh <key_name> <network>
#
# Prerequisites:
#   stellar keys generate <key_name>

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEY_NAME="${1:-deployer}"
NETWORK="${2:-testnet}"

TEMPLATE_REGISTRY_WASM="$SCRIPT_DIR/contracts/target/wasm32v1-none/release/template_registry.wasm"
SPLIT_ROUTER_WASM="$SCRIPT_DIR/contracts/target/wasm32v1-none/release/split_router.wasm"

echo "🚀 Deploying Lefta Contracts"
echo "=========================================="
echo "Network:  $NETWORK"
echo "Key:      $KEY_NAME"
echo ""

if ! stellar keys ls | grep -q "$KEY_NAME"; then
    echo "❌ Key '$KEY_NAME' not found!"
    echo "   Generate with: stellar keys generate $KEY_NAME"
    exit 1
fi

SOURCE_REV=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
SOURCE_REPO="https://github.com/ZiramBayam/Lefta"

echo "📦 Step 1: Building WASM..."
cd "$SCRIPT_DIR/contracts"
cargo build --release --target wasm32v1-none
echo "✅ Build complete"

echo ""
echo "🏷️  Step 2: Embedding SEP-58 metadata..."
python3 -c "
import struct

def encode_leb128_u32(v):
    r = bytearray()
    while True:
        b = v & 0x7F
        v >>= 7
        if v: b |= 0x80
        r.append(b)
        if not (v & 0x80): break
    return bytes(r)

def xdr_pad(d):
    return d + b'\x00' * ((4 - len(d) % 4) % 4)

def xdr_string(s):
    b = s.encode()
    return struct.pack('>I', len(b)) + xdr_pad(b)

def xdr_entry(k, v):
    return struct.pack('>I', 0) + xdr_string(k) + xdr_string(v)

def inject(wasm_path, repo, rev):
    with open(wasm_path, 'rb') as f:
        wasm = bytearray(f.read())
    meta = xdr_entry('source_repo', repo) + xdr_entry('source_rev', rev)
    name = b'contractmetav0'
    section = bytes([0]) + encode_leb128_u32(len(name) + len(meta)) + encode_leb128_u32(len(name)) + name + meta
    pos = 8
    while pos < len(wasm):
        sid = wasm[pos]; pos += 1
        size = shift = 0
        while True:
            byte = wasm[pos]; size |= (byte & 0x7F) << shift; shift += 7; pos += 1
            if not (byte & 0x80): break
        pos += size
    with open(wasm_path, 'wb') as f:
        f.write(bytes(wasm[:pos]) + section + bytes(wasm[pos:]))
    print(f'  Injected SEP-58 metadata into {wasm_path}')

inject('$TEMPLATE_REGISTRY_WASM', '$SOURCE_REPO', '$SOURCE_REV')
inject('$SPLIT_ROUTER_WASM', '$SOURCE_REPO', '$SOURCE_REV')
"
echo "✅ SEP-58 metadata embedded"

echo ""
echo "📝 Step 3: Deploying TemplateRegistry..."
TEMPLATE_REGISTRY_ID=$(stellar contract deploy \
    --wasm "$TEMPLATE_REGISTRY_WASM" \
    --source-account "$KEY_NAME" \
    --network "$NETWORK" \
    2>&1 | grep -oE 'C[A-Z0-9]{55}' | tail -1)
echo "✅ TemplateRegistry: $TEMPLATE_REGISTRY_ID"

echo ""
echo "📝 Step 4: Deploying SplitRouter..."
SPLIT_ROUTER_ID=$(stellar contract deploy \
    --wasm "$SPLIT_ROUTER_WASM" \
    --source-account "$KEY_NAME" \
    --network "$NETWORK" \
    2>&1 | grep -oE 'C[A-Z0-9]{55}' | tail -1)
echo "✅ SplitRouter: $SPLIT_ROUTER_ID"

echo ""
echo "💾 Step 5: Saving to contracts/deployed.json..."
cat > "$SCRIPT_DIR/contracts/deployed.json" << EOF
{
    "network": "$NETWORK",
    "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "deployed_by": "$KEY_NAME",
    "contracts": {
        "template_registry": "$TEMPLATE_REGISTRY_ID",
        "split_router": "$SPLIT_ROUTER_ID",
        "usdc_sac": "CAFFIKBNRYES5IMSHYOAHFQHUYFNB6DQYH6WICEGYP6X72LHOAY3SABL"
    }
}
EOF
echo "✅ Saved"

echo ""
echo "📝 Step 6: Updating .env.local files..."
for envfile in "$SCRIPT_DIR/.env.local" "$SCRIPT_DIR/frontend/.env.local"; do
    if [ -f "$envfile" ]; then
        sed -i "s|NEXT_PUBLIC_TEMPLATE_REGISTRY_CONTRACT_ID=.*|NEXT_PUBLIC_TEMPLATE_REGISTRY_CONTRACT_ID=$TEMPLATE_REGISTRY_ID|" "$envfile" 2>/dev/null || true
        sed -i "s|NEXT_PUBLIC_SPLIT_ROUTER_CONTRACT_ID=.*|NEXT_PUBLIC_SPLIT_ROUTER_CONTRACT_ID=$SPLIT_ROUTER_ID|" "$envfile" 2>/dev/null || true
        echo "  ✅ $envfile"
    fi
done

echo ""
echo "=========================================="
echo "🎉 Deployment Complete!"
echo ""
echo "Contract Addresses:"
echo "  TemplateRegistry: $TEMPLATE_REGISTRY_ID"
echo "  SplitRouter:     $SPLIT_ROUTER_ID"
echo ""
echo "Verify at: https://stellar-contract-verification.vercel.app/verify"
