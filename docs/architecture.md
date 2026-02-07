# Architecture

UniPerk combines ENS, Yellow Network, and Uniswap V4 to create a trust layer for DeFi agents.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Layer                               │
│  ┌──────────┐    ┌───────────────┐    ┌──────────────────────┐ │
│  │  Wallet  │───▶│ ENS Subdomain │───▶│ Permission Records   │ │
│  └──────────┘    │ user.uniperk  │    │ maxTrade, tokens...  │ │
│                  └───────────────┘    └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Off-Chain Layer                             │
│  ┌──────────────┐    ┌─────────────┐    ┌──────────────────┐   │
│  │ UniPerk Agent│───▶│ Yellow SDK  │───▶│ State Channel    │   │
│  │ (OpenClaw)   │    │ (Nitrolite) │    │ Instant Trades   │   │
│  └──────────────┘    └─────────────┘    └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       On-Chain Layer                             │
│  ┌──────────────┐    ┌─────────────┐    ┌──────────────────┐   │
│  │AgentRegistry │    │UniPerkHook  │    │ Uniswap V4 Pool  │   │
│  │ Permissions  │───▶│ Tier Fees   │───▶│ WETH/USDC        │   │
│  └──────────────┘    └─────────────┘    └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

1. User sets permissions in ENS text records
2. Agent reads permissions before trading
3. Trades execute instantly via Yellow state channels
4. Settlement happens on Uniswap V4 with hook validation
5. Hook updates user tier based on activity

## Contract Interaction

```
User Wallet
     │
     ├──▶ AgentRegistry.registerAgent()
     │         │
     │         ▼
     │    Agent Authorized
     │         │
     ▼         ▼
Yellow Network ──▶ UniPerkHook._beforeSwap()
                        │
                        ├── Validate agent
                        ├── Check tier
                        └── Apply fee discount
                              │
                              ▼
                   UniPerkHook._afterSwap()
                        │
                        ├── Update trade count
                        └── Promote tier if eligible
```

## Tier Progression

| Tier | Trades Required | Fee Discount |
|------|-----------------|--------------|
| Bronze | 0 | 0% |
| Silver | 10+ | 1% |
| Gold | 50+ | 3% |
| Platinum | 200+ | 5% |

## Security Model

- Agent permissions stored on-chain in AgentRegistry
- ENS text records provide portable identity
- Trade limits enforced at hook level
- Owner can revoke agent at any time
