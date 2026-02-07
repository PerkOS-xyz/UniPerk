# Yellow Network Integration

UniPerk uses Yellow Network (Nitrolite) for instant, gasless trade execution via state channels.

## Overview

Yellow Network provides:
- Instant trade execution (no block confirmation)
- Gasless trading within channels
- Batch settlement to reduce costs

## Setup

```bash
npm install @erc7824/nitrolite
```

## Contracts

| Contract | Address (Base) |
|----------|----------------|
| Nitrolite Custody | `0x490fb189DdE3a01B00be9BA5F41e3447FbC838b6` |
| USDC | `0x833589fCD6eDb6E08f4c7c32D4f71b54bdA02913` |

## Deposit Flow

```javascript
import { NitroliteClient } from '@erc7824/nitrolite'

const client = new NitroliteClient({
  wsUrl: 'wss://clearnet.yellow.com/ws',
  privateKey: AGENT_PRIVATE_KEY,
  chainId: 8453
})

await client.connect()

// Deposit USDC to custody
await client.deposit({
  asset: USDC_ADDRESS,
  amount: parseUnits('100', 6)
})
```

## Trading

Once funds are deposited, trades execute instantly:

```javascript
// Open state channel
const channel = await client.openChannel({
  asset: USDC_ADDRESS,
  amount: parseUnits('100', 6)
})

// Execute trade (instant, no gas)
await client.trade({
  channelId: channel.id,
  fromToken: 'USDC',
  toToken: 'ETH',
  amount: parseUnits('50', 6)
})

// Close channel and settle on-chain
await client.closeChannel(channel.id)
```

## Settlement

When channels close, Yellow settles through UniPerkHook on Uniswap V4:

```
State Channel Close
        │
        ▼
UniPerkHook._beforeSwap()
        │
        ├── Validate agent permissions
        └── Apply tier fee discount
        │
        ▼
Uniswap V4 Pool Swap
        │
        ▼
UniPerkHook._afterSwap()
        │
        └── Update user tier
```

## WebSocket Events

| Event | Description |
|-------|-------------|
| `auth_success` | Connected and authenticated |
| `channel_opened` | New state channel ready |
| `trade_executed` | Trade completed off-chain |
| `channel_closed` | Settlement pending |

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `INSUFFICIENT_BALANCE` | Not enough in channel | Deposit more |
| `CHANNEL_NOT_FOUND` | Channel expired | Open new channel |
| `TRADE_LIMIT_EXCEEDED` | ENS limit hit | Reduce amount |
