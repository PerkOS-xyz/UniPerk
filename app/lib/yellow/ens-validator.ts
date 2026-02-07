import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import type { ENSPermissions, ValidationResult } from './types';

const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http()
});

interface ValidationRequest {
  ensName: string;
  amount: bigint;
  token: string;
}

export async function validateENSPermissions(
  request: ValidationRequest
): Promise<ValidationResult> {
  try {
    const [allowed, maxTrade, tokens, slippage, expires] = await Promise.all([
      mainnetClient.getEnsText({ name: request.ensName, key: 'agent.uniperk.allowed' }),
      mainnetClient.getEnsText({ name: request.ensName, key: 'agent.uniperk.maxTrade' }),
      mainnetClient.getEnsText({ name: request.ensName, key: 'agent.uniperk.tokens' }),
      mainnetClient.getEnsText({ name: request.ensName, key: 'agent.uniperk.slippage' }),
      mainnetClient.getEnsText({ name: request.ensName, key: 'agent.uniperk.expires' })
    ]);

    const permissions: ENSPermissions = {
      allowed: allowed === 'true',
      maxTrade: BigInt((maxTrade || '1000') + '000000'),
      tokens: tokens ? tokens.split(',').map(t => t.trim().toUpperCase()) : ['ETH', 'USDC', 'WETH'],
      slippage: parseInt(slippage || '50'),
      expires: expires ? parseInt(expires) : null
    };

    if (!permissions.allowed) {
      return { valid: false, reason: 'Agent trading not allowed', permissions };
    }

    if (request.amount > permissions.maxTrade) {
      return { valid: false, reason: `Amount exceeds maxTrade limit`, permissions };
    }

    if (!permissions.tokens.includes(request.token.toUpperCase())) {
      return { valid: false, reason: `Token ${request.token} not in allowed list`, permissions };
    }

    if (permissions.expires && Date.now() / 1000 > permissions.expires) {
      return { valid: false, reason: 'Permissions expired', permissions };
    }

    return { valid: true, permissions };
  } catch (error) {
    return { valid: false, reason: `ENS lookup failed: ${error}` };
  }
}
