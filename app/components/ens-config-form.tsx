'use client'

import { useState, useEffect } from 'react'
import { useAccount, useEnsName, useEnsResolver, useWriteContract, useWaitForTransactionReceipt, useSignMessage } from 'wagmi'
import { namehash, encodeFunctionData } from 'viem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { GATEWAY_API_URL } from '@/lib/constants'

// ENS PublicResolver ABI — only setText and multicall (used when no subdomain / legacy)
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
  /** When set, permissions are saved via gateway API (offchain). When null, uses ENS main name + onchain setText (legacy). */
  subdomain?: string | null
  onSubmit?: (data: ENSFormData) => void
}

interface ENSFormData {
  allowed: boolean
  maxTrade: string
  tokens: string
  slippage: string
  expires: string
}

export function ENSConfigForm({ subdomain, onSubmit }: ENSConfigFormProps) {
  const { address } = useAccount()
  const useGateway = !!subdomain && !!GATEWAY_API_URL

  const { data: ensName, isLoading: ensLoading } = useEnsName({
    address,
    chainId: 1,
  })
  const { data: resolverAddress } = useEnsResolver({
    name: ensName as string,
    chainId: 1,
    query: { enabled: !!ensName && !useGateway },
  })

  const { signMessageAsync, isPending: isSigning } = useSignMessage()
  const { writeContract, data: txHash, isPending: isWritePending, error: writeError, reset } = useWriteContract()
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
  const [validationError, setValidationError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [apiSuccess, setApiSuccess] = useState(false)

  useEffect(() => {
    if (!useGateway && isSuccess) {
      onSubmit?.(formData)
    }
  }, [isSuccess, useGateway])

  const validate = (): string | null => {
    const maxTrade = Number(formData.maxTrade)
    if (!maxTrade || maxTrade <= 0) return 'Max trade size must be greater than 0'
    if (maxTrade > 1_000_000) return 'Max trade size cannot exceed 1,000,000 USDC'

    const slippage = Number(formData.slippage)
    if (isNaN(slippage) || slippage < 1) return 'Slippage must be at least 1 basis point'
    if (slippage > 1000) return 'Slippage cannot exceed 1000 basis points (10%)'

    const tokens = formData.tokens.split(',').map(t => t.trim()).filter(Boolean)
    if (tokens.length === 0) return 'At least one token must be specified'

    if (formData.expires) {
      const expiresDate = new Date(formData.expires)
      if (expiresDate <= new Date()) return 'Expiry date must be in the future'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    setApiError(null)
    setApiSuccess(false)
    reset()

    const error = validate()
    if (error) {
      setValidationError(error)
      return
    }

    if (useGateway && subdomain && address) {
      try {
        const message = `Update permissions for ${subdomain}`
        const signature = await signMessageAsync({ message })
        const permissions: Record<string, unknown> = {
          allowed: formData.allowed,
          maxTrade: formData.maxTrade,
          tokens: formData.tokens,
          slippage: formData.slippage,
        }
        if (formData.expires) {
          permissions.expires = Math.floor(new Date(formData.expires).getTime() / 1000).toString()
        }
        const res = await fetch(`${GATEWAY_API_URL.replace(/\/$/, '')}/permissions`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: subdomain,
            address,
            signature,
            message,
            permissions,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setApiError(data.error?.message || data.error?.error || 'Failed to update permissions')
          return
        }
        setApiSuccess(true)
        onSubmit?.(formData)
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'Failed to update permissions')
      }
      return
    }

    // Legacy: onchain setText
    if (!ensName || !resolverAddress) return
    const node = namehash(ensName)
    const records: [string, string][] = [
      ['agent.uniperk.allowed', formData.allowed ? 'true' : 'false'],
      ['agent.uniperk.maxTrade', formData.maxTrade],
      ['agent.uniperk.tokens', formData.tokens],
      ['agent.uniperk.slippage', formData.slippage],
    ]
    if (formData.expires) {
      records.push(['agent.uniperk.expires', Math.floor(new Date(formData.expires).getTime() / 1000).toString()])
    }
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

  const isSubmitting = useGateway ? isSigning : isWritePending || isConfirming
  const displayName = subdomain ?? ensName ?? null

  if (!useGateway && ensLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configure Agent Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3 py-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!useGateway && !ensName && address) {
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
            <p className="text-gray-600 dark:text-gray-400">
              You need an ENS name to configure agent permissions.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
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
          {displayName ? (
            <>Settings for <strong>{displayName}</strong></>
          ) : (
            'Set permissions for AI agents to trade on your behalf'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Enable Agent Trading</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Allow agents to execute trades</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, allowed: !formData.allowed })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                formData.allowed ? 'bg-uniperk-pink' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  formData.allowed ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="space-y-2">
            <label className="font-medium">Maximum Trade Size (USDC)</label>
            <Input
              type="number"
              value={formData.maxTrade}
              onChange={(e) => setFormData({ ...formData, maxTrade: e.target.value })}
              placeholder="1000"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">Maximum amount per trade</p>
          </div>

          <div className="space-y-2">
            <label className="font-medium">Allowed Tokens</label>
            <Input
              type="text"
              value={formData.tokens}
              onChange={(e) => setFormData({ ...formData, tokens: e.target.value })}
              placeholder="ETH,USDC,WETH"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">Comma-separated list of tokens</p>
          </div>

          <div className="space-y-2">
            <label className="font-medium">Max Slippage (basis points)</label>
            <Input
              type="number"
              value={formData.slippage}
              onChange={(e) => setFormData({ ...formData, slippage: e.target.value })}
              placeholder="50"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">50 = 0.5%, 100 = 1%</p>
          </div>

          <div className="space-y-2">
            <label className="font-medium">Permission Expiry</label>
            <Input
              type="date"
              value={formData.expires}
              onChange={(e) => setFormData({ ...formData, expires: e.target.value })}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">Leave empty for no expiration</p>
          </div>

          {validationError && (
            <div className="p-3 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {validationError}
            </div>
          )}

          {writeError && (
            <div className="p-3 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-lg text-sm">
              Transaction failed: {writeError.message.split('\n')[0]}
            </div>
          )}

          {apiError && (
            <div className="p-3 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {apiError}
            </div>
          )}

          {!useGateway && isConfirming && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 rounded-lg text-sm">
              Waiting for confirmation...
            </div>
          )}

          {(apiSuccess || (!useGateway && isSuccess)) && (
            <div className="p-3 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-lg text-sm">
              Permissions saved!
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || (!useGateway && !resolverAddress)}
          >
            {isSubmitting
              ? useGateway
                ? 'Sign in wallet...'
                : isWritePending
                  ? 'Confirm in Wallet...'
                  : 'Saving...'
              : 'Save Permissions'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
