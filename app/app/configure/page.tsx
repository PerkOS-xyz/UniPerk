'use client'

import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { WalletConnect } from '@/components/wallet-connect'
import { ThemeToggle } from '@/components/theme-toggle'
import { ENSConfigForm } from '@/components/ens-config-form'
import { Button } from '@/components/ui/button'
import { useUniperkSubdomain } from '@/hooks/useUniperkSubdomain'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'

export default function ConfigurePage() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const { subdomain, isLoading: subdomainLoading } = useUniperkSubdomain(address)

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  if (!isConnected) {
    return null
  }

  if (subdomainLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center p-4 max-w-6xl mx-auto">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🦄</span>
              <span className="font-bold text-xl">UniPerk</span>
            </Link>
            <WalletConnect />
          </div>
        </header>
        <main className="max-w-2xl mx-auto p-6">
          <div className="animate-pulse space-y-4 py-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </main>
      </div>
    )
  }

  if (!subdomain) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center p-4 max-w-6xl mx-auto">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🦄</span>
              <span className="font-bold text-xl">UniPerk</span>
            </Link>
            <WalletConnect />
          </div>
        </header>
        <main className="max-w-2xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Configure Permissions</CardTitle>
              <CardDescription>
                You need a subdomain to set agent permissions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Register your <strong>you.uniperk.eth</strong> subdomain first (no gas), then you can configure trading limits here.
              </p>
              <Link href="/register">
                <Button>Register subdomain</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="ml-2">Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
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
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                ← Back to Dashboard
              </Button>
            </Link>
            <ThemeToggle />
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Configure Permissions</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Set permissions for <strong>{subdomain}</strong>. Stored offchain and read by agents via ENS.
        </p>

        <ENSConfigForm
          subdomain={subdomain}
          onSubmit={() => {
            router.push('/dashboard')
          }}
        />

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h3 className="font-medium text-blue-900 dark:text-blue-200">How it works</h3>
          <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
            These settings are stored as ENS text records on your subdomain.
            AI agents read these permissions before executing any trades.
          </p>
        </div>
      </main>
    </div>
  )
}
