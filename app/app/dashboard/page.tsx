'use client'

import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { WalletConnect } from '@/components/wallet-connect'
import { TierBadge } from '@/components/tier-badge'
import { PermissionCard } from '@/components/permission-card'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUserTier } from '@/hooks/useUserTier'

export default function Dashboard() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const { tradeCount, tradeVolume, tradesUntilNextTier, isLoading } = useUserTier(address)

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  if (!isConnected) {
    return null
  }

  const formatVolume = (volume: bigint) => {
    const num = Number(volume) / 1e6
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="flex justify-between items-center p-4 max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🦄</span>
            <span className="font-bold text-xl">UniPerk</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/configure">
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </Link>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tier Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Tier</CardTitle>
              <CardDescription>Based on trading activity</CardDescription>
            </CardHeader>
            <CardContent>
              <TierBadge address={address} showDetails />
            </CardContent>
          </Card>

          {/* Trade Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trade Stats</CardTitle>
              <CardDescription>Your activity on UniPerk</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Trades</span>
                    <span className="font-semibold">{tradeCount.toString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Volume</span>
                    <span className="font-semibold">{formatVolume(tradeVolume)}</span>
                  </div>
                  {tradesUntilNextTier !== null && tradesUntilNextTier > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Next Tier</span>
                      <span className="font-semibold">{tradesUntilNextTier} trades</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permissions Card */}
          <PermissionCard ensName={null} />

          {/* Wallet Card */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">Connected Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <code className="bg-gray-100 px-3 py-2 rounded text-sm break-all">
                  {address}
                </code>
                <a 
                  href={`https://basescan.org/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    View on BaseScan ↗
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
