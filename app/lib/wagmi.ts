import { http, createConfig } from 'wagmi'
import { base, mainnet } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { MAINNET_RPC_URL } from './constants'

// UniPerk uses:
// - Mainnet for ENS text records (RPC con CORS para navegador)
// - Base for smart contracts (UniPerkHook, AgentRegistry)

export const config = getDefaultConfig({
  appName: 'UniPerk',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID || 'demo',
  chains: [base, mainnet],
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(MAINNET_RPC_URL),
  },
  ssr: true,
})

// Contract addresses (Base Mainnet)
export const CONTRACTS = {
  UNIPERK_HOOK: '0x825Fc7Ac1E5456674D7dBbB4D12467E8253740C0',
  AGENT_REGISTRY: '0xd5A14b5dA79Abb78a5B307eC28E9d9711cdd5cEF',
  POOL_MANAGER: '0x498581fF718922c3f8e6A244956aF099B2652b2b',
  USDC: '0x833589fCD6eDb6E08f4c7c32D4f71b54bdA02913',
  WETH: '0x4200000000000000000000000000000000000006',
} as const

// Chain IDs
export const CHAIN_IDS = {
  BASE: 8453,
  MAINNET: 1,
} as const
