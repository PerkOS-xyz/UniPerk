---
name: yellow-sdk
description: Yellow Network integration for instant off-chain trading via Nitrolite state channels.
---

# Yellow SDK Skill

Integrate with Yellow Network for gasless, instant trade execution using the Nitrolite SDK.

## Overview

Yellow Network provides state channels for off-chain trading with on-chain settlement. This skill enables:
- Opening/closing state channels
- Instant trade execution (no gas)
- Batch settlement to Uniswap V4

## Setup

```bash
# Install Nitrolite SDK
npm install @erc7824/nitrolite

# Required environment variables
# Production: wss://clearnet.yellow.com/ws
# Sandbox:    wss://clearnet-sandbox.yellow.com/ws
YELLOW_WS=wss://clearnet.yellow.com/ws
NITROLITE_CUSTODY=0x490fb189DdE3a01B00be9BA5F41e3447FbC838b6
AGENT_PRIVATE_KEY=<from contracts/.env>
```

> **Note:** Use `clearnet-sandbox` for testing, `clearnet` for production/demo.

## Scripts

### connect.js
Connect to Yellow Network WebSocket and authenticate.

```bash
node scripts/connect.js
```

### deposit.js
Deposit USDC to Nitrolite Custody for trading.

```bash
node scripts/deposit.js <amount_usdc>
```

### trade.js
Execute a trade via state channel.

```bash
node scripts/trade.js <from_token> <to_token> <amount>
```

## Architecture

```
User Request
    │
    ▼
┌─────────────────┐
│ Read ENS        │  ← Validate permissions
│ Permissions     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Yellow Network  │  ← Instant execution (off-chain)
│ State Channel   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Uniswap V4      │  ← Settlement (on-chain)
│ UniPerkHook     │
└─────────────────┘
```

## Key Contracts (Base Mainnet)

| Contract | Address |
|----------|---------|
| Nitrolite Custody | `0x490fb189DdE3a01B00be9BA5F41e3447FbC838b6` |
| USDC | `0x833589fCD6eDb6E08f4c7c32D4f71b54bdA02913` |
| UniPerkHook | `0x825Fc7Ac1E5456674D7dBbB4D12467E8253740C0` |

## Nitrolite SDK Usage

```javascript
import { NitroliteClient } from '@erc7824/nitrolite';

// Initialize client
const client = new NitroliteClient({
  wsUrl: process.env.YELLOW_WS,
  privateKey: process.env.AGENT_PRIVATE_KEY,
  chainId: 8453
});

// Connect
await client.connect();

// Open channel
const channel = await client.openChannel({
  asset: USDC_ADDRESS,
  amount: parseUnits('100', 6)
});

// Execute trade
await client.trade({
  channelId: channel.id,
  fromToken: 'USDC',
  toToken: 'ETH',
  amount: parseUnits('50', 6)
});

// Close and settle
await client.closeChannel(channel.id);
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `INSUFFICIENT_BALANCE` | Not enough in channel | Deposit more USDC |
| `PERMISSION_DENIED` | ENS permissions invalid | Check text records |
| `CHANNEL_NOT_FOUND` | Channel closed/expired | Open new channel |
| `TRADE_LIMIT_EXCEEDED` | Exceeds maxTrade | Reduce trade size |

## References

- [Nitrolite Docs](https://docs.yellow.org/nitrolite)
- [Yellow Network](https://yellow.org)
- [ERC-7824 Spec](https://eips.ethereum.org/EIPS/eip-7824)
