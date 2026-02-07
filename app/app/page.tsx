'use client'

import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { WalletConnect } from '@/components/wallet-connect'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function Home() {
  const { isConnected } = useAccount()
  const router = useRouter()

  useEffect(() => {
    if (isConnected) {
      router.push('/dashboard')
    }
  }, [isConnected, router])

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🦄</span>
          <span className="font-bold text-xl">UniPerk</span>
        </div>
        <WalletConnect />
      </header>

      {/* Hero */}
      <section className="text-center py-20 px-6 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Trust Layer for{' '}
          <span className="text-uniperk-pink">DeFi</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Portable identity, instant execution, smart settlement. 
          Give AI agents permission to trade on your behalf — safely.
        </p>
        <div className="flex justify-center">
          <WalletConnect />
        </div>
      </section>

      {/* Protocol Cards */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-center mb-12">
          Powered by Three Protocols
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* ENS Card */}
          <Card className="border-uniperk-blue/20 hover:border-uniperk-blue/50 transition-colors">
            <CardHeader>
              <div className="text-4xl mb-4">🌐</div>
              <CardTitle className="text-uniperk-blue">ENS</CardTitle>
              <CardDescription className="text-base">
                <strong>Agent Permission System</strong>
                <br />
                Configure once, trade everywhere. Your ENS becomes your DeFi permission layer.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Yellow Card */}
          <Card className="border-uniperk-yellow/20 hover:border-uniperk-yellow/50 transition-colors">
            <CardHeader>
              <div className="text-4xl mb-4">🟡</div>
              <CardTitle className="text-uniperk-yellow">Yellow Network</CardTitle>
              <CardDescription className="text-base">
                <strong>Instant Execution</strong>
                <br />
                100 trades, 1 settlement. State channels for gasless, instant trading.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Uniswap Card */}
          <Card className="border-uniperk-pink/20 hover:border-uniperk-pink/50 transition-colors">
            <CardHeader>
              <div className="text-4xl mb-4">🦄</div>
              <CardTitle className="text-uniperk-pink">Uniswap V4</CardTitle>
              <CardDescription className="text-base">
                <strong>Identity-Aware Pools</strong>
                <br />
                Better reputation = better rates. Pools that trust you back.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-12 text-gray-500 text-sm">
        <p>@UniPerk 2026</p>
      </footer>
    </main>
  )
}
