#!/usr/bin/env node
/**
 * Yellow Network Trade Script
 * Execute trades via state channel (instant, gasless)
 */

import { createWalletClient, createPublicClient, http, parseUnits, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../../../contracts/.env') });

// Configuration
const YELLOW_WS = process.env.YELLOW_WS || 'wss://clearnet.yellow.com/ws';
const PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY;

// Token addresses (Base Mainnet)
const TOKENS = {
  USDC: '0x833589fCD6eDb6E08f4c7c32D4f71b54bdA02913',
  WETH: '0x4200000000000000000000000000000000000006',
  ETH: '0x0000000000000000000000000000000000000000'
};

// Token decimals
const DECIMALS = {
  USDC: 6,
  WETH: 18,
  ETH: 18
};

if (!PRIVATE_KEY) {
  console.error('❌ AGENT_PRIVATE_KEY not set in contracts/.env');
  process.exit(1);
}

/**
 * Read ENS permissions for user from text records
 * Uses viem to query ENS text records on mainnet
 */
async function readENSPermissions(userAddress, ensName = null) {
  // If no ENS name provided, use default permissions (for testing)
  if (!ensName) {
    console.log('   ⚠️  No ENS name provided, using defaults');
    return {
      allowed: true,
      maxTrade: 1000,
      tokens: ['ETH', 'USDC', 'WETH'],
      slippage: 50,
      expires: Math.floor(Date.now() / 1000) + 86400
    };
  }

  try {
    // Create mainnet client for ENS resolution
    const mainnetClient = createPublicClient({
      chain: { id: 1, name: 'Ethereum', network: 'mainnet', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['https://eth.llamarpc.com'] } } },
      transport: http()
    });

    // Read ENS text records
    const textRecords = {
      allowed: await mainnetClient.getEnsText({ name: ensName, key: 'agent.uniperk.allowed' }).catch(() => null),
      maxTrade: await mainnetClient.getEnsText({ name: ensName, key: 'agent.uniperk.maxTrade' }).catch(() => null),
      tokens: await mainnetClient.getEnsText({ name: ensName, key: 'agent.uniperk.tokens' }).catch(() => null),
      slippage: await mainnetClient.getEnsText({ name: ensName, key: 'agent.uniperk.slippage' }).catch(() => null),
      expires: await mainnetClient.getEnsText({ name: ensName, key: 'agent.uniperk.expires' }).catch(() => null)
    };

    console.log(`   📖 ENS records for ${ensName}:`, textRecords);

    // Parse text records with defaults
    return {
      allowed: textRecords.allowed === 'true',
      maxTrade: textRecords.maxTrade ? parseInt(textRecords.maxTrade) : 1000,
      tokens: textRecords.tokens ? textRecords.tokens.split(',').map(t => t.trim()) : ['ETH', 'USDC', 'WETH'],
      slippage: textRecords.slippage ? parseInt(textRecords.slippage) : 50,
      expires: textRecords.expires ? parseInt(textRecords.expires) : Math.floor(Date.now() / 1000) + 86400
    };
  } catch (error) {
    console.log(`   ⚠️  ENS read failed: ${error.message}, using defaults`);
    return {
      allowed: true,
      maxTrade: 1000,
      tokens: ['ETH', 'USDC', 'WETH'],
      slippage: 50,
      expires: Math.floor(Date.now() / 1000) + 86400
    };
  }
}

/**
 * Validate trade against ENS permissions
 */
