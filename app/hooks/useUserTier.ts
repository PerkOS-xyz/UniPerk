import { useReadContracts } from 'wagmi'
import { ADDRESSES, UNIPERK_HOOK_ABI, TIERS, type TierLevel } from '@/lib/contracts'

interface UserTierData {
  tier: TierLevel
  tierName: string
  tradeCount: bigint
  tradeVolume: bigint
  feeDiscount: number
  nextTierThreshold: number | null
  tradesUntilNextTier: number | null
  isLoading: boolean
  error: Error | null
}

const TIER_EMOJIS = {
  BRONZE: '🥉',
  SILVER: '🥈',
  GOLD: '🥇',
  PLATINUM: '💎',
} as const

const TIER_THRESHOLDS = {
  SILVER: 10,
  GOLD: 50,
  PLATINUM: 200,
} as const

export function useUserTier(address: `0x${string}` | undefined): UserTierData {
  const { data, isLoading, error } = useReadContracts({
    contracts: [
      {
        address: ADDRESSES.UNIPERK_HOOK,
        abi: UNIPERK_HOOK_ABI,
        functionName: 'userTier',
        args: address ? [address] : undefined,
        chainId: 8453,
      },
      {
        address: ADDRESSES.UNIPERK_HOOK,
        abi: UNIPERK_HOOK_ABI,
        functionName: 'tradeCount',
        args: address ? [address] : undefined,
        chainId: 8453,
      },
      {
        address: ADDRESSES.UNIPERK_HOOK,
        abi: UNIPERK_HOOK_ABI,
        functionName: 'tradeVolume',
        args: address ? [address] : undefined,
        chainId: 8453,
      },
    ],
    query: {
      enabled: !!address,
    },
  })

  const tier = (data?.[0]?.result as TierLevel) ?? 0
  const tradeCount = (data?.[1]?.result as bigint) ?? 0n
  const tradeVolume = (data?.[2]?.result as bigint) ?? 0n

  const tierName = TIERS[tier]
  const tradeCountNum = Number(tradeCount)

  // Calculate fee discount (basis points)
  const feeDiscounts: Record<string, number> = {
    BRONZE: 0,
    SILVER: 1,
    GOLD: 3,
    PLATINUM: 5,
  }
  const feeDiscount = feeDiscounts[tierName] ?? 0

  // Calculate next tier
  let nextTierThreshold: number | null = null
  let tradesUntilNextTier: number | null = null

  if (tierName === 'BRONZE') {
    nextTierThreshold = TIER_THRESHOLDS.SILVER
    tradesUntilNextTier = TIER_THRESHOLDS.SILVER - tradeCountNum
  } else if (tierName === 'SILVER') {
    nextTierThreshold = TIER_THRESHOLDS.GOLD
    tradesUntilNextTier = TIER_THRESHOLDS.GOLD - tradeCountNum
  } else if (tierName === 'GOLD') {
    nextTierThreshold = TIER_THRESHOLDS.PLATINUM
    tradesUntilNextTier = TIER_THRESHOLDS.PLATINUM - tradeCountNum
  }

  return {
    tier,
    tierName,
    tradeCount,
    tradeVolume,
    feeDiscount,
    nextTierThreshold,
    tradesUntilNextTier,
    isLoading,
    error: error as Error | null,
  }
}

export { TIER_EMOJIS, TIER_THRESHOLDS }
