/**
 * 2-deploy-with-create2.js
 * Deploy UniPerkHook using CREATE2 with mined salt
 * 
 * Uses the salt from 1-mine-address.js to deploy at the correct address
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// CREATE2 Deployer ABI (minimal)
const CREATE2_DEPLOYER_ABI = [
  "function deploy(uint256 amount, bytes32 salt, bytes memory bytecode) public returns (address)"
];

const CREATE2_DEPLOYER = "0x4e59b44847b379578588920cA78FbF26c0B4956C";

async function main() {
  console.log("🚀 UniPerk Hook CREATE2 Deployment");
  console.log("===================================\n");

  // Load mined address data
  const minedPath = path.join(__dirname, "../mined-address.json");
  
  if (!fs.existsSync(minedPath)) {
    console.error("❌ mined-address.json not found. Run '1-mine-address.js' first.");
    process.exit(1);
  }

  const mined = JSON.parse(fs.readFileSync(minedPath, "utf8"));
  
  console.log("Mined Configuration:");
  console.log("  Expected Address:", mined.address);
  console.log("  Salt:", mined.salt);
  console.log("  Pool Manager:", mined.poolManager);
  console.log("  Agent Registry:", mined.agentRegistry);
  console.log("");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Get contract bytecode with constructor args
  const UniPerkHook = await hre.ethers.getContractFactory("UniPerkHook");
  const constructorArgs = hre.ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address"],
    [mined.poolManager, mined.agentRegistry]
  );
  
  const initCode = hre.ethers.concat([UniPerkHook.bytecode, constructorArgs]);

  // Connect to CREATE2 Deployer
  const create2Deployer = new hre.ethers.Contract(
    CREATE2_DEPLOYER,
    CREATE2_DEPLOYER_ABI,
    deployer
  );

  console.log("📦 Deploying via CREATE2...\n");

  try {
    const tx = await create2Deployer.deploy(0, mined.salt, initCode);
    console.log("  Tx Hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("  Block:", receipt.blockNumber);
    console.log("  Gas Used:", receipt.gasUsed.toString());

    // Verify deployed address
    const deployedAddress = "0x" + receipt.logs[0].topics[1].slice(-40);
    
    if (deployedAddress.toLowerCase() === mined.address.toLowerCase()) {
      console.log("\n✅ Deployment successful!");
      console.log("  UniPerkHook:", deployedAddress);
    } else {
      console.log("\n⚠️  Address mismatch!");
      console.log("  Expected:", mined.address);
      console.log("  Got:", deployedAddress);
    }

    // Update mined-address.json with deployment info
    mined.deployed = true;
    mined.deployedAt = new Date().toISOString();
    mined.txHash = tx.hash;
    mined.blockNumber = receipt.blockNumber;
    fs.writeFileSync(minedPath, JSON.stringify(mined, null, 2));

    return deployedAddress;
    
  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    
    // Check if already deployed
    const code = await hre.ethers.provider.getCode(mined.address);
    if (code !== "0x") {
      console.log("\n📍 Contract already exists at:", mined.address);
      return mined.address;
    }
    
    throw error;
  }
}

main()
  .then((address) => {
    console.log("\n✅ Hook deployed at:", address);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
