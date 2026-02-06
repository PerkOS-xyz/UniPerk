# UniPerk

DeFi agent with ENS permissions, Yellow Network execution, and Uniswap V4 hooks.

## Overview

UniPerk is an autonomous DeFi agent that:
- Reads user preferences from ENS text records
- Executes instant trades via Yellow Network state channels
- Settles on Uniswap V4 with custom hooks

## Architecture

```
User → ENS Permissions → Agent → Yellow (off-chain) → V4 Settlement (on-chain)
```

## Tech Stack

- **Frontend**: Next.js 14, wagmi, viem
- **Contracts**: Solidity, Foundry
- **ENS**: @ensdomains/ensjs, NameStone API
- **Yellow**: @erc7824/nitrolite SDK
- **Uniswap**: v4-core, v4-periphery

## Network

Base Mainnet (Chain ID: 8453)

## Bounties

- Uniswap V4 Agentic Finance
- ENS Most Creative DeFi
- Yellow Network Trading Apps

## License

MIT
