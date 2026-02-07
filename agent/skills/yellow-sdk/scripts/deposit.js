#!/usr/bin/env node
/**
 * Yellow Network Deposit Script
 * Deposits USDC to Nitrolite Custody for state channel trading
 */

import { createWalletClient, createPublicClient, http, parseUnits, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../../../contracts/.env') });

// Addresses (Base Mainnet)
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7c32D4f71b54bdA02913';
const NITROLITE_CUSTODY = '0x490fb189DdE3a01B00be9BA5F41e3447FbC838b6';

// ABIs (minimal)
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ type: 'uint256' }]
  }
];

const NITROLITE_ABI = [
  {
    name: 'deposit',
    type: 'function',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'getBalance',
    type: 'function',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'token', type: 'address' }
    ],
    outputs: [{ type: 'uint256' }]
  }
];

const PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('❌ AGENT_PRIVATE_KEY not set in contracts/.env');
  process.exit(1);
}

async function deposit(amountUsdc) {
  console.log('🟡 Yellow Network Deposit');
  console.log('=========================');
  console.log('');

  const account = privateKeyToAccount(PRIVATE_KEY);
  const amount = parseUnits(amountUsdc.toString(), 6);

  console.log(`📍 Agent: ${account.address}`);
  console.log(`💰 Amount: ${amountUsdc} USDC`);
  console.log(`📦 Custody: ${NITROLITE_CUSTODY}`);
  console.log('');

  // Create clients
  const publicClient = createPublicClient({
    chain: base,
    transport: http()
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http()
  });

  // Check USDC balance
  const balance = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address]
  });

  console.log(`💵 USDC Balance: ${formatUnits(balance, 6)}`);

  if (balance < amount) {
    console.error(`❌ Insufficient USDC. Need ${amountUsdc}, have ${formatUnits(balance, 6)}`);
    process.exit(1);
  }

  // Check current allowance
  const allowance = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [account.address, NITROLITE_CUSTODY]
  });

  // Approve if needed
  if (allowance < amount) {
    console.log('');
    console.log('1️⃣ Approving USDC...');
    
    const approveTx = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [NITROLITE_CUSTODY, amount]
    });

    console.log(`   Tx: ${approveTx}`);
    await publicClient.waitForTransactionReceipt({ hash: approveTx });
    console.log('   ✅ Approved');
  } else {
    console.log('✅ Already approved');
  }

  // Deposit to Nitrolite
  console.log('');
  console.log('2️⃣ Depositing to Nitrolite Custody...');

  const depositTx = await walletClient.writeContract({
    address: NITROLITE_CUSTODY,
    abi: NITROLITE_ABI,
    functionName: 'deposit',
    args: [USDC_ADDRESS, amount]
  });

  console.log(`   Tx: ${depositTx}`);
  await publicClient.waitForTransactionReceipt({ hash: depositTx });
  console.log('   ✅ Deposited');

  // Check new balance in custody
  const custodyBalance = await publicClient.readContract({
    address: NITROLITE_CUSTODY,
    abi: NITROLITE_ABI,
    functionName: 'getBalance',
    args: [account.address, USDC_ADDRESS]
  });

  console.log('');
  console.log('✅ Deposit complete!');
  console.log(`   Custody Balance: ${formatUnits(custodyBalance, 6)} USDC`);

  return {
    txHash: depositTx,
    amount: amountUsdc,
    custodyBalance: formatUnits(custodyBalance, 6)
  };
}

// CLI
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Usage: node deposit.js <amount_usdc>');
  console.log('');
  console.log('Example: node deposit.js 100');
  process.exit(1);
}

const amountArg = parseFloat(args[0]);
if (isNaN(amountArg) || amountArg <= 0) {
  console.error('❌ Invalid amount');
  process.exit(1);
}

deposit(amountArg)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deposit failed:', error.message);
    process.exit(1);
  });

export { deposit };
