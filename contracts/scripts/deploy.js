const hre = require("hardhat");

async function main() {
  console.log("Deploying UniPerk contracts to", hre.network.name);
  console.log("Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    console.log("ERROR: No ETH balance. Please fund the deployer wallet.");
    process.exit(1);
  }

  // AgentRegistry already deployed
  const agentRegistryAddress = "0xd5A14b5dA79Abb78a5B307eC28E9d9711cdd5cEF";
  console.log("\n1. AgentRegistry (already deployed):", agentRegistryAddress);

  // 2. Deploy UniPerkHook
  console.log("\n2. Deploying UniPerkHook...");
  
  // Base mainnet PoolManager address
  const POOL_MANAGER = "0x498581ff718922c3f8e6a244956af099b2652b2b";
  
  const UniPerkHook = await hre.ethers.getContractFactory("UniPerkHook");
  const uniPerkHook = await UniPerkHook.deploy(POOL_MANAGER, agentRegistryAddress);
  await uniPerkHook.waitForDeployment();
  const uniPerkHookAddress = await uniPerkHook.getAddress();
  console.log("   UniPerkHook deployed at:", uniPerkHookAddress);

  // 3. Register deployer as initial agent
  console.log("\n3. Registering deployer as initial agent...");
  const agentRegistry = await hre.ethers.getContractAt("AgentRegistry", agentRegistryAddress);
  const tx = await agentRegistry.registerAgent(
    deployer.address,
    hre.ethers.parseEther("10"), // 10 ETH max trade limit
    "deployer.uniperk.eth"
  );
  await tx.wait();
  console.log("   Deployer registered as agent");

  // Summary
  console.log("\n========================================");
  console.log("       UniPerk Deployment Summary       ");
  console.log("========================================");
  console.log("");
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);
  console.log("");
  console.log("Deployed Contracts:");
  console.log("  AgentRegistry:  ", agentRegistryAddress);
  console.log("  UniPerkHook:    ", uniPerkHookAddress);
  console.log("");
  console.log("External Contracts (Base Mainnet):");
  console.log("  PoolManager:    ", POOL_MANAGER);
  console.log("  Nitrolite:      ", "0x490fb189DdE3a01B00be9BA5F41e3447FbC838b6");
  console.log("  USDC:           ", "0x833589fCD6eDb6E08f4c7c32D4f71b54bdA02913");
  console.log("");
  console.log("========================================");
  
  // Return addresses for verification
  return {
    agentRegistry: agentRegistryAddress,
    uniPerkHook: uniPerkHookAddress
  };
}

main()
  .then((addresses) => {
    console.log("\nDeployment successful!");
    console.log("Addresses:", JSON.stringify(addresses, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
