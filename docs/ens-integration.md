# ENS Integration

UniPerk uses ENS text records as a portable permission layer for DeFi agents.

## Subdomain Setup

Users claim a subdomain under `uniperk.eth`:
```
alice.uniperk.eth
bob.uniperk.eth
```

Subdomains are gasless via NameStone API.

## Text Records

| Record | Type | Example | Description |
|--------|------|---------|-------------|
| `agent.uniperk.allowed` | boolean | `true` | Master switch |
| `agent.uniperk.maxTrade` | number | `1000` | Max trade in USDC |
| `agent.uniperk.tokens` | string | `ETH,USDC,WBTC` | Allowed tokens |
| `agent.uniperk.slippage` | number | `50` | Max slippage (bps) |
| `agent.uniperk.expires` | number | `1707609600` | Unix timestamp |

## Reading Records

Using viem:

```javascript
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http()
})

const allowed = await client.getEnsText({
  name: 'alice.uniperk.eth',
  key: 'agent.uniperk.allowed'
})

const maxTrade = await client.getEnsText({
  name: 'alice.uniperk.eth',
  key: 'agent.uniperk.maxTrade'
})
```

## Writing Records

Users update records via ENS app or programmatically:

```javascript
import { createWalletClient } from 'viem'

const tx = await walletClient.writeContract({
  address: ENS_RESOLVER,
  abi: resolverAbi,
  functionName: 'setText',
  args: [namehash('alice.uniperk.eth'), 'agent.uniperk.maxTrade', '2000']
})
```

## Validation Flow

```
1. Agent receives trade request
2. Read ENS text records for user
3. Check: allowed == true?
4. Check: amount <= maxTrade?
5. Check: token in tokens list?
6. Check: expires > now?
7. If all pass → execute trade
```

## Cross-Chain

ENS lives on mainnet, but UniPerk pools are on Base. The agent reads ENS on mainnet and executes on Base, bridging identity across chains.
