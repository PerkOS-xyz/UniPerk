#!/bin/bash
# UniPerk - Deploy Contracts
# Wrapper for Foundry forge scripts

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CONTRACTS_DIR="$ROOT_DIR/contracts"

usage() {
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  hook          Deploy UniPerkHook"
    echo "  pool          Create pool and add liquidity"
    echo "  liquidity     Add liquidity to existing pool"
    echo "  swap          Execute test swap"
    echo "  all           Deploy hook + create pool + add liquidity"
    echo ""
    echo "Options:"
    echo "  --broadcast   Actually send transactions (default: dry-run)"
    echo "  --verify      Verify on BaseScan after deploy"
    echo ""
    echo "Examples:"
    echo "  $0 hook --broadcast              # Deploy hook to Base"
    echo "  $0 pool --broadcast --verify     # Create pool and verify"
    echo "  $0 all --broadcast               # Full deployment"
    exit 1
}

# Check Foundry
if ! command -v forge &> /dev/null; then
    echo "❌ Foundry not installed."
    echo "   Install: curl -L https://foundry.paradigm.xyz | bash && foundryup"
    exit 1
fi

# Check .env
if [ ! -f "$CONTRACTS_DIR/.env" ]; then
    echo "❌ contracts/.env not found."
    echo "   Run: ./scripts/setup-wallet.sh"
    exit 1
fi

# Load env
source "$CONTRACTS_DIR/.env"

# Parse arguments
COMMAND=""
BROADCAST=""
VERIFY=""

while [[ $# -gt 0 ]]; do
    case $1 in
        hook|pool|liquidity|swap|all)
            COMMAND=$1
            shift
            ;;
        --broadcast)
            BROADCAST="--broadcast"
            shift
            ;;
        --verify)
            VERIFY="--verify"
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

if [ -z "$COMMAND" ]; then
    usage
fi

cd "$CONTRACTS_DIR"

echo "🦄 UniPerk Deploy"
echo "================="
echo ""
echo "Command: $COMMAND"
echo "Network: Base Mainnet"
[ -n "$BROADCAST" ] && echo "Mode: LIVE 🔴" || echo "Mode: Dry-run 🟡"
echo ""

deploy_hook() {
    echo "📦 Deploying UniPerkHook..."
    forge script script/00_DeployUniPerkHook.s.sol \
        --rpc-url https://mainnet.base.org \
        --private-key "$PRIVATE_KEY" \
        $BROADCAST $VERIFY \
        -vvv
}

create_pool() {
    echo "🏊 Creating pool and adding liquidity..."
    forge script script/01_CreatePoolAndAddLiquidity.s.sol \
        --rpc-url https://mainnet.base.org \
        --private-key "$PRIVATE_KEY" \
        $BROADCAST $VERIFY \
        -vvv
}

add_liquidity() {
    echo "💧 Adding liquidity..."
    forge script script/02_AddLiquidity.s.sol \
        --rpc-url https://mainnet.base.org \
        --private-key "$PRIVATE_KEY" \
        $BROADCAST $VERIFY \
        -vvv
}

test_swap() {
    echo "🔄 Executing test swap..."
    forge script script/03_Swap.s.sol \
        --rpc-url https://mainnet.base.org \
        --private-key "$PRIVATE_KEY" \
        $BROADCAST \
        -vvv
}

case $COMMAND in
    hook)
        deploy_hook
        ;;
    pool)
        create_pool
        ;;
    liquidity)
        add_liquidity
        ;;
    swap)
        test_swap
        ;;
    all)
        deploy_hook
        echo ""
        create_pool
        ;;
esac

echo ""
echo "✅ Done!"
