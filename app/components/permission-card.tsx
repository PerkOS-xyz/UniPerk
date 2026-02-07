'use client'

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useENSPermissions } from '@/hooks/useENSPermissions'

interface PermissionCardProps {
  ensName: string | null
}

export function PermissionCard({ ensName }: PermissionCardProps) {
  const { allowed, maxTrade, tokens, slippage, expires, isLoading } = useENSPermissions(ensName)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agent Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const isExpired = expires ? expires < Date.now() / 1000 : false
  const expiresDate = expires ? new Date(expires * 1000).toLocaleDateString() : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Agent Permissions</CardTitle>
        <CardDescription>
          {ensName ? `From ${ensName}` : 'No ENS configured'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Status</span>
          <Badge variant={allowed && !isExpired ? 'default' : 'secondary'}>
            {allowed && !isExpired ? '✓ Active' : '✗ Inactive'}
          </Badge>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-500">Max Trade</span>
          <span className="font-medium">{maxTrade.toLocaleString()} USDC</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-500">Slippage</span>
          <span className="font-medium">{(slippage / 100).toFixed(2)}%</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-500">Tokens</span>
          <div className="flex gap-1">
            {tokens.map((token) => (
              <Badge key={token} variant="outline" className="text-xs">
                {token}
              </Badge>
            ))}
          </div>
        </div>

        {expiresDate && (
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Expires</span>
            <span className={isExpired ? 'text-red-500' : 'font-medium'}>
              {isExpired ? 'Expired' : expiresDate}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
