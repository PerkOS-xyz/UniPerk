'use client'

import { Badge } from '@/components/ui/badge'
import { useUserTier, TIER_EMOJIS } from '@/hooks/useUserTier'

interface TierBadgeProps {
  address: `0x${string}` | undefined
  showDetails?: boolean
}

export function TierBadge({ address, showDetails = false }: TierBadgeProps) {
  const { tierName, feeDiscount, tradeCount, tradesUntilNextTier, isLoading } = useUserTier(address)

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-24 bg-gray-200 rounded" />
      </div>
    )
  }

  const emoji = TIER_EMOJIS[tierName as keyof typeof TIER_EMOJIS]
  const variant = tierName.toLowerCase() as 'bronze' | 'silver' | 'gold' | 'platinum'

  if (!showDetails) {
    return (
      <Badge variant={variant} className="text-base px-3 py-1">
        {emoji} {tierName}
      </Badge>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{emoji}</span>
        <div>
          <Badge variant={variant} className="text-lg px-4 py-1">
            {tierName}
          </Badge>
          <p className="text-sm text-gray-500 mt-1">
            {feeDiscount}% fee discount
          </p>
        </div>
      </div>
      
      {tradesUntilNextTier !== null && tradesUntilNextTier > 0 && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">{tradesUntilNextTier}</span> trades until next tier
        </div>
      )}
      
      {tierName === 'PLATINUM' && (
        <div className="text-sm text-gray-600">
          🎉 Maximum tier reached!
        </div>
      )}
      
      <div className="text-xs text-gray-400">
        Total trades: {tradeCount.toString()}
      </div>
    </div>
  )
}
