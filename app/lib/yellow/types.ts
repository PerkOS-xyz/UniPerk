import type { Address } from 'viem';

export interface YellowConfig {
  wsUrl: string;
  chainId: number;
  custodyAddress: Address;
}

export interface TradingSession {
  id: string;
  userAddress: Address;
  agentAddress: Address;
  allocations: Allocation[];
  status: 'pending' | 'active' | 'closing' | 'closed';
  createdAt: number;
}

export interface Allocation {
  participant: Address;
  asset: 'usdc' | 'weth';
  amount: bigint;
}

export interface TradeRequest {
  sessionId: string;
  fromToken: 'usdc' | 'weth';
  toToken: 'usdc' | 'weth';
  amount: bigint;
  userAddress: Address;
  agentAddress?: Address;
  ensName?: string;
}

export interface TradeResult {
  success: boolean;
  txId: string;
  executedAmount: bigint;
  receivedAmount: bigint;
  gasUsed: bigint;
  timestamp: number;
}

export interface ENSPermissions {
  allowed: boolean;
  maxTrade: bigint;
  tokens: string[];
  slippage: number;
  expires: number | null;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  permissions?: ENSPermissions;
}

export type MessageSigner = (message: string) => Promise<string>;
