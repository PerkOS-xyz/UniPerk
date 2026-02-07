'use client'

import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { WalletConnect } from '@/components/wallet-connect'
import { ENSConfigForm } from '@/components/ens-config-form'
import { Button } from '@/components/ui/button'

export default function ConfigurePage() {
  const { isConnected } = useAccount()
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
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                ← Back to Dashboard
              </Button>
            </Link>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Configure Permissions</h1>
        <p className="text-gray-600 mb-6">
          Set up ENS text records to control what AI agents can do on your behalf.
        </p>
        
        <ENSConfigForm 
          onSubmit={(data) => {
            console.log('Form submitted:', data)
            router.push('/dashboard')
          }}
        />

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900">How it works</h3>
          <p className="text-sm text-blue-800 mt-1">
            These settings are stored as ENS text records on your subdomain. 
            AI agents read these permissions before executing any trades.
          </p>
        </div>
      </main>
    </div>
  )
}
