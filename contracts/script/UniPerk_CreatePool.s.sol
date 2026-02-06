// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {CurrencyLibrary, Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";

/// @notice Creates a UniPerk pool on Base mainnet
/// @dev Run with: forge script script/UniPerk_CreatePool.s.sol --rpc-url base --broadcast
contract UniPerkCreatePoolScript is Script {
    using CurrencyLibrary for Currency;

    // ============ Base Mainnet Addresses ============
    
    // Uniswap V4 Core
    IPoolManager constant POOL_MANAGER = IPoolManager(0x498581fF718922c3f8e6A244956aF099B2652b2b);
    
    // Tokens on Base
    address constant WETH = 0x4200000000000000000000000000000000000006;
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    
    // UniPerk Hook - DEPLOYED
    address constant UNIPERK_HOOK = 0x825Fc7Ac1E5456674D7dBbB4D12467E8253740C0;
    
    // ============ Pool Configuration ============
    
    uint24 constant LP_FEE = 3000; // 0.30%
    int24 constant TICK_SPACING = 60;
    
    // Starting price: 1 WETH = 2500 USDC
    // sqrtPriceX96 = sqrt(2500) * 2^96 = 3961408125713216879677197516800
    uint160 constant STARTING_PRICE = 3961408125713216879677197516800;

    function run() external {
        require(UNIPERK_HOOK != address(0), "Set UNIPERK_HOOK address first");
        
        // Sort currencies (required by V4)
        Currency currency0;
        Currency currency1;
        
        if (USDC < WETH) {
            currency0 = Currency.wrap(USDC);
            currency1 = Currency.wrap(WETH);
        } else {
            currency0 = Currency.wrap(WETH);
            currency1 = Currency.wrap(USDC);
        }
        
        PoolKey memory poolKey = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: LP_FEE,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(UNIPERK_HOOK)
        });
        
        bytes memory hookData = new bytes(0);
        
        console.log("Creating UniPerk Pool on Base mainnet");
        console.log("Currency0:", Currency.unwrap(currency0));
        console.log("Currency1:", Currency.unwrap(currency1));
        console.log("Fee:", LP_FEE);
        console.log("Hook:", UNIPERK_HOOK);
        
        vm.startBroadcast();
        
        // Initialize the pool
        POOL_MANAGER.initialize(poolKey, STARTING_PRICE);
        
        vm.stopBroadcast();
        
        console.log("Pool initialized successfully!");
    }
}
