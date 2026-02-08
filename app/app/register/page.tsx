'use client'

import { useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { WalletConnect } from '@/components/wallet-connect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { UNIPERK_ENS_DOMAIN, GATEWAY_API_URL } from '@/lib/constants'
import { useUniperkSubdomain } from '@/hooks/useUniperkSubdomain'

const LABEL_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/

export default function RegisterPage() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const { subdomain, isLoading: subdomainLoading, refetch } = useUniperkSubdomain(address)
  const { signMessageAsync, isPending: isSigning } = useSignMessage()
  const [label, setLabel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!isConnected) router.push('/')
  }, [isConnected, router])

  useEffect(() => {
    if (subdomain && !success) router.push('/dashboard')
  }, [subdomain, success, router])

  if (!isConnected) return null

  const normalizedLabel = label.trim().toLowerCase()
  const message = normalizedLabel ? `Claim ${normalizedLabel}.${UNIPERK_ENS_DOMAIN}` : ''
  const isValidLabel = normalizedLabel.length >= 1 && normalizedLabel.length <= 63 && LABEL_REGEX.test(normalizedLabel)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!address || !GATEWAY_API_URL || !isValidLabel) {
      setError('Invalid label. Use only lowercase letters, numbers, and hyphens (1–63 characters).')
      return
    }
    try {
      const signature = await signMessageAsync({ message })
      const res = await fetch(`${GATEWAY_API_URL.replace(/\/$/, '')}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: normalizedLabel,
          address,
          signature,
          message,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error?.message || data.error?.error || 'Registration failed')
        return
      }
      setSuccess(true)
      refetch()
      router.push('/configure')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  if (subdomainLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="flex justify-between items-center p-4 max-w-6xl mx-auto">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🦄</span>
              <span className="font-bold text-xl">UniPerk</span>
            </Link>
            <WalletConnect />
          </div>
        </header>
        <main className="max-w-md mx-auto p-6">
          <div className="animate-pulse space-y-4 py-8">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="flex justify-between items-center p-4 max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🦄</span>
            <span className="font-bold text-xl">UniPerk</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                ← Dashboard
              </Button>
            </Link>
            <WalletConnect />
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Register your subdomain</h1>
        <p className="text-gray-600 mb-6">
          Choose a name to get <strong>you.uniperk.eth</strong>. No gas cost.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Claim subdomain</CardTitle>
            <CardDescription>
              Your address will own this subdomain. You can then set agent permissions from Configure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <Input
                  placeholder="yourname"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0"
                  maxLength={63}
                />
                <span className="text-gray-500 whitespace-nowrap">.{UNIPERK_ENS_DOMAIN}</span>
              </div>
              <p className="text-xs text-gray-500">
                Lowercase letters, numbers, and hyphens only. 1–63 characters.
              </p>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!isValidLabel || isSigning}
              >
                {isSigning ? 'Sign in wallet...' : 'Register'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
