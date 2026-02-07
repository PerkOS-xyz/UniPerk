'use client'

import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { WalletConnect } from '@/components/wallet-connect'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const { address, isConnected } = useAccount()
  const router = useRouter()

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  if (!isConnected) {
    return null
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
                Configure Permissions
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
              <div className="flex items-center gap-3">
                <span className="text-3xl">🥉</span>
                <div>
                  <p className="text-2xl font-bold">BRONZE</p>
                  <p className="text-sm text-gray-500">0% fee discount</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trade Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trade Stats</CardTitle>
              <CardDescription>Your trading history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Trades</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Volume</span>
                  <span className="font-semibold">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Next Tier</span>
                  <span className="font-semibold">10 trades</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agent Permissions</CardTitle>
              <CardDescription>Your ENS configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Max Trade</span>
                  <span className="font-medium">1,000 USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Slippage</span>
                  <span className="font-medium">0.5%</span>
                </div>
              </div>
              <Link href="/configure" className="block mt-4">
                <Button variant="outline" size="sm" className="w-full">
                  Edit Permissions
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Wallet Card */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">Connected Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <code className="bg-gray-100 px-3 py-2 rounded text-sm">
                  {address}
                </code>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View on BaseScan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
