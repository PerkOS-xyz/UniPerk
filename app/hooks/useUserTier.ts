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

const hookContract = {
  address: ADDRESSES.UNIPERK_HOOK,
  abi: UNIPERK_HOOK_ABI,
  chainId: 8453,
} as const

export function useUserTier(address: `0x${string}` | undefined): UserTierData {
  const { data, isLoading, error } = useReadContracts({
    contracts: [
      {
        ...hookContract,
        functionName: 'userTier',
        args: address ? [address] : undefined,
      },
      {
        ...hookContract,
        functionName: 'tradeCount',
        args: address ? [address] : undefined,
      },
      {
        ...hookContract,
        functionName: 'tradeVolume',
        args: address ? [address] : undefined,
      },
      {
        ...hookContract,
        functionName: 'tierFeeDiscount',
        args: [0], // BRONZE
      },
      {
        ...hookContract,
        functionName: 'tierFeeDiscount',
        args: [1], // SILVER
      },
      {
        ...hookContract,
        functionName: 'tierFeeDiscount',
        args: [2], // GOLD
      },
      {
        ...hookContract,
        functionName: 'tierFeeDiscount',
        args: [3], // PLATINUM
      },
      {
        ...hookContract,
        functionName: 'SILVER_THRESHOLD',
      },
      {
        ...hookContract,
        functionName: 'GOLD_THRESHOLD',
      },
      {
        ...hookContract,
        functionName: 'PLATINUM_THRESHOLD',
      },
    ],
    query: {
      enabled: !!address,
    },
  })

  const tier = (data?.[0]?.result as TierLevel) ?? 0
  const tradeCount = (data?.[1]?.result as bigint) ?? 0n
  const tradeVolume = (data?.[2]?.result as bigint) ?? 0n

  // Fee discounts from contract (uint24 → number, basis points e.g. 100 = 1%)
  const discountBps: Record<string, number> = {
    BRONZE: (data?.[3]?.result as number) ?? 0,
    SILVER: (data?.[4]?.result as number) ?? 100,
    GOLD: (data?.[5]?.result as number) ?? 300,
    PLATINUM: (data?.[6]?.result as number) ?? 500,
  }

  // Thresholds from contract (uint256 → bigint)
  const silverThreshold = Number((data?.[7]?.result as bigint) ?? 10n)
  const goldThreshold = Number((data?.[8]?.result as bigint) ?? 50n)
  const platinumThreshold = Number((data?.[9]?.result as bigint) ?? 200n)

  const tierName = TIERS[tier]
  const tradeCountNum = Number(tradeCount)

  // Convert basis points to percentage for display (100 bps = 1%)
  const feeDiscount = discountBps[tierName] / 100

  // Calculate next tier using on-chain thresholds
  let nextTierThreshold: number | null = null
  let tradesUntilNextTier: number | null = null

  if (tierName === 'BRONZE') {
    nextTierThreshold = silverThreshold
    tradesUntilNextTier = silverThreshold - tradeCountNum
  } else if (tierName === 'SILVER') {
    nextTierThreshold = goldThreshold
    tradesUntilNextTier = goldThreshold - tradeCountNum
  } else if (tierName === 'GOLD') {
    nextTierThreshold = platinumThreshold
    tradesUntilNextTier = platinumThreshold - tradeCountNum
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

export { TIER_EMOJIS }
