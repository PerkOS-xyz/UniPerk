import { useQuery } from '@tanstack/react-query'
import { GATEWAY_API_URL } from '@/lib/constants'

async function fetchSubdomainByAddress(address: string): Promise<string | null> {
  if (!GATEWAY_API_URL) return null
  const url = `${GATEWAY_API_URL.replace(/\/$/, '')}/subdomain?address=${encodeURIComponent(address)}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  return data.subdomain ?? null
}

export function useUniperkSubdomain(address: string | undefined): {
  subdomain: string | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
} {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['uniperk-subdomain', address],
    queryFn: () => fetchSubdomainByAddress(address!),
    enabled: !!address && !!GATEWAY_API_URL,
    staleTime: 60 * 1000,
  })

  return {
    subdomain: data ?? null,
    isLoading,
    error: error as Error | null,
    refetch,
  }
}
