#!/usr/bin/env bash
# Deploy OffchainResolver (implementation + factory + one resolver) on Mainnet.
# Usage:
#   export DEPLOYER_PRIVATE_KEY=0x...
#   ./scripts/deploy-offchain-resolver.sh "https://uniperk-ens-gateway.xxx.workers.dev"
# Optional: export SIGNER_ADDRESS=0x... to skip reading from gateway/.dev.vars

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GATEWAY_URL="${1:?Usage: $0 GATEWAY_URL"}"

if [ -z "$SIGNER_ADDRESS" ]; then
  if [ -f "$REPO_ROOT/gateway/.dev.vars" ]; then
    SIGNER_ADDRESS=$(cd "$REPO_ROOT/gateway" && node ../scripts/get-signer-address.mjs 2>/dev/null | tail -1)
  fi
  if [ -z "$SIGNER_ADDRESS" ]; then
    echo "Set SIGNER_ADDRESS (or ensure gateway/.dev.vars has PRIVATE_KEY and run from repo root)"
    exit 1
  fi
fi

if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
  echo "Set DEPLOYER_PRIVATE_KEY"
  exit 1
fi

export GATEWAY_URL
export SIGNER_ADDRESS
cd "$REPO_ROOT/scripts/ccip-resolver"
forge script script/DeployOffchainResolver.s.sol \
  --rpc-url mainnet \
  --broadcast \
  --private-key "$DEPLOYER_PRIVATE_KEY"
