#!/bin/bash
# UniPerk Agent Setup Script
# Configures OpenClaw agent with Yellow Network skill

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CONTRACTS_ENV="$ROOT_DIR/contracts/.env"
SKILL_DIR="$SCRIPT_DIR/skills/yellow-sdk"

echo "🦄 UniPerk Agent Setup"
echo "======================"
echo ""

# 1. Check Node.js
echo "1️⃣ Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install Node.js 18+:"
    echo "   https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Found: $(node -v)"
    exit 1
fi
echo "   ✅ Node.js $(node -v)"

# 2. Check agent wallet
echo ""
echo "2️⃣ Checking agent wallet..."
if [ ! -f "$CONTRACTS_ENV" ]; then
    echo "❌ Agent wallet not configured."
    echo "   Run: ./scripts/setup-wallet.sh"
    exit 1
fi

if ! grep -q "AGENT_PRIVATE_KEY" "$CONTRACTS_ENV"; then
    echo "❌ AGENT_PRIVATE_KEY not found in contracts/.env"
    echo "   Run: ./scripts/setup-wallet.sh"
    exit 1
fi

AGENT_ADDRESS=$(grep "AGENT_ADDRESS" "$CONTRACTS_ENV" | cut -d'=' -f2)
echo "   ✅ Agent wallet: $AGENT_ADDRESS"

# 3. Install skill dependencies
echo ""
echo "3️⃣ Installing Yellow SDK dependencies..."
cd "$SKILL_DIR"

# Create package.json if not exists
if [ ! -f "package.json" ]; then
    cat > package.json << 'EOF'
{
  "name": "uniperk-yellow-sdk",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@erc7824/nitrolite": "^0.5.3",
    "viem": "^2.0.0",
    "ws": "^8.0.0",
    "dotenv": "^16.0.0"
  }
}
EOF
fi

npm install --silent
echo "   ✅ Dependencies installed"

# 4. Verify Yellow Network connection
echo ""
echo "4️⃣ Testing Yellow Network connection..."
cd "$SKILL_DIR/scripts"

# Quick connection test (timeout 10s)
timeout 10 node -e "
const WebSocket = require('ws');
const ws = new WebSocket('wss://clearnet.yellow.com/ws');
ws.on('open', () => { console.log('   ✅ Yellow Network reachable'); ws.close(); process.exit(0); });
ws.on('error', (e) => { console.log('   ⚠️  Yellow Network unreachable (may need VPN)'); process.exit(0); });
setTimeout(() => { console.log('   ⚠️  Connection timeout'); process.exit(0); }, 8000);
" 2>/dev/null || echo "   ⚠️  Could not verify (non-blocking)"

# 5. Create .env.local for skill
echo ""
echo "5️⃣ Configuring environment..."
cd "$SKILL_DIR"

cat > .env.local << EOF
# Yellow Network Configuration
YELLOW_WS=wss://clearnet.yellow.com/ws
NITROLITE_CUSTODY=0x490fb189DdE3a01B00be9BA5F41e3447FbC838b6

# UniPerk Contracts (Base Mainnet)
AGENT_REGISTRY=0xd5A14b5dA79Abb78a5B307eC28E9d9711cdd5cEF
UNIPERK_HOOK=0x825Fc7Ac1E5456674D7dBbB4D12467E8253740C0
USDC_ADDRESS=0x833589fCD6eDb6E08f4c7c32D4f71b54bdA02913

# Agent wallet (loaded from contracts/.env)
AGENT_ADDRESS=$AGENT_ADDRESS
EOF

echo "   ✅ Environment configured"

# 6. Summary
echo ""
echo "======================"
echo "✅ Agent setup complete!"
echo ""
echo "Agent Configuration:"
echo "  📍 Address: $AGENT_ADDRESS"
echo "  🟡 Yellow WS: wss://clearnet.yellow.com/ws"
echo "  📦 Nitrolite: 0x490fb189DdE3a01B00be9BA5F41e3447FbC838b6"
echo ""
echo "Next steps:"
echo "  1. Fund agent: ../scripts/fund-agent.sh 0.01"
echo "  2. Deposit to Yellow: node skills/yellow-sdk/scripts/deposit.js 100"
echo "  3. Execute trade: node skills/yellow-sdk/scripts/trade.js USDC WETH 50"
echo ""
echo "To start the agent with OpenClaw:"
echo "  openclaw start --config ./openclaw.json"