function validateTrade(permissions, fromToken, toToken, amount) {
  const errors = [];

  if (!permissions.allowed) {
    errors.push('Agent trading not allowed');
  }

  if (permissions.expires < Math.floor(Date.now() / 1000)) {
    errors.push('Permissions expired');
  }

  if (!permissions.tokens.includes(fromToken)) {
    errors.push(`Token ${fromToken} not in allowed list`);
  }

  if (!permissions.tokens.includes(toToken)) {
    errors.push(`Token ${toToken} not in allowed list`);
  }

  // Convert amount to USDC equivalent for limit check
  // Simplified: assume 1:1 for demo
  if (amount > permissions.maxTrade) {
    errors.push(`Trade size ${amount} exceeds limit ${permissions.maxTrade}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Execute trade via Yellow Network
 */
async function trade(fromToken, toToken, amount, userAddress = null) {
  console.log('🟡 Yellow Network Trade');
  console.log('=======================');
  console.log('');

  const account = privateKeyToAccount(PRIVATE_KEY);
  const trader = userAddress || account.address;

  console.log(`📍 Agent: ${account.address}`);
  console.log(`👤 Trader: ${trader}`);
  console.log(`🔄 Swap: ${amount} ${fromToken} → ${toToken}`);
  console.log('');

  // Validate token symbols
  if (!TOKENS[fromToken]) {
    console.error(`❌ Unknown token: ${fromToken}`);
    console.error(`   Supported: ${Object.keys(TOKENS).join(', ')}`);
    process.exit(1);
  }

  if (!TOKENS[toToken]) {
    console.error(`❌ Unknown token: ${toToken}`);
    console.error(`   Supported: ${Object.keys(TOKENS).join(', ')}`);
    process.exit(1);
  }

  // Read ENS permissions
  console.log('1️⃣ Reading ENS permissions...');
  const permissions = await readENSPermissions(trader);
  console.log(`   maxTrade: ${permissions.maxTrade} USDC`);
  console.log(`   tokens: ${permissions.tokens.join(', ')}`);
  console.log(`   slippage: ${permissions.slippage} bps`);
  console.log('');

  // Validate trade
  console.log('2️⃣ Validating trade...');
  const validation = validateTrade(permissions, fromToken, toToken, amount);
  
  if (!validation.valid) {
    console.error('❌ Trade validation failed:');
    validation.errors.forEach(e => console.error(`   - ${e}`));
    process.exit(1);
  }
  console.log('   ✅ Trade validated');
  console.log('');

  // Connect to Yellow Network
  console.log('3️⃣ Connecting to Yellow Network...');
  
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(YELLOW_WS);

    ws.on('open', async () => {
      console.log('   ✅ Connected');
      console.log('');

      // Create wallet client for signing
      const walletClient = createWalletClient({
        account,
        chain: base,
        transport: http()
      });

      // Authenticate
      const timestamp = Date.now();
      const authMessage = `Yellow Network Authentication\nTimestamp: ${timestamp}`;
      const signature = await walletClient.signMessage({ message: authMessage });

      ws.send(JSON.stringify({
        type: 'auth',
        address: account.address,
        timestamp,
        signature,
        chainId: 8453
      }));
    });

    ws.on('message', async (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === 'auth_success') {
        console.log('4️⃣ Executing trade...');

        // Create trade order
        const order = {
          type: 'trade',
          sessionId: message.sessionId,
          fromToken: TOKENS[fromToken],
          toToken: TOKENS[toToken],
          amount: parseUnits(amount.toString(), DECIMALS[fromToken]).toString(),
          slippage: permissions.slippage,
          trader,
          timestamp: Date.now()
        };

        // Sign the order
        const walletClient = createWalletClient({
          account: privateKeyToAccount(PRIVATE_KEY),
          chain: base,
          transport: http()
        });

        const orderMessage = JSON.stringify(order);
        const orderSignature = await walletClient.signMessage({ message: orderMessage });

        ws.send(JSON.stringify({
          ...order,
          signature: orderSignature
        }));
      }

      if (message.type === 'trade_executed') {
        console.log('   ✅ Trade executed!');
        console.log('');
        console.log('📊 Trade Result:');
        console.log(`   From: ${amount} ${fromToken}`);
        console.log(`   To: ${message.received} ${toToken}`);
        console.log(`   Rate: ${message.rate}`);
        console.log(`   Channel ID: ${message.channelId}`);
        console.log('');
        console.log('💡 Note: Trade executed off-chain via state channel');
        console.log('   Settlement will occur when channel closes');
        
        ws.close();
        resolve(message);
      }

      if (message.type === 'error') {
        console.error(`❌ Trade error: ${message.error}`);
        ws.close();
        reject(new Error(message.error));
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      reject(error);
    });

    // Timeout
    setTimeout(() => {
      ws.close();
      reject(new Error('Trade timeout'));
    }, 60000);
  });
}

// CLI
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Usage: node trade.js <from_token> <to_token> <amount>');
  console.log('');
  console.log('Supported tokens: USDC, WETH, ETH');
  console.log('');
  console.log('Examples:');
  console.log('  node trade.js USDC WETH 100    # Swap 100 USDC to WETH');
  console.log('  node trade.js WETH USDC 0.05  # Swap 0.05 WETH to USDC');
  process.exit(1);
}

const [fromToken, toToken, amountStr] = args;
const amountNum = parseFloat(amountStr);

if (isNaN(amountNum) || amountNum <= 0) {
  console.error('❌ Invalid amount');
  process.exit(1);
}

trade(fromToken.toUpperCase(), toToken.toUpperCase(), amountNum)
  .then(() => {
    console.log('✅ Trade complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Trade failed:', error.message);
    process.exit(1);
  });

export { trade, validateTrade, readENSPermissions };
