'use client'

import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { WalletConnect } from '@/components/wallet-connect'
import { ThemeToggle } from '@/components/theme-toggle'
import { TierBadge } from '@/components/tier-badge'
import { PermissionCard } from '@/components/permission-card'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUserTier } from '@/hooks/useUserTier'
import { useUniperkSubdomain } from '@/hooks/useUniperkSubdomain'
import { useSubdomainsList } from '@/hooks/useSubdomainsList'

export default function Dashboard() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const { tradeCount, tradeVolume, tradesUntilNextTier, isLoading } = useUserTier(address)
  const { subdomain, isLoading: subdomainLoading } = useUniperkSubdomain(address)
  const { data: subdomainsList = [], isLoading: subdomainsLoading } = useSubdomainsList(50)

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
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
            <ThemeToggle />
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
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Total Trades</span>
                    <span className="font-semibold">{tradeCount.toString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Volume</span>
                    <span className="font-semibold">{formatVolume(tradeVolume)}</span>
                  </div>
                  {tradesUntilNextTier !== null && tradesUntilNextTier > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Next Tier</span>
                      <span className="font-semibold">{tradesUntilNextTier} trades</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permissions Card — uses subdomain (e.g. alice.uniperk.eth) or CTA to register */}
          {subdomainLoading ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Agent Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ) : subdomain ? (
            <PermissionCard ensName={subdomain} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Agent Permissions</CardTitle>
                <CardDescription>
                  Register a subdomain to set permissions for AI agents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get your <strong>you.uniperk.eth</strong> subdomain (no gas), then configure trading limits and allowed tokens.
                </p>
                <Link href="/register">
                  <Button className="w-full">Register subdomain</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Wallet Card */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">Connected Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <code className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded text-sm break-all">
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

          {/* Registered subdomains list */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">Registered subdomains</CardTitle>
              <CardDescription>
                Subdominios uniperk.eth registrados. Verificables en ENS si uniperk.eth tiene el resolver CCIP configurado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subdomainsLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                </div>
              ) : subdomainsList.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Ningún subdominio registrado aún.</p>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {subdomainsList.map(({ name, owner }) => (
                    <li
                      key={name}
                      className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{name}</span>
                        <a
                          href={`https://app.ens.domains/${encodeURIComponent(name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                          title="Ver en ENS"
                        >
                          Verificar en ENS
                        </a>
                      </div>
                      <a
                        href={`https://basescan.org/address/${owner}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 truncate max-w-[140px]"
                        title={owner}
                      >
                        {owner.slice(0, 6)}…{owner.slice(-4)}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
