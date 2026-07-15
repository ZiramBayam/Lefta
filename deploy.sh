#!/bin/bash
# Deployment script for Lefta Soroban Contracts
# Usage: ./deploy.sh <key_name> <network>
#
# Prerequisites:
#   stellar keys generate <key_name>

set -e

# Config
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEY_NAME="${1:-deployer}"
NETWORK="${2:-testnet}"

# WASM paths
TEMPLATE_REGISTRY_WASM="$SCRIPT_DIR/contracts/target/wasm32v1-none/release/template_registry.wasm"
SPLIT_ROUTER_WASM="$SCRIPT_DIR/contracts/target/wasm32v1-none/release/split_router.wasm"

echo "🚀 Deploying Lefta Contracts"
echo "=========================================="
echo "Network:  $NETWORK"
echo "Key:      $KEY_NAME"
echo ""

# Check key exists
if ! stellar keys ls | grep -q "$KEY_NAME"; then
    echo "❌ Key '$KEY_NAME' not found!"
    echo "   Generate with: stellar keys generate $KEY_NAME"
    exit 1
fi

# Step 1: Build WASM
echo "📦 Step 1: Building WASM..."
cd "$SCRIPT_DIR/contracts"
cargo build --release --target wasm32v1-none
cd "$SCRIPT_DIR"
echo "✅ Build complete"

# Step 2: Deploy TemplateRegistry
echo ""
echo "📝 Step 2: Deploying TemplateRegistry..."
TEMPLATE_REGISTRY_ID=$(stellar contract deploy \
    --wasm "$TEMPLATE_REGISTRY_WASM" \
    --source-account "$KEY_NAME" \
    --network "$NETWORK" \
    2>&1 | grep -oE 'C[A-Z0-9]{55}' | tail -1)

echo "✅ TemplateRegistry: $TEMPLATE_REGISTRY_ID"

# Step 3: Deploy SplitRouter
echo ""
echo "📝 Step 3: Deploying SplitRouter..."
SPLIT_ROUTER_ID=$(stellar contract deploy \
    --wasm "$SPLIT_ROUTER_WASM" \
    --source-account "$KEY_NAME" \
    --network "$NETWORK" \
    2>&1 | grep -oE 'C[A-Z0-9]{55}' | tail -1)

echo "✅ SplitRouter: $SPLIT_ROUTER_ID"

# Step 4: Save deployed addresses
echo ""
echo "💾 Step 4: Saving to contracts/deployed.json..."
cat > "$SCRIPT_DIR/contracts/deployed.json" << EOF
{
    "network": "$NETWORK",
    "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "deployed_by": "$KEY_NAME",
    "contracts": {
        "template_registry": "$TEMPLATE_REGISTRY_ID",
        "split_router": "$SPLIT_ROUTER_ID"
    }
}
EOF
echo "✅ Saved"

# Step 5: Update .env.local
echo ""
echo "📝 Step 5: Updating .env.local..."
sed -i "s|NEXT_PUBLIC_TEMPLATE_REGISTRY_CONTRACT_ID=.*|NEXT_PUBLIC_TEMPLATE_REGISTRY_CONTRACT_ID=$TEMPLATE_REGISTRY_ID|" "$SCRIPT_DIR/.env.local" 2>/dev/null || true
sed -i "s|NEXT_PUBLIC_SPLIT_ROUTER_CONTRACT_ID=.*|NEXT_PUBLIC_SPLIT_ROUTER_CONTRACT_ID=$SPLIT_ROUTER_ID|" "$SCRIPT_DIR/.env.local" 2>/dev/null || true
echo "✅ Updated"

echo ""
echo "=========================================="
echo "🎉 Deployment Complete!"
echo ""
echo "Contract Addresses:"
echo "  TemplateRegistry: $TEMPLATE_REGISTRY_ID"
echo "  SplitRouter:     $SPLIT_ROUTER_ID"
echo ""
echo "Explorer: https://stellar.expert/explorer/testnet"
