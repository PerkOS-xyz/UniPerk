/**
 * 1-mine-address.js
 * Mine a valid hook address for Uniswap V4
 * 
 * V4 hooks require specific address bits matching their permissions.
 * This script finds a CREATE2 salt that produces a valid address.
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// CREATE2 Deployer (standard across all chains)
const CREATE2_DEPLOYER = "0x4e59b44847b379578588920cA78FbF26c0B4956C";

// Hook flags (from Hooks.sol)
const BEFORE_SWAP_FLAG = 1 << 7;    // 0x0080
const AFTER_SWAP_FLAG = 1 << 6;     // 0x0040
const FLAG_MASK = 0x3FFF;           // Bottom 14 bits

// Our hook needs beforeSwap and afterSwap
const REQUIRED_FLAGS = BEFORE_SWAP_FLAG | AFTER_SWAP_FLAG; // 0x00C0

// Max iterations to prevent infinite loop
const MAX_ITERATIONS = 500_000;

/**
 * Compute CREATE2 address
 */
function computeCreate2Address(deployer, salt, initCodeHash) {
  const data = ethers.concat([
    "0xff",
    deployer,
    salt,
    initCodeHash
  ]);
  return ethers.getAddress("0x" + ethers.keccak256(data).slice(-40));
}

/**
 * Check if address has correct hook flags
 */
function hasCorrectFlags(address, requiredFlags) {
  const addressNum = BigInt(address);
  const flags = Number(addressNum & BigInt(FLAG_MASK));
  return (flags & requiredFlags) === requiredFlags;
}

async function main() {
  console.log("🔍 UniPerk Hook Address Miner");
  console.log("=============================\n");
  
  console.log("Configuration:");
  console.log("  CREATE2 Deployer:", CREATE2_DEPLOYER);
  console.log("  Required Flags:", "0x" + REQUIRED_FLAGS.toString(16).padStart(4, "0"));
  console.log("  Flag Mask:", "0x" + FLAG_MASK.toString(16));
  console.log("  Max Iterations:", MAX_ITERATIONS.toLocaleString());
  console.log("");

  // Load contract bytecode
  const artifactPath = path.join(__dirname, "../artifacts/contracts/UniPerkHook.sol/UniPerkHook.json");
  
  if (!fs.existsSync(artifactPath)) {
    console.error("❌ Contract artifact not found. Run 'npm run compile' first.");
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  // Constructor args: (IPoolManager, IAgentRegistry)
  const POOL_MANAGER = "0x498581ff718922c3f8e6a244956af099b2652b2b";
  const AGENT_REGISTRY = "0xd5A14b5dA79Abb78a5B307eC28E9d9711cdd5cEF";
  
  const constructorArgs = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address"],
    [POOL_MANAGER, AGENT_REGISTRY]
  );
  
  const initCode = ethers.concat([artifact.bytecode, constructorArgs]);
  const initCodeHash = ethers.keccak256(initCode);
  
  console.log("Init Code Hash:", initCodeHash);
  console.log("\n🔄 Mining for valid address...\n");

  const startTime = Date.now();
  let found = false;
  let foundSalt, foundAddress;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    // Generate salt from iteration number
    const salt = ethers.zeroPadValue(ethers.toBeHex(i), 32);
    
    // Compute address
    const address = computeCreate2Address(CREATE2_DEPLOYER, salt, initCodeHash);
    
    // Check flags
    if (hasCorrectFlags(address, REQUIRED_FLAGS)) {
      found = true;
      foundSalt = salt;
      foundAddress = address;
      break;
    }

    // Progress update every 10k iterations
    if (i > 0 && i % 10000 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  Checked ${i.toLocaleString()} addresses... (${elapsed}s)`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  if (found) {
    console.log("\n✅ Found valid address!\n");
    console.log("  Address:", foundAddress);
    console.log("  Salt:", foundSalt);
    console.log("  Time:", elapsed, "seconds");
    
    // Verify flags
    const addressNum = BigInt(foundAddress);
    const flags = Number(addressNum & BigInt(FLAG_MASK));
    console.log("  Flags:", "0x" + flags.toString(16).padStart(4, "0"));
    console.log("");

    // Save result
    const result = {
      address: foundAddress,
      salt: foundSalt,
      initCodeHash: initCodeHash,
      poolManager: POOL_MANAGER,
      agentRegistry: AGENT_REGISTRY,
      flags: "0x" + flags.toString(16).padStart(4, "0"),
      minedAt: new Date().toISOString()
    };

    const outputPath = path.join(__dirname, "../mined-address.json");
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log("💾 Saved to:", outputPath);
    
    return result;
  } else {
    console.log("\n❌ Could not find valid address in", MAX_ITERATIONS, "iterations");
    console.log("   Try increasing MAX_ITERATIONS or check flag requirements");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
