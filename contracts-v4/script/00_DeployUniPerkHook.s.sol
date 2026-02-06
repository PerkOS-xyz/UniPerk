// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {HookMiner} from "@uniswap/v4-periphery/src/utils/HookMiner.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";

import {UniPerkHook} from "../src/UniPerkHook.sol";
import {IAgentRegistry} from "../src/interfaces/IAgentRegistry.sol";

/// @notice Deploys UniPerkHook with HookMiner for correct address flags
contract DeployUniPerkHookScript is Script {
    // CREATE2 factory (standard across all EVM chains)
    address constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
    
    // Base mainnet addresses
    address constant POOL_MANAGER_BASE = 0x498581fF718922c3f8e6A244956aF099B2652b2b;
    address constant AGENT_REGISTRY_BASE = 0xd5A14b5dA79Abb78a5B307eC28E9d9711cdd5cEF;

    function run() public {
        // UniPerk uses beforeSwap and afterSwap hooks
        uint160 flags = uint160(Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG);

        // Constructor arguments
        bytes memory constructorArgs = abi.encode(
            IPoolManager(POOL_MANAGER_BASE),
            IAgentRegistry(AGENT_REGISTRY_BASE)
        );

        console.log("Mining hook address with flags:", flags);
        console.log("PoolManager:", POOL_MANAGER_BASE);
        console.log("AgentRegistry:", AGENT_REGISTRY_BASE);

        // Mine a salt that will produce a hook address with the correct flags
        (address hookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER,
            flags,
            type(UniPerkHook).creationCode,
            constructorArgs
        );

        console.log("Mined hook address:", hookAddress);
        console.log("Salt:", vm.toString(salt));

        // Deploy the hook using CREATE2
        vm.startBroadcast();
        UniPerkHook hook = new UniPerkHook{salt: salt}(
            IPoolManager(POOL_MANAGER_BASE),
            IAgentRegistry(AGENT_REGISTRY_BASE)
        );
        vm.stopBroadcast();

        console.log("Deployed UniPerkHook at:", address(hook));
        require(address(hook) == hookAddress, "DeployUniPerkHook: Hook Address Mismatch");
    }
}
