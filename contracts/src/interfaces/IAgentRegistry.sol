// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IAgentRegistry {
    event AgentRegistered(address indexed agent, address indexed owner, uint256 maxLimit, string ensName);
    event AgentRevoked(address indexed agent, address indexed revokedBy);
    event TradeLimitUpdated(address indexed agent, uint256 oldLimit, uint256 newLimit);

    function registerAgent(address agent, uint256 limit, string calldata ensName) external;
    function revokeAgent(address agent) external;
    function updateTradeLimit(address agent, uint256 newLimit) external;
    function isAuthorized(address agent) external view returns (bool);
    function getAgentInfo(address agent) external view returns (
        bool authorized,
        uint256 limit,
        address ownerAddr,
        string memory ensName
    );
    function validateTrade(address agent, uint256 tradeSize) external view returns (bool valid, string memory reason);
    function authorizedAgents(address agent) external view returns (bool);
    function maxTradeLimit(address agent) external view returns (uint256);
    function agentOwner(address agent) external view returns (address);
    function agentENSName(address agent) external view returns (string memory);
}
