# UniPerk 🦄

**Trust Layer for DeFi** — Portable identity, instant execution, smart settlement.

UniPerk is an autonomous DeFi agent that combines ENS identity, Yellow Network state channels, and Uniswap V4 hooks to enable trustless, gasless trading with reputation-aware fees.

## Key Features

- **ENS as Agent Permission System**: User preferences stored as ENS text records (`user.uniperk.eth`)
- **Instant Execution**: Yellow Network state channels for gasless off-chain trading
- **Identity-Aware Pools**: V4 hooks that adjust fees based on agent reputation
- **Tier System**: Bronze → Silver → Gold → Platinum with progressive fee discounts

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         UniPerk Flow                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User                ENS                 Yellow         V4     │
│    │                   │                    │            │      │
│    │  1. Set prefs     │                    │            │      │
│    │──────────────────>│                    │            │      │
│    │                   │                    │            │      │
│    │  2. Request trade │                    │            │      │
│    │───────────────────────────────────────>│            │      │
│    │                   │                    │            │      │
│    │                   │  3. Read limits    │            │      │
│    │                   │<───────────────────│            │      │
│    │                   │                    │            │      │
│    │                   │                    │ 4. Settle  │      │
│    │                   │                    │───────────>│      │
│    │                   │                    │            │      │
│    │  5. Confirmation  │                    │            │      │
│    │<───────────────────────────────────────────────────│      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
UniPerk/
├── app/                    # Next.js frontend
├── contracts/              # Solidity smart contracts
│   ├── src/
│   │   ├── AgentRegistry.sol    # ENS hybrid identity
│   │   └── UniPerkHook.sol      # V4 hook with tier fees
│   ├── script/
│   │   └── Deploy.s.sol
│   └── test/
├── agent/                  # OpenClaw agent config
│   ├── openclaw.json
│   └── skills/             # Yellow SDK integration
└── scripts/                # Setup and deployment
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14, wagmi, viem |
| Contracts | Solidity 0.8.24, Foundry |
| ENS | @ensdomains/ensjs, NameStone |
| Yellow | @erc7824/nitrolite v0.5.3 |
| Uniswap | v4-core, v4-periphery |
| Agent | OpenClaw |

## Network

**Base Mainnet** (Chain ID: 8453)

### Contract Addresses

| Contract | Address |
|----------|---------|
| PoolManager (V4) | `0x498581ff718922c3f8e6a244956af099b2652b2b` |
| Nitrolite Custody | `0x490fb189DdE3a01B00be9BA5F41e3447FbC838b6` |
| USDC | `0x833589fCD6eDb6E08f4c7c32D4f71b54bdA02913` |

## ENS Text Records

Users configure agent permissions via ENS text records:

| Record | Example | Description |
|--------|---------|-------------|
| `agent.uniperk.allowed` | `true` | Enable agent trading |
| `agent.uniperk.maxTrade` | `1.0` | Max trade size in ETH |
| `agent.uniperk.tokens` | `USDC,WETH` | Allowed tokens |
| `agent.uniperk.slippage` | `50` | Max slippage (basis points) |
| `agent.uniperk.expires` | `1707609600` | Permission expiry |

## Getting Started

### Prerequisites

- Node.js 18+
- Foundry
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/PerkOS-xyz/UniPerk.git
cd UniPerk

# Install contract dependencies
cd contracts
forge install

# Install frontend dependencies
cd ../app
npm install
```

### Build & Test

```bash
# Build contracts
cd contracts
forge build

# Run tests
forge test

# Deploy to Base
forge script script/Deploy.s.sol --rpc-url base --broadcast
```

## Bounties

| Protocol | Prize | Track |
|----------|-------|-------|
| Uniswap V4 | $2,500 | Agentic Finance |
| ENS | $1,500 | Most Creative DeFi |
| Yellow Network | $5,000 | Trading Apps |

## Team

Built for [ETH Global Hack The Money 2026](https://ethglobal.com/events/hackmoney2026)

## License

MIT
