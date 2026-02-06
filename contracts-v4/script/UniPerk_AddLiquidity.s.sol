// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IPositionManager} from "@uniswap/v4-periphery/src/interfaces/IPositionManager.sol";
import {IPermit2} from "permit2/src/interfaces/IPermit2.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {CurrencyLibrary, Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {LiquidityAmounts} from "@uniswap/v4-core/test/utils/LiquidityAmounts.sol";
import {Actions} from "@uniswap/v4-periphery/src/libraries/Actions.sol";

/// @notice Adds liquidity to UniPerk pool on Base mainnet
/// @dev Run with: forge script script/UniPerk_AddLiquidity.s.sol --rpc-url base --broadcast
contract UniPerkAddLiquidityScript is Script {
    using CurrencyLibrary for Currency;

    // ============ Base Mainnet Addresses ============
    IPoolManager constant POOL_MANAGER = IPoolManager(0x498581fF718922c3f8e6A244956aF099B2652b2b);
    IPositionManager constant POSITION_MANAGER = IPositionManager(0x7C5f5A4bBd8fD63184577525326123B519429bDc);
    IPermit2 constant PERMIT2 = IPermit2(0x000000000022D473030F116dDEE9F6B43aC78BA3);
    
    // Tokens
    address constant WETH = 0x4200000000000000000000000000000000000006;
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    
    // UniPerk Hook - DEPLOYED
    address constant UNIPERK_HOOK = 0x825Fc7Ac1E5456674D7dBbB4D12467E8253740C0;
    
    // Pool config
    uint24 constant LP_FEE = 3000;
    int24 constant TICK_SPACING = 60;
    uint160 constant STARTING_PRICE = 3961408125713216879677197516800;
    
    // Liquidity amounts (ultra minimum for demo)
    uint256 constant WETH_AMOUNT = 0.001 ether;
    uint256 constant USDC_AMOUNT = 2500000; // 2.5 USDC (6 decimals)

    function run() external {
        require(UNIPERK_HOOK != address(0), "Set UNIPERK_HOOK address first");
        
        // WETH (0x42..) < USDC (0x83..) so WETH is currency0
        Currency currency0 = Currency.wrap(WETH);
        Currency currency1 = Currency.wrap(USDC);
        
        PoolKey memory poolKey = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: LP_FEE,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(UNIPERK_HOOK)
        });
        
        int24 currentTick = TickMath.getTickAtSqrtPrice(STARTING_PRICE);
        int24 tickLower = ((currentTick - 750 * TICK_SPACING) / TICK_SPACING) * TICK_SPACING;
        int24 tickUpper = ((currentTick + 750 * TICK_SPACING) / TICK_SPACING) * TICK_SPACING;
        
        uint128 liquidity = LiquidityAmounts.getLiquidityForAmounts(
            STARTING_PRICE,
            TickMath.getSqrtPriceAtTick(tickLower),
            TickMath.getSqrtPriceAtTick(tickUpper),
            WETH_AMOUNT,
            USDC_AMOUNT
        );
        
        console.log("Adding liquidity to UniPerk pool");
        
        vm.startBroadcast();
        _addLiquidity(poolKey, tickLower, tickUpper, liquidity, currency0, currency1);
        vm.stopBroadcast();
        
        console.log("Done!");
    }
    
    function _addLiquidity(
        PoolKey memory poolKey,
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity,
        Currency currency0,
        Currency currency1
    ) internal {
        // Approvals
        IERC20(Currency.unwrap(currency0)).approve(address(PERMIT2), type(uint256).max);
        IERC20(Currency.unwrap(currency1)).approve(address(PERMIT2), type(uint256).max);
        PERMIT2.approve(Currency.unwrap(currency0), address(POSITION_MANAGER), type(uint160).max, type(uint48).max);
        PERMIT2.approve(Currency.unwrap(currency1), address(POSITION_MANAGER), type(uint160).max, type(uint48).max);
        
        // Mint
        bytes memory actions = abi.encodePacked(uint8(Actions.MINT_POSITION), uint8(Actions.SETTLE_PAIR));
        bytes[] memory params = new bytes[](2);
        params[0] = abi.encode(poolKey, tickLower, tickUpper, liquidity, WETH_AMOUNT + 1, USDC_AMOUNT + 1, msg.sender, "");
        params[1] = abi.encode(currency0, currency1);
        
        POSITION_MANAGER.modifyLiquidities(abi.encode(actions, params), block.timestamp + 3600);
    }
}
