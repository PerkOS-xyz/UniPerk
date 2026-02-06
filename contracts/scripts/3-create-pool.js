/**
 * 3-create-pool.js
 * Create a Uniswap V4 pool with UniPerkHook
 * 
 * Creates an ETH/USDC pool with our identity-aware hook
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Base Mainnet addresses
const POOL_MANAGER = "0x498581ff718922c3f8e6a244956af099b2652b2b";
const WETH = "0x4200000000000000000000000000000000000006";
const USDC = "0x833589fCD6eDb6E08f4c7c32D4f71b54bdA02913";

// Pool configuration
const FEE = 3000;           // 0.3%
const TICK_SPACING = 60;    // Standard for 0.3% fee

// Starting price: 1 ETH = 2500 USDC
// sqrtPriceX96 = sqrt(2500) * 2^96
const SQRT_PRICE_X96 = "3961408125713216879677197516800";

// PoolManager ABI (minimal)
const POOL_MANAGER_ABI = [
  "function initialize(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, uint160 sqrtPriceX96) external returns (int24 tick)",
  "event Initialize(bytes32 indexed id, address indexed currency0, address indexed currency1, uint24 fee, int24 tickSpacing, address hooks, uint160 sqrtPriceX96, int24 tick)"
];

async function main() {
  console.log("🏊 UniPerk Pool Creation");
  console.log("========================\n");

  // Load hook address
  const minedPath = path.join(__dirname, "../mined-address.json");
  
  if (!fs.existsSync(minedPath)) {
    console.error("❌ mined-address.json not found. Deploy hook first.");
    process.exit(1);
  }

  const mined = JSON.parse(fs.readFileSync(minedPath, "utf8"));
  const hookAddress = mined.address;

  console.log("Configuration:");
  console.log("  Pool Manager:", POOL_MANAGER);
  console.log("  Hook:", hookAddress);
  console.log("  Currency0 (WETH):", WETH);
  console.log("  Currency1 (USDC):", USDC);
  console.log("  Fee:", FEE / 10000 + "%");
  console.log("  Tick Spacing:", TICK_SPACING);
  console.log("");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Caller:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Sort currencies (required by V4)
  let currency0, currency1;
  if (BigInt(WETH) < BigInt(USDC)) {
    currency0 = WETH;
    currency1 = USDC;
  } else {
    currency0 = USDC;
    currency1 = WETH;
  }

  console.log("Sorted currencies:");
  console.log("  currency0:", currency0);
  console.log("  currency1:", currency1);
  console.log("");

  // Create PoolKey
  const poolKey = {
    currency0: currency0,
    currency1: currency1,
    fee: FEE,
    tickSpacing: TICK_SPACING,
    hooks: hookAddress
  };

  // Connect to PoolManager
  const poolManager = new hre.ethers.Contract(
    POOL_MANAGER,
    POOL_MANAGER_ABI,
    deployer
  );

  console.log("🔄 Initializing pool...\n");

  try {
    const tx = await poolManager.initialize(
      [poolKey.currency0, poolKey.currency1, poolKey.fee, poolKey.tickSpacing, poolKey.hooks],
      SQRT_PRICE_X96
    );
    
    console.log("  Tx Hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("  Block:", receipt.blockNumber);
    console.log("  Gas Used:", receipt.gasUsed.toString());

    // Parse Initialize event
    const initEvent = receipt.logs.find(log => 
      log.topics[0] === hre.ethers.id("Initialize(bytes32,address,address,uint24,int24,address,uint160,int24)")
    );

    if (initEvent) {
      const poolId = initEvent.topics[1];
      console.log("\n✅ Pool created successfully!");
      console.log("  Pool ID:", poolId);
    }

    // Save pool info
    const poolInfo = {
      poolId: initEvent?.topics[1] || "unknown",
      poolKey: poolKey,
      sqrtPriceX96: SQRT_PRICE_X96,
      createdAt: new Date().toISOString(),
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    };

    const poolPath = path.join(__dirname, "../pool-info.json");
    fs.writeFileSync(poolPath, JSON.stringify(poolInfo, null, 2));
    console.log("\n💾 Saved to:", poolPath);

    return poolInfo;

  } catch (error) {
    console.error("\n❌ Pool creation failed:", error.message);
    
    if (error.message.includes("PoolAlreadyInitialized")) {
      console.log("\n📍 Pool already exists with this configuration");
    }
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
