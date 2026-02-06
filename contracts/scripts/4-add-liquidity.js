/**
 * 4-add-liquidity.js
 * Add initial liquidity to the UniPerk V4 pool
 * 
 * Uses PositionManager to mint a liquidity position
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Base Mainnet addresses
const POSITION_MANAGER = "0x7c5f5a4bbd8fd63184577525326123b519429bdc";
const PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
const WETH = "0x4200000000000000000000000000000000000006";
const USDC = "0x833589fCD6eDb6E08f4c7c32D4f71b54bdA02913";

// Liquidity parameters
const LIQUIDITY_ETH = "0.01";  // 0.01 ETH
const LIQUIDITY_USDC = "25";   // 25 USDC (assuming ~2500 ETH/USDC)

// Position range (full range for simplicity)
const TICK_LOWER = -887220;  // Min tick for 60 spacing
const TICK_UPPER = 887220;   // Max tick for 60 spacing

// Actions enum
const Actions = {
  MINT_POSITION: 0,
  SETTLE_PAIR: 14
};

// ERC20 ABI (minimal)
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

// Permit2 ABI (minimal)
const PERMIT2_ABI = [
  "function approve(address token, address spender, uint160 amount, uint48 expiration) external"
];

// PositionManager ABI (minimal)
const POSITION_MANAGER_ABI = [
  "function multicall(bytes[] calldata data) external payable returns (bytes[] memory results)",
  "function modifyLiquidities(bytes calldata unlockData, uint256 deadline) external payable"
];

async function main() {
  console.log("💧 UniPerk Liquidity Addition");
  console.log("==============================\n");

  // Load pool info
  const poolPath = path.join(__dirname, "../pool-info.json");
  
  if (!fs.existsSync(poolPath)) {
    console.error("❌ pool-info.json not found. Create pool first.");
    process.exit(1);
  }

  const poolInfo = JSON.parse(fs.readFileSync(poolPath, "utf8"));
  
  console.log("Pool Configuration:");
  console.log("  Pool ID:", poolInfo.poolId);
  console.log("  Hook:", poolInfo.poolKey.hooks);
  console.log("");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Provider:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("ETH Balance:", hre.ethers.formatEther(balance), "ETH");

  // Check USDC balance
  const usdc = new hre.ethers.Contract(USDC, ERC20_ABI, deployer);
  const usdcBalance = await usdc.balanceOf(deployer.address);
  const usdcDecimals = await usdc.decimals();
  console.log("USDC Balance:", hre.ethers.formatUnits(usdcBalance, usdcDecimals), "USDC\n");

  // Amount calculations
  const ethAmount = hre.ethers.parseEther(LIQUIDITY_ETH);
  const usdcAmount = hre.ethers.parseUnits(LIQUIDITY_USDC, usdcDecimals);

  console.log("Adding liquidity:");
  console.log("  ETH:", LIQUIDITY_ETH);
  console.log("  USDC:", LIQUIDITY_USDC);
  console.log("  Tick Range:", TICK_LOWER, "to", TICK_UPPER);
  console.log("");

  // Step 1: Approve Permit2 to spend USDC
  console.log("1️⃣ Approving Permit2...");
  const approveTx = await usdc.approve(PERMIT2, hre.ethers.MaxUint256);
  await approveTx.wait();
  console.log("   ✅ Permit2 approved\n");

  // Step 2: Approve PositionManager via Permit2
  console.log("2️⃣ Approving PositionManager via Permit2...");
  const permit2 = new hre.ethers.Contract(PERMIT2, PERMIT2_ABI, deployer);
  const permit2Tx = await permit2.approve(
    USDC,
    POSITION_MANAGER,
    hre.ethers.MaxUint256,  // amount
    Math.floor(Date.now() / 1000) + 86400 * 365  // 1 year expiration
  );
  await permit2Tx.wait();
  console.log("   ✅ PositionManager approved\n");

  // Step 3: Add liquidity via PositionManager
  console.log("3️⃣ Adding liquidity...\n");

  const positionManager = new hre.ethers.Contract(
    POSITION_MANAGER,
    POSITION_MANAGER_ABI,
    deployer
  );

  // Encode actions
  const actions = hre.ethers.solidityPacked(
    ["uint8", "uint8"],
    [Actions.MINT_POSITION, Actions.SETTLE_PAIR]
  );

  // Encode mint params
  const mintParams = hre.ethers.AbiCoder.defaultAbiCoder().encode(
    ["tuple(address,address,uint24,int24,address)", "int24", "int24", "uint256", "uint128", "uint128", "address", "bytes"],
    [
      [poolInfo.poolKey.currency0, poolInfo.poolKey.currency1, poolInfo.poolKey.fee, poolInfo.poolKey.tickSpacing, poolInfo.poolKey.hooks],
      TICK_LOWER,
      TICK_UPPER,
      ethAmount,  // liquidity (simplified)
      ethAmount,  // amount0Max
      usdcAmount, // amount1Max
      deployer.address,
      "0x"  // hookData
    ]
  );

  // Encode settle params
  const settleParams = hre.ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address"],
    [poolInfo.poolKey.currency0, poolInfo.poolKey.currency1]
  );

  const unlockData = hre.ethers.AbiCoder.defaultAbiCoder().encode(
    ["bytes", "bytes[]"],
    [actions, [mintParams, settleParams]]
  );

  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour

  try {
    const tx = await positionManager.modifyLiquidities(unlockData, deadline, {
      value: ethAmount
    });
    
    console.log("  Tx Hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("  Block:", receipt.blockNumber);
    console.log("  Gas Used:", receipt.gasUsed.toString());

    console.log("\n✅ Liquidity added successfully!");

    // Update pool info
    poolInfo.liquidity = {
      eth: LIQUIDITY_ETH,
      usdc: LIQUIDITY_USDC,
      addedAt: new Date().toISOString(),
      txHash: tx.hash
    };
    fs.writeFileSync(poolPath, JSON.stringify(poolInfo, null, 2));

  } catch (error) {
    console.error("\n❌ Liquidity addition failed:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
