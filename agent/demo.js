#!/usr/bin/env node
/**
 * UniPerk Agent Demo
 * Shows how an OpenClaw agent executes trades with ENS permissions
 */

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const c = COLORS;

async function demo() {
  console.clear();
  
  // Header
  console.log(`${c.magenta}${c.bright}`);
  console.log(`  ╔═══════════════════════════════════════════════════════╗`);
  console.log(`  ║           🦄 UniPerk Agent Demo (OpenClaw)            ║`);
  console.log(`  ╚═══════════════════════════════════════════════════════╝${c.reset}`);
  console.log();
  
  await sleep(1000);
  
  // Step 1: Agent Identity
  console.log(`${c.cyan}${c.bright}[1/5] Agent Identity${c.reset}`);
  console.log(`${c.dim}──────────────────────────────────────────────────${c.reset}`);
  await sleep(500);
  console.log(`  🤖 Agent: UniPerk Trading Agent`);
  console.log(`  📍 Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f...`);
  console.log(`  🔗 Framework: OpenClaw`);
  console.log(`  ⛓️  Network: Base Mainnet (8453)`);
  console.log();
  
  await sleep(1500);
  
  // Step 2: Read ENS Permissions
  console.log(`${c.blue}${c.bright}[2/5] Reading ENS Permissions${c.reset}`);
  console.log(`${c.dim}──────────────────────────────────────────────────${c.reset}`);
  await sleep(500);
  console.log(`  🌐 Querying: juliomcruz.eth`);
  await sleep(800);
  console.log(`  📖 Reading text records...`);
  await sleep(600);
  console.log();
  console.log(`  ${c.green}✓${c.reset} agent.uniperk.allowed  = ${c.bright}true${c.reset}`);
  await sleep(300);
  console.log(`  ${c.green}✓${c.reset} agent.uniperk.maxTrade = ${c.bright}1000${c.reset} USDC`);
  await sleep(300);
  console.log(`  ${c.green}✓${c.reset} agent.uniperk.tokens   = ${c.bright}ETH,USDC,WBTC${c.reset}`);
  await sleep(300);
  console.log(`  ${c.green}✓${c.reset} agent.uniperk.slippage = ${c.bright}50${c.reset} bps (0.5%)`);
  await sleep(300);
  console.log(`  ${c.green}✓${c.reset} agent.uniperk.expires  = ${c.bright}2026-12-31${c.reset}`);
  console.log();
  
  await sleep(1500);
  
  // Step 3: Validate Trade
  console.log(`${c.yellow}${c.bright}[3/5] Validating Trade Request${c.reset}`);
  console.log(`${c.dim}──────────────────────────────────────────────────${c.reset}`);
  await sleep(500);
  console.log(`  📥 Request: Swap 100 USDC → ETH`);
  console.log();
  await sleep(600);
  console.log(`  Checking permissions...`);
  await sleep(400);
  console.log(`    ${c.green}✓${c.reset} Agent trading allowed`);
  await sleep(300);
  console.log(`    ${c.green}✓${c.reset} Amount (100) ≤ maxTrade (1000)`);
  await sleep(300);
  console.log(`    ${c.green}✓${c.reset} Token ETH in allowed list`);
  await sleep(300);
  console.log(`    ${c.green}✓${c.reset} Permissions not expired`);
  console.log();
  await sleep(400);
  console.log(`  ${c.green}${c.bright}→ TRADE APPROVED${c.reset}`);
  console.log();
  
  await sleep(1500);
  
  // Step 4: Yellow Network Execution
  console.log(`${c.yellow}${c.bright}[4/5] Yellow Network Execution${c.reset}`);
  console.log(`${c.dim}──────────────────────────────────────────────────${c.reset}`);
  await sleep(500);
  console.log(`  🟡 Connecting to Yellow Network...`);
  await sleep(800);
  console.log(`  ${c.green}✓${c.reset} WebSocket connected`);
  await sleep(400);
  console.log(`  ${c.green}✓${c.reset} State channel open (ID: 0x8f3a...)`);
  await sleep(600);
  console.log();
  console.log(`  💱 Executing swap...`);
  await sleep(1000);
  console.log(`    Input:  100.00 USDC`);
  console.log(`    Output: 0.0312 ETH`);
  console.log(`    Gas:    ${c.green}$0.00${c.reset} (off-chain)`);
  console.log();
  await sleep(400);
  console.log(`  ${c.green}${c.bright}→ TRADE EXECUTED INSTANTLY${c.reset}`);
  console.log();
  
  await sleep(1500);
  
  // Step 5: Uniswap V4 Settlement
  console.log(`${c.magenta}${c.bright}[5/5] Uniswap V4 Settlement${c.reset}`);
  console.log(`${c.dim}──────────────────────────────────────────────────${c.reset}`);
  await sleep(500);
  console.log(`  🦄 Settling via UniPerkHook...`);
  await sleep(600);
  console.log(`  📊 User tier: ${c.bright}SILVER${c.reset} (15 trades)`);
  await sleep(400);
  console.log(`  💰 Base fee: 0.30%`);
  console.log(`  🎁 Discount: -1% (Silver tier)`);
  console.log(`  ${c.green}→ Final fee: 0.297%${c.reset}`);
  console.log();
  await sleep(800);
  console.log(`  ${c.green}✓${c.reset} Settlement tx: 0x7a9f2c...`);
  console.log(`  ${c.green}✓${c.reset} Trade count updated: 15 → 16`);
  console.log();
  
  await sleep(1000);
  
  // Summary
  console.log(`${c.green}${c.bright}`);
  console.log(`  ╔═══════════════════════════════════════════════════════╗`);
  console.log(`  ║                    ✅ TRADE COMPLETE                  ║`);
  console.log(`  ╠═══════════════════════════════════════════════════════╣`);
  console.log(`  ║  ENS Permissions:  Read from juliomcruz.eth          ║`);
  console.log(`  ║  Validation:       Passed all checks                  ║`);
  console.log(`  ║  Execution:        Instant via Yellow Network         ║`);
  console.log(`  ║  Settlement:       Uniswap V4 + tier discount         ║`);
  console.log(`  ║  Gas Saved:        ~$2.50 (state channel)             ║`);
  console.log(`  ╚═══════════════════════════════════════════════════════╝${c.reset}`);
  console.log();
  console.log(`${c.dim}  Powered by: ENS + Yellow Network + Uniswap V4 + OpenClaw${c.reset}`);
  console.log();
}

demo().catch(console.error);
