# Contracts

Solidity smart contracts for UniPerk, built with Foundry on Uniswap V4.

## Contracts

- **UniPerkHook.sol** — Uniswap V4 hook that validates agent trades (`beforeSwap`) and tracks user reputation (`afterSwap`). Applies tier-based fee discounts.
- **AgentRegistry.sol** — Whitelist of authorized AI agents with per-agent trade limits and ENS name mapping.
- **IAgentRegistry.sol** — Interface for AgentRegistry used by the hook.

## Tier System

| Tier     | Trades | Fee Discount |
|----------|--------|--------------|
| Bronze   | 0-9    | 0%           |
| Silver   | 10-49  | 1%           |
| Gold     | 50-199 | 3%           |
| Platinum | 200+   | 5%           |

## Deployed (Base Mainnet)

| Contract      | Address                                    |
|---------------|--------------------------------------------|
| AgentRegistry | `0xd5A14b5dA79Abb78a5B307eC28E9d9711cdd5cEF` |
| UniPerkHook   | `0x825Fc7Ac1E5456674D7dBbB4D12467E8253740C0` |

## Build

```bash
forge install
forge build
```

## Deploy Scripts

```bash
# Deploy hook (uses HookMiner for address mining)
forge script script/00_DeployUniPerkHook.s.sol --rpc-url base --broadcast

# Create pool and add initial liquidity
forge script script/01_CreatePoolAndAddLiquidity.s.sol --rpc-url base --broadcast

# Add more liquidity
forge script script/02_AddLiquidity.s.sol --rpc-url base --broadcast

# Test swap
forge script script/03_Swap.s.sol --rpc-url base --broadcast
```

Requires `PRIVATE_KEY` and `BASESCAN_API_KEY` in `.env`.

## Dependencies

- [Uniswap V4 Core](https://github.com/uniswap/v4-core) — Pool manager and swap types
- [Uniswap V4 Periphery](https://github.com/uniswap/v4-periphery) — Position manager and router
- [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts) — Ownable, standard patterns
- [@openzeppelin/uniswap-hooks](https://github.com/OpenZeppelin/uniswap-hooks) — BaseHook abstraction
