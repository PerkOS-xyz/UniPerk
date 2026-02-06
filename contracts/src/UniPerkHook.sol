// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseHook} from "@openzeppelin/uniswap-hooks/src/base/BaseHook.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager, SwapParams} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";

import {IAgentRegistry} from "./interfaces/IAgentRegistry.sol";

/// @title UniPerkHook
/// @notice Uniswap V4 hook for identity-aware trading with agent permissions
/// @dev Validates agents via AgentRegistry + ENS, applies tier-based fee discounts
contract UniPerkHook is BaseHook {
    using PoolIdLibrary for PoolKey;

    // ============ State Variables ============
    
    /// @notice Agent registry for on-chain validation
    IAgentRegistry public immutable agentRegistry;
    
    /// @notice Contract owner
    address public owner;
    
    /// @notice User tiers based on trading activity
    enum Tier { BRONZE, SILVER, GOLD, PLATINUM }
    
    /// @notice Fee discount per tier (in basis points, e.g., 500 = 5%)
    mapping(Tier => uint24) public tierFeeDiscount;
    
    /// @notice User's current tier
    mapping(address => Tier) public userTier;
    
    /// @notice Total trade count per user
    mapping(address => uint256) public tradeCount;
    
    /// @notice Total trade volume per user (in USD value)
    mapping(address => uint256) public tradeVolume;
    
    /// @notice Tier thresholds (trade count)
    uint256 public constant SILVER_THRESHOLD = 10;
    uint256 public constant GOLD_THRESHOLD = 50;
    uint256 public constant PLATINUM_THRESHOLD = 200;

    // ============ Events ============
    
    event AgentTradeValidated(
        address indexed agent,
        address indexed user,
        uint256 tradeSize,
        bool approved
    );
    
    event TierUpdated(
        address indexed user,
        Tier oldTier,
        Tier newTier
    );
    
    event TradeRecorded(
        address indexed user,
        uint256 amount,
        uint256 newTradeCount,
        uint256 newVolume
    );
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "UniPerkHook: not owner");
        _;
    }

    // ============ Constructor ============
    
    constructor(
        IPoolManager _poolManager,
        IAgentRegistry _agentRegistry
    ) BaseHook(_poolManager) {
        agentRegistry = _agentRegistry;
        owner = msg.sender;
        
        // Default fee discounts
        tierFeeDiscount[Tier.BRONZE] = 0;      // 0% discount
        tierFeeDiscount[Tier.SILVER] = 100;   // 1% discount
        tierFeeDiscount[Tier.GOLD] = 300;     // 3% discount
        tierFeeDiscount[Tier.PLATINUM] = 500; // 5% discount
    }

    // ============ Hook Permissions ============
    
    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    // ============ Hook Functions ============
    
    /// @notice Called before a swap - validates agent and applies fee discount
    function _beforeSwap(
        address sender,
        PoolKey calldata key,
        SwapParams calldata params,
        bytes calldata hookData
    ) internal override returns (bytes4, BeforeSwapDelta, uint24) {
        // Decode hookData to get agent info
        (address agent, address user) = _decodeHookData(hookData);
        
        // Calculate trade size (absolute value)
        uint256 tradeSize = params.amountSpecified < 0 
            ? uint256(-params.amountSpecified) 
            : uint256(params.amountSpecified);
        
        // Validate agent if present
        bool isAgentTrade = agent != address(0);
        if (isAgentTrade) {
            (bool valid, ) = agentRegistry.validateTrade(agent, tradeSize);
            require(valid, "Agent validation failed");
            
            emit AgentTradeValidated(agent, user, tradeSize, true);
        }
        
        // Get fee discount based on user tier
        address trader = isAgentTrade ? user : sender;
        uint24 discountBps = tierFeeDiscount[userTier[trader]];
        
        // Calculate the actual fee override
        // Pool's base fee is in key.fee (e.g., 3000 = 0.3%)
        // discountBps is the discount (e.g., 100 = 1% discount = 0.01%)
        // Final fee = baseFee - (baseFee * discountBps / 10000)
        uint24 baseFee = key.fee;
        uint24 feeOverride = baseFee;
        
        if (discountBps > 0 && baseFee > 0) {
            uint24 discountAmount = uint24((uint256(baseFee) * discountBps) / 10000);
            feeOverride = baseFee - discountAmount;
        }
        
        // Return with fee override (the actual fee to charge)
        return (
            BaseHook.beforeSwap.selector,
            BeforeSwapDeltaLibrary.ZERO_DELTA,
            feeOverride
        );
    }
    
    /// @notice Called after a swap - updates trade stats and tier
    function _afterSwap(
        address sender,
        PoolKey calldata,
        SwapParams calldata params,
        BalanceDelta,
        bytes calldata hookData
    ) internal override returns (bytes4, int128) {
        // Decode hookData
        (address agent, address user) = _decodeHookData(hookData);
        
        // Determine trader address
        address trader = agent != address(0) ? user : sender;
        
        // Calculate trade value
        uint256 tradeValue = params.amountSpecified < 0 
            ? uint256(-params.amountSpecified) 
            : uint256(params.amountSpecified);
        
        // Update stats
        tradeCount[trader]++;
        tradeVolume[trader] += tradeValue;
        
        emit TradeRecorded(trader, tradeValue, tradeCount[trader], tradeVolume[trader]);
        
        // Check for tier upgrade
        _updateTier(trader);
        
        return (BaseHook.afterSwap.selector, 0);
    }

    // ============ Admin Functions ============
    
    /// @notice Set fee discount for a tier
    function setTierFeeDiscount(Tier tier, uint24 discount) external onlyOwner {
        require(discount <= 1000, "Discount too high"); // Max 10%
        tierFeeDiscount[tier] = discount;
    }
    
    /// @notice Transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ============ Internal Functions ============
    
    /// @notice Decode hookData to extract agent and user addresses
    function _decodeHookData(bytes calldata hookData) internal pure returns (address agent, address user) {
        if (hookData.length == 0) {
            return (address(0), address(0));
        }
        (agent, user) = abi.decode(hookData, (address, address));
    }
    
    /// @notice Update user tier based on trade count
    function _updateTier(address user) internal {
        Tier currentTier = userTier[user];
        Tier newTier = currentTier;
        
        uint256 count = tradeCount[user];
        
        if (count >= PLATINUM_THRESHOLD) {
            newTier = Tier.PLATINUM;
        } else if (count >= GOLD_THRESHOLD) {
            newTier = Tier.GOLD;
        } else if (count >= SILVER_THRESHOLD) {
            newTier = Tier.SILVER;
        }
        
        if (newTier != currentTier) {
            userTier[user] = newTier;
            emit TierUpdated(user, currentTier, newTier);
        }
    }
}
