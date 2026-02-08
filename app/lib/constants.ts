/** ENS domain for UniPerk subdomains (e.g. alice.uniperk.eth) */
export const UNIPERK_ENS_DOMAIN = 'uniperk.eth'

/** Gateway API base URL (Cloudflare Worker) for registration and permissions */
export const GATEWAY_API_URL =
  process.env.NEXT_PUBLIC_GATEWAY_API_URL || 'https://uniperk-ens-gateway.elartur.workers.dev'

const MAINNET_RPC_DIRECT = process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://eth.llamarpc.com'

/**
 * Mainnet RPC: en el navegador usamos proxy same-origin para evitar CORS;
 * en servidor usamos la URL directa del RPC.
 */
export const MAINNET_RPC_URL =
  typeof window !== 'undefined'
    ? `${window.location.origin}/api/rpc/mainnet`
    : MAINNET_RPC_DIRECT
