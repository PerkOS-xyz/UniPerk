/** ENS domain for UniPerk subdomains (e.g. alice.uniperk.eth) */
export const UNIPERK_ENS_DOMAIN = 'uniperk.eth'

/** Gateway API base URL (Cloudflare Worker) for registration and permissions */
export const GATEWAY_API_URL =
  process.env.NEXT_PUBLIC_GATEWAY_API_URL || 'https://uniperk-ens-gateway.elartur.workers.dev'
