import { encodeAbiParameters, parseAbiParameters } from 'viem';
import { base } from 'viem/chains';
import type { Address, WalletClient } from 'viem';
import { ADDRESSES } from '../contracts';

const V4_SWAP_ROUTER_ABI = [
  {
    name: 'swap',
    type: 'function',
    inputs: [
      {
        name: 'key',
        type: 'tuple',
        components: [
          { name: 'currency0', type: 'address' },
          { name: 'currency1', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'tickSpacing', type: 'int24' },
          { name: 'hooks', type: 'address' }
        ]
      },
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'zeroForOne', type: 'bool' },
          { name: 'amountSpecified', type: 'int256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' }
        ]
      },
      { name: 'hookData', type: 'bytes' }
    ],
    outputs: [{ name: 'delta', type: 'int256' }]
  }
] as const;

const WETH_USDC_POOL_KEY = {
  currency0: '0x4200000000000000000000000000000000000006' as Address,
  currency1: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
  fee: 3000,
  tickSpacing: 60,
  hooks: ADDRESSES.UNIPERK_HOOK
};

export interface SettlementResult {
  success: boolean;
  txHash: string;
  settledAmount: bigint;
  receivedAmount: bigint;
  tierDiscount: number;
}

export async function settleToUniswapV4(
  walletClient: WalletClient,
  userAddress: Address,
  agentAddress: Address,
  usdcAmount: bigint
): Promise<SettlementResult> {
  const hookData = encodeAbiParameters(
    parseAbiParameters('address, address'),
    [agentAddress, userAddress]
  );

  try {
    const txHash = await walletClient.writeContract({
      chain: base,
      account: userAddress,
      address: ADDRESSES.POOL_MANAGER,
      abi: V4_SWAP_ROUTER_ABI,
      functionName: 'swap',
      args: [
        WETH_USDC_POOL_KEY,
        {
          zeroForOne: false,
          amountSpecified: -BigInt(usdcAmount),
          sqrtPriceLimitX96: 0n
        },
        hookData
      ]
    });

    return {
      success: true,
      txHash,
      settledAmount: usdcAmount,
      receivedAmount: usdcAmount / 3000n,
      tierDiscount: 1
    };
  } catch (error) {
    throw error;
  }
}

export function encodeAgentHookData(
  agentAddress: Address,
  userAddress: Address
): `0x${string}` {
  return encodeAbiParameters(
    parseAbiParameters('address, address'),
    [agentAddress, userAddress]
  );
}
