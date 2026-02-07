#!/usr/bin/env node
/**
 * Yellow Network Connection Script
 * Connects to Yellow Network WebSocket and authenticates
 */

import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../../../contracts/.env') });

const YELLOW_WS = process.env.YELLOW_WS || 'wss://clearnet.yellow.com/ws';
const PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('❌ AGENT_PRIVATE_KEY not set in contracts/.env');
  console.error('   Run: ../../../scripts/setup-wallet.sh');
  process.exit(1);
}

async function connect() {
  console.log('🟡 Yellow Network Connection');
  console.log('============================');
  console.log('');

  // Create wallet
  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log(`📍 Agent Address: ${account.address}`);
  console.log(`🌐 WebSocket: ${YELLOW_WS}`);
  console.log('');

  // Connect to WebSocket
  console.log('🔌 Connecting...');
  
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(YELLOW_WS);

    ws.on('open', async () => {
      console.log('✅ Connected to Yellow Network');
      
      // Create authentication message
      const timestamp = Date.now();
      const message = `Yellow Network Authentication\nTimestamp: ${timestamp}`;
      
      // Sign the message
      const walletClient = createWalletClient({
        account,
        chain: base,
        transport: http()
      });
      
      const signature = await walletClient.signMessage({ message });
      
      // Send auth message
      const authPayload = JSON.stringify({
        type: 'auth',
        address: account.address,
        timestamp,
        signature,
        chainId: 8453
      });
      
      ws.send(authPayload);
      console.log('📤 Auth message sent');
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      console.log('📥 Received:', message);
      
      if (message.type === 'auth_success') {
        console.log('');
        console.log('✅ Authentication successful!');
        console.log(`   Session ID: ${message.sessionId}`);
        ws.close();
        resolve(message);
      } else if (message.type === 'error') {
        console.error('❌ Error:', message.error);
        ws.close();
        reject(new Error(message.error));
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      reject(error);
    });

    ws.on('close', () => {
      console.log('🔌 Connection closed');
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      ws.close();
      reject(new Error('Connection timeout'));
    }, 30000);
  });
}

// Run if executed directly
connect()
  .then(() => {
    console.log('');
    console.log('🎉 Yellow Network connection test passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  });

export { connect };
