const hre = require("hardhat");

async function main() {
  console.log("Deploying UniPerk contracts to", hre.network.name);
  
  // TODO: Deploy AgentRegistry
  // TODO: Deploy UniPerkHook
  
  console.log("Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
