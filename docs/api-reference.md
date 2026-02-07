# API Reference

Smart contract functions and events for UniPerk.

## AgentRegistry

Address: `0xd5A14b5dA79Abb78a5B307eC28E9d9711cdd5cEF`

### Functions

#### registerAgent
Register a new trading agent.

```solidity
function registerAgent(
  address agent,
  uint256 limit,
  string calldata ensName
) external
```

| Param | Type | Description |
|-------|------|-------------|
| agent | address | Agent wallet address |
| limit | uint256 | Max trade size (wei) |
| ensName | string | ENS subdomain |

#### revokeAgent
Revoke agent authorization.

```solidity
function revokeAgent(address agent) external
```

#### updateTradeLimit
Update agent's trade limit.

```solidity
function updateTradeLimit(address agent, uint256 newLimit) external
```

#### validateTrade
Check if trade is valid.

```solidity
function validateTrade(
  address agent,
  uint256 tradeSize
) external view returns (bool valid, string memory reason)
```

### Events

```solidity
event AgentRegistered(address indexed agent, address indexed owner, uint256 maxLimit, string ensName)
event AgentRevoked(address indexed agent, address indexed revokedBy)
event TradeLimitUpdated(address indexed agent, uint256 oldLimit, uint256 newLimit)
```

---

## UniPerkHook

Address: `0x825Fc7Ac1E5456674D7dBbB4D12467E8253740C0`

### View Functions

#### userTier
Get user's current tier.

```solidity
function userTier(address user) external view returns (uint8)
```

Returns: 0=Bronze, 1=Silver, 2=Gold, 3=Platinum

#### tradeCount
Get user's total trade count.

```solidity
function tradeCount(address user) external view returns (uint256)
```

#### tradeVolume
Get user's total trade volume.

```solidity
function tradeVolume(address user) external view returns (uint256)
```

#### tierFeeDiscount
Get fee discount for a tier.

```solidity
function tierFeeDiscount(uint8 tier) external view returns (uint24)
```

Returns: Discount in basis points (100 = 1%)

### Constants

```solidity
SILVER_THRESHOLD = 10    // trades for Silver
GOLD_THRESHOLD = 50      // trades for Gold
PLATINUM_THRESHOLD = 200 // trades for Platinum
```

### Events

```solidity
event AgentTradeValidated(address indexed agent, address indexed user, uint256 tradeSize, bool approved)
event TierUpdated(address indexed user, Tier oldTier, Tier newTier)
event TradeRecorded(address indexed user, uint256 amount, uint256 newTradeCount, uint256 newVolume)
```

---

## Hook Data Format

When swapping through UniPerkHook, encode agent info in hookData:

```solidity
bytes memory hookData = abi.encode(agentAddress, userAddress);
```

If no agent, pass empty bytes:

```solidity
bytes memory hookData = new bytes(0);
```
