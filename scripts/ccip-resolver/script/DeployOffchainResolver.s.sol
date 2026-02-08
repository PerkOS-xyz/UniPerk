// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "forge-std/Script.sol";
import "../src/OffchainResolver.sol";
import "../src/OffchainResolverFactory.sol";

/**
 * Deploy OffchainResolver implementation, Factory, and create one resolver
 * for the given GATEWAY_URL and SIGNER_ADDRESS.
 *
 * Env:
 *   GATEWAY_URL    - Full gateway URL (e.g. https://uniperk-ens-gateway.xxx.workers.dev)
 *   SIGNER_ADDRESS - Address that signs gateway responses (from gateway PRIVATE_KEY)
 *
 * Run:
 *   forge script script/DeployOffchainResolver.s.sol --rpc-url mainnet --broadcast --private-key <DEPLOYER_KEY>
 * Or with .env:
 *   source .env && forge script script/DeployOffchainResolver.s.sol --rpc-url mainnet --broadcast
 */
contract DeployOffchainResolverScript is Script {
    function run() external {
        string memory gatewayUrl = vm.envOr("GATEWAY_URL", string(""));
        address signerAddr = vm.envOr("SIGNER_ADDRESS", address(0));

        require(
            bytes(gatewayUrl).length > 0,
            "DeployOffchainResolver: set GATEWAY_URL"
        );
        require(
            signerAddr != address(0),
            "DeployOffchainResolver: set SIGNER_ADDRESS"
        );

        vm.startBroadcast();

        OffchainResolver impl = new OffchainResolver();
        OffchainResolverFactory factory = new OffchainResolverFactory(
            address(impl)
        );

        address[] memory signers = new address[](1);
        signers[0] = signerAddr;
        address resolver = factory.createOffchainResolver(gatewayUrl, signers);

        vm.stopBroadcast();

        console.log("OffchainResolver (implementation):", address(impl));
        console.log("OffchainResolverFactory:", address(factory));
        console.log(">>> NEW RESOLVER (set this on uniperk.eth in ENS Manager):", resolver);
    }
}
