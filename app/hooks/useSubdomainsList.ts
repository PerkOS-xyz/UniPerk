import { useQuery } from '@tanstack/react-query'
import { GATEWAY_API_URL } from '@/lib/constants'

export interface ListedSubdomain {
  name: string
  owner: string
}

async function fetchSubdomains(limit = 100): Promise<ListedSubdomain[]> {
  if (!GATEWAY_API_URL) return []
  const url = `${GATEWAY_API_URL.replace(/\/$/, '')}/subdomains?limit=${limit}`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()
  return data.names ?? []
}

export function useSubdomainsList(limit = 100) {
  return useQuery({
    queryKey: ['subdomains-list', limit],
    queryFn: () => fetchSubdomains(limit),
    staleTime: 60 * 1000,
  })
}
