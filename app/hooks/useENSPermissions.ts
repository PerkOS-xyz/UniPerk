import { useQuery } from '@tanstack/react-query'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { MAINNET_RPC_URL } from '@/lib/constants'

interface ENSPermissions {
  allowed: boolean
  maxTrade: number
  tokens: string[]
  slippage: number
  expires: number | null
  ensName: string | null
  isLoading: boolean
  error: Error | null
}

const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(MAINNET_RPC_URL),
})

async function fetchENSPermissions(ensName: string): Promise<Omit<ENSPermissions, 'isLoading' | 'error' | 'ensName'>> {
  const keys = [
    'agent.uniperk.allowed',
    'agent.uniperk.maxTrade',
    'agent.uniperk.tokens',
    'agent.uniperk.slippage',
    'agent.uniperk.expires',
  ]

  const results = await Promise.all(
    keys.map(async (key) => {
      try {
        const value = await mainnetClient.getEnsText({ name: ensName, key })
        return value
      } catch {
        return null
      }
    })
  )

  const [allowed, maxTrade, tokens, slippage, expires] = results

  return {
    allowed: allowed === 'true',
    maxTrade: maxTrade ? parseInt(maxTrade) : 1000,
    tokens: tokens ? tokens.split(',').map(t => t.trim()) : ['ETH', 'USDC', 'WETH'],
    slippage: slippage ? parseInt(slippage) : 50,
    expires: expires ? parseInt(expires) : null,
  }
}

export function useENSPermissions(ensName: string | null): ENSPermissions {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ens-permissions', ensName],
    queryFn: () => fetchENSPermissions(ensName!),
    enabled: !!ensName,
    staleTime: 60 * 1000,
  })

  if (!ensName) {
    return {
      allowed: false,
      maxTrade: 1000,
      tokens: ['ETH', 'USDC', 'WETH'],
      slippage: 50,
      expires: null,
      ensName: null,
      isLoading: false,
      error: null,
    }
  }

  return {
    allowed: data?.allowed ?? false,
    maxTrade: data?.maxTrade ?? 1000,
    tokens: data?.tokens ?? ['ETH', 'USDC', 'WETH'],
    slippage: data?.slippage ?? 50,
    expires: data?.expires ?? null,
    ensName,
    isLoading,
    error: error as Error | null,
  }
}
