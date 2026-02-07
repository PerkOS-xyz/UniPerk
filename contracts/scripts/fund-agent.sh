#!/bin/bash
# UniPerk Fund Agent Script
# Sends ETH/USDC to agent wallet and optionally deposits to Nitrolite

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACTS_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$CONTRACTS_DIR/.env"

# Load environment
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
fi

# Addresses (Base Mainnet)
USDC_ADDRESS="0x833589fCD6eDb6E08f4c7c32D4f71b54bdA02913"
NITROLITE_CUSTODY="0x490fb189DdE3a01B00be9BA5F41e3447FbC838b6"

usage() {
    echo "Usage: $0 [OPTIONS] <amount>"
    echo ""
    echo "Options:"
    echo "  --eth           Send ETH to agent (default)"
    echo "  --usdc          Send USDC to agent"
    echo "  --nitrolite     Deposit USDC to Yellow Nitrolite Custody"
    echo "  --check         Check agent balances only"
    echo ""
    echo "Examples:"
    echo "  $0 0.01                    # Send 0.01 ETH to agent"
    echo "  $0 --usdc 10               # Send 10 USDC to agent"
    echo "  $0 --nitrolite 50          # Deposit 50 USDC to Nitrolite"
    echo "  $0 --check                 # Check balances"
    exit 1
}

check_balances() {
    echo "🔍 Checking agent balances..."
    echo ""
    
    if [ -z "$AGENT_ADDRESS" ]; then
        echo "❌ AGENT_ADDRESS not set. Run setup.sh first."
        exit 1
    fi
    
    echo "Agent: $AGENT_ADDRESS"
    echo ""
    
    # ETH balance
    ETH_BALANCE=$(cast balance "$AGENT_ADDRESS" --rpc-url https://mainnet.base.org)
    ETH_FORMATTED=$(cast from-wei "$ETH_BALANCE")
    echo "ETH:  $ETH_FORMATTED"
    
    # USDC balance
    USDC_BALANCE=$(cast call "$USDC_ADDRESS" "balanceOf(address)(uint256)" "$AGENT_ADDRESS" --rpc-url https://mainnet.base.org)
    USDC_FORMATTED=$(echo "scale=6; $USDC_BALANCE / 1000000" | bc)
    echo "USDC: $USDC_FORMATTED"
    
    echo ""
}

send_eth() {
    local AMOUNT=$1
    
    if [ -z "$PRIVATE_KEY" ]; then
        echo "❌ PRIVATE_KEY not set in .env"
        exit 1
    fi
    
    if [ -z "$AGENT_ADDRESS" ]; then
        echo "❌ AGENT_ADDRESS not set. Run setup.sh first."
        exit 1
    fi
    
    echo "📤 Sending $AMOUNT ETH to agent..."
    echo "   To: $AGENT_ADDRESS"
    echo ""
    
    cast send "$AGENT_ADDRESS" \
        --value "${AMOUNT}ether" \
        --private-key "$PRIVATE_KEY" \
        --rpc-url https://mainnet.base.org
    
    echo ""
    echo "✅ ETH sent!"
    check_balances
}

send_usdc() {
    local AMOUNT=$1
    
    if [ -z "$PRIVATE_KEY" ]; then
        echo "❌ PRIVATE_KEY not set in .env"
        exit 1
    fi
    
    if [ -z "$AGENT_ADDRESS" ]; then
        echo "❌ AGENT_ADDRESS not set. Run setup.sh first."
        exit 1
    fi
    
    # Convert to 6 decimals
    AMOUNT_WEI=$(echo "$AMOUNT * 1000000" | bc | cut -d'.' -f1)
    
    echo "📤 Sending $AMOUNT USDC to agent..."
    echo "   To: $AGENT_ADDRESS"
    echo ""
    
    cast send "$USDC_ADDRESS" \
        "transfer(address,uint256)" \
        "$AGENT_ADDRESS" \
        "$AMOUNT_WEI" \
        --private-key "$PRIVATE_KEY" \
        --rpc-url https://mainnet.base.org
    
    echo ""
    echo "✅ USDC sent!"
    check_balances
}

deposit_nitrolite() {
    local AMOUNT=$1
    
    if [ -z "$AGENT_PRIVATE_KEY" ]; then
        echo "❌ AGENT_PRIVATE_KEY not set. Run setup.sh first."
        exit 1
    fi
    
    # Convert to 6 decimals
    AMOUNT_WEI=$(echo "$AMOUNT * 1000000" | bc | cut -d'.' -f1)
    
    echo "🟡 Depositing $AMOUNT USDC to Yellow Nitrolite Custody..."
    echo "   Contract: $NITROLITE_CUSTODY"
    echo ""
    
    # Step 1: Approve USDC
    echo "1️⃣ Approving USDC..."
    cast send "$USDC_ADDRESS" \
        "approve(address,uint256)" \
        "$NITROLITE_CUSTODY" \
        "$AMOUNT_WEI" \
        --private-key "$AGENT_PRIVATE_KEY" \
        --rpc-url https://mainnet.base.org
    
    # Step 2: Deposit to Nitrolite
    # Note: This uses the Nitrolite deposit function
    # Actual function signature may vary - check Yellow SDK docs
    echo "2️⃣ Depositing to Nitrolite..."
    cast send "$NITROLITE_CUSTODY" \
        "deposit(address,uint256)" \
        "$USDC_ADDRESS" \
        "$AMOUNT_WEI" \
        --private-key "$AGENT_PRIVATE_KEY" \
        --rpc-url https://mainnet.base.org
    
    echo ""
    echo "✅ Deposited to Nitrolite!"
    echo ""
    echo "Note: Use @erc7824/nitrolite SDK to manage state channels"
}

# Parse arguments
MODE="eth"
AMOUNT=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --eth)
            MODE="eth"
            shift
            ;;
        --usdc)
            MODE="usdc"
            shift
            ;;
        --nitrolite)
            MODE="nitrolite"
            shift
            ;;
        --check)
            check_balances
            exit 0
            ;;
        -h|--help)
            usage
            ;;
        *)
            AMOUNT=$1
            shift
            ;;
    esac
done

# Execute
if [ -z "$AMOUNT" ]; then
    usage
fi

echo "🦄 UniPerk Fund Agent"
echo "====================="
echo ""

case $MODE in
    eth)
        send_eth "$AMOUNT"
        ;;
    usdc)
        send_usdc "$AMOUNT"
        ;;
    nitrolite)
        deposit_nitrolite "$AMOUNT"
        ;;
esac
