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

contract UniPerkHook is BaseHook {
    using PoolIdLibrary for PoolKey;

    IAgentRegistry public immutable agentRegistry;
    address public owner;
    
    enum Tier { BRONZE, SILVER, GOLD, PLATINUM }
    
    mapping(Tier => uint24) public tierFeeDiscount;
    mapping(address => Tier) public userTier;
    mapping(address => uint256) public tradeCount;
    mapping(address => uint256) public tradeVolume;
    
    uint256 public constant SILVER_THRESHOLD = 10;
    uint256 public constant GOLD_THRESHOLD = 50;
    uint256 public constant PLATINUM_THRESHOLD = 200;

    event AgentTradeValidated(address indexed agent, address indexed user, uint256 tradeSize, bool approved);
    event TierUpdated(address indexed user, Tier oldTier, Tier newTier);
    event TradeRecorded(address indexed user, uint256 amount, uint256 newTradeCount, uint256 newVolume);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "UniPerkHook: not owner");
        _;
    }

    constructor(
        IPoolManager _poolManager,
        IAgentRegistry _agentRegistry
    ) BaseHook(_poolManager) {
        agentRegistry = _agentRegistry;
        owner = msg.sender;
        
        tierFeeDiscount[Tier.BRONZE] = 0;
        tierFeeDiscount[Tier.SILVER] = 100;
        tierFeeDiscount[Tier.GOLD] = 300;
        tierFeeDiscount[Tier.PLATINUM] = 500;
    }

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

    function _beforeSwap(
        address sender,
        PoolKey calldata key,
        SwapParams calldata params,
        bytes calldata hookData
    ) internal override returns (bytes4, BeforeSwapDelta, uint24) {
        (address agent, address user) = _decodeHookData(hookData);
        
        uint256 tradeSize = params.amountSpecified < 0 
            ? uint256(-params.amountSpecified) 
            : uint256(params.amountSpecified);
        
        bool isAgentTrade = agent != address(0);
        if (isAgentTrade) {
            (bool valid, ) = agentRegistry.validateTrade(agent, tradeSize);
            require(valid, "Agent validation failed");
            emit AgentTradeValidated(agent, user, tradeSize, true);
        }
        
        address trader = isAgentTrade ? user : sender;
        uint24 discountBps = tierFeeDiscount[userTier[trader]];
        
        uint24 baseFee = key.fee;
        uint24 feeOverride = baseFee;
        
        if (discountBps > 0 && baseFee > 0) {
            uint24 discountAmount = uint24((uint256(baseFee) * discountBps) / 10000);
            feeOverride = baseFee - discountAmount;
        }
        
        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, feeOverride);
    }
    
    function _afterSwap(
        address sender,
        PoolKey calldata,
        SwapParams calldata params,
        BalanceDelta,
        bytes calldata hookData
    ) internal override returns (bytes4, int128) {
        (address agent, address user) = _decodeHookData(hookData);
        address trader = agent != address(0) ? user : sender;
        
        uint256 tradeValue = params.amountSpecified < 0 
            ? uint256(-params.amountSpecified) 
            : uint256(params.amountSpecified);
        
        tradeCount[trader]++;
        tradeVolume[trader] += tradeValue;
        
        emit TradeRecorded(trader, tradeValue, tradeCount[trader], tradeVolume[trader]);
        _updateTier(trader);
        
        return (BaseHook.afterSwap.selector, 0);
    }

    function setTierFeeDiscount(Tier tier, uint24 discount) external onlyOwner {
        require(discount <= 1000, "Discount too high");
        tierFeeDiscount[tier] = discount;
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function _decodeHookData(bytes calldata hookData) internal pure returns (address agent, address user) {
        if (hookData.length == 0) {
            return (address(0), address(0));
        }
        (agent, user) = abi.decode(hookData, (address, address));
    }
    
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
