'use client'

import { useState, useEffect } from 'react'
import { useAccount, useEnsName, useEnsResolver, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { namehash, encodeFunctionData } from 'viem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'

// ENS PublicResolver ABI — only setText and multicall
const RESOLVER_ABI = [
  {
    name: 'setText',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
      { name: 'value', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'multicall',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'data', type: 'bytes[]' }],
    outputs: [{ name: 'results', type: 'bytes[]' }],
  },
] as const

interface ENSConfigFormProps {
  onSubmit?: (data: ENSFormData) => void
}

interface ENSFormData {
  allowed: boolean
  maxTrade: string
  tokens: string
  slippage: string
  expires: string
}

export function ENSConfigForm({ onSubmit }: ENSConfigFormProps) {
  const { address } = useAccount()
  const { data: ensName, isLoading: ensLoading } = useEnsName({
    address,
    chainId: 1,
  })
  const { data: resolverAddress } = useEnsResolver({
    name: ensName as string,
    chainId: 1,
    query: { enabled: !!ensName },
  })

  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: 1,
  })

  const [formData, setFormData] = useState<ENSFormData>({
    allowed: true,
    maxTrade: '1000',
    tokens: 'ETH,USDC,WETH',
    slippage: '50',
    expires: '',
  })

  useEffect(() => {
    if (isSuccess) {
      onSubmit?.(formData)
    }
  }, [isSuccess])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ensName || !resolverAddress) return

    reset()

    const node = namehash(ensName)

    // Build text records
    const records: [string, string][] = [
      ['agent.uniperk.allowed', formData.allowed ? 'true' : 'false'],
      ['agent.uniperk.maxTrade', formData.maxTrade],
      ['agent.uniperk.tokens', formData.tokens],
      ['agent.uniperk.slippage', formData.slippage],
    ]

    if (formData.expires) {
      const expiresTimestamp = Math.floor(new Date(formData.expires).getTime() / 1000).toString()
      records.push(['agent.uniperk.expires', expiresTimestamp])
    }

    // Encode each setText call, then batch via multicall
    const calls = records.map(([key, value]) =>
      encodeFunctionData({
        abi: RESOLVER_ABI,
        functionName: 'setText',
        args: [node, key, value],
      })
    )

    writeContract({
      address: resolverAddress,
      abi: RESOLVER_ABI,
      functionName: 'multicall',
      args: [calls],
      chainId: 1,
    })
  }

  const isSubmitting = isPending || isConfirming

  // Loading ENS name
  if (ensLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configure Agent Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3 py-4">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // No ENS name found
  if (!ensName && address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configure Agent Permissions</CardTitle>
          <CardDescription>
            Set permissions for AI agents to trade on your behalf
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 space-y-3">
            <p className="text-gray-600">
              You need an ENS name to configure agent permissions.
            </p>
            <p className="text-sm text-gray-500">
              ENS text records store your DeFi permissions on-chain.
            </p>
            <a
              href="https://app.ens.domains"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="mt-2">
                Get an ENS Name
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configure Agent Permissions</CardTitle>
        <CardDescription>
          {ensName ? (
            <>Setting text records on <strong>{ensName}</strong></>
          ) : (
            'Set permissions for AI agents to trade on your behalf'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Allowed Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Enable Agent Trading</label>
              <p className="text-sm text-gray-500">Allow agents to execute trades</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, allowed: !formData.allowed })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                formData.allowed ? 'bg-uniperk-pink' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  formData.allowed ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Max Trade */}
          <div className="space-y-2">
            <label className="font-medium">Maximum Trade Size (USDC)</label>
            <Input
              type="number"
              value={formData.maxTrade}
              onChange={(e) => setFormData({ ...formData, maxTrade: e.target.value })}
              placeholder="1000"
            />
            <p className="text-sm text-gray-500">Maximum amount per trade</p>
          </div>

          {/* Tokens */}
          <div className="space-y-2">
            <label className="font-medium">Allowed Tokens</label>
            <Input
              type="text"
              value={formData.tokens}
              onChange={(e) => setFormData({ ...formData, tokens: e.target.value })}
              placeholder="ETH,USDC,WETH"
            />
            <p className="text-sm text-gray-500">Comma-separated list of tokens</p>
          </div>

          {/* Slippage */}
          <div className="space-y-2">
            <label className="font-medium">Max Slippage (basis points)</label>
            <Input
              type="number"
              value={formData.slippage}
              onChange={(e) => setFormData({ ...formData, slippage: e.target.value })}
              placeholder="50"
            />
            <p className="text-sm text-gray-500">50 = 0.5%, 100 = 1%</p>
          </div>

          {/* Expires */}
          <div className="space-y-2">
            <label className="font-medium">Permission Expiry</label>
            <Input
              type="date"
              value={formData.expires}
              onChange={(e) => setFormData({ ...formData, expires: e.target.value })}
            />
            <p className="text-sm text-gray-500">Leave empty for no expiration</p>
          </div>

          {/* Status messages */}
          {writeError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              Transaction failed: {writeError.message.split('\n')[0]}
            </div>
          )}

          {isConfirming && (
            <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
              Waiting for confirmation...
            </div>
          )}

          {isSuccess && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              Permissions saved to ENS!
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !resolverAddress}
          >
            {isPending
              ? 'Confirm in Wallet...'
              : isConfirming
                ? 'Saving to ENS...'
                : 'Save Permissions'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
