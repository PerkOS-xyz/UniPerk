// Contract addresses (Base Mainnet)
export const ADDRESSES = {
  UNIPERK_HOOK: '0x825Fc7Ac1E5456674D7dBbB4D12467E8253740C0' as const,
  AGENT_REGISTRY: '0xd5A14b5dA79Abb78a5B307eC28E9d9711cdd5cEF' as const,
  POOL_MANAGER: '0x498581fF718922c3f8e6A244956aF099B2652b2b' as const,
  USDC: '0x833589fCD6eDb6E08f4c7c32D4f71b54bdA02913' as const,
  WETH: '0x4200000000000000000000000000000000000006' as const,
}

// UniPerkHook ABI (relevant functions)
export const UNIPERK_HOOK_ABI = [
  {
    name: 'userTier',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'tradeCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'tradeVolume',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'tierFeeDiscount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tier', type: 'uint8' }],
    outputs: [{ name: '', type: 'uint24' }],
  },
  {
    name: 'SILVER_THRESHOLD',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'GOLD_THRESHOLD',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'PLATINUM_THRESHOLD',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

// AgentRegistry ABI (relevant functions)
export const AGENT_REGISTRY_ABI = [
  {
    name: 'isAuthorized',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'maxTradeLimit',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'agentENSName',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'getAgentInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [
      { name: 'authorized', type: 'bool' },
      { name: 'limit', type: 'uint256' },
      { name: 'ownerAddr', type: 'address' },
      { name: 'ensName', type: 'string' },
    ],
  },
  {
    name: 'registerAgent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agent', type: 'address' },
      { name: 'limit', type: 'uint256' },
      { name: 'ensName', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'revokeAgent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [],
  },
  {
    name: 'updateTradeLimit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agent', type: 'address' },
      { name: 'newLimit', type: 'uint256' },
    ],
    outputs: [],
  },
] as const

// Tier enum mapping
export const TIERS = {
  0: 'BRONZE',
  1: 'SILVER',
  2: 'GOLD',
  3: 'PLATINUM',
} as const

export type TierLevel = keyof typeof TIERS
export type TierName = typeof TIERS[TierLevel]
