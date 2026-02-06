// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IAgentRegistry
/// @notice Interface for UniPerk Agent Registry
interface IAgentRegistry {
    struct Agent {
        address owner;
        string ensSubdomain;
        bool isActive;
        uint256 maxTradeSize;
        uint256 totalTrades;
        uint256 registeredAt;
    }

    function registerAgent(string calldata ensSubdomain, uint256 maxTradeSize) external returns (uint256);
    function deactivateAgent(uint256 agentId) external;
    function reactivateAgent(uint256 agentId) external;
    function updateMaxTradeSize(uint256 agentId, uint256 newMaxTradeSize) external;
    function validateTrade(address agent, uint256 tradeSize) external view returns (bool valid, string memory reason);
    function isAgentActive(address agent) external view returns (bool);
    function getAgent(uint256 agentId) external view returns (Agent memory);
    function getAgentByOwner(address owner) external view returns (Agent memory);
    function agentCount() external view returns (uint256);
}
