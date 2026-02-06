// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IAgentRegistry
/// @notice Interface for the AgentRegistry contract
interface IAgentRegistry {
    
    // ============ Events ============
    
    event AgentRegistered(
        address indexed agent,
        address indexed owner,
        uint256 maxLimit,
        string ensName
    );
    
    event AgentRevoked(
        address indexed agent,
        address indexed revokedBy
    );
    
    event TradeLimitUpdated(
        address indexed agent,
        uint256 oldLimit,
        uint256 newLimit
    );
    
    // ============ External Functions ============
    
    /// @notice Register a new trading agent
    function registerAgent(
        address agent,
        uint256 limit,
        string calldata ensName
    ) external;
    
    /// @notice Revoke an agent's authorization
    function revokeAgent(address agent) external;
    
    /// @notice Update an agent's maximum trade limit
    function updateTradeLimit(address agent, uint256 newLimit) external;
    
    // ============ View Functions ============
    
    /// @notice Check if an agent is authorized
    function isAuthorized(address agent) external view returns (bool);
    
    /// @notice Get agent's full info
    function getAgentInfo(address agent) external view returns (
        bool authorized,
        uint256 limit,
        address ownerAddr,
        string memory ensName
    );
    
    /// @notice Validate a trade against agent limits
    function validateTrade(
        address agent,
        uint256 tradeSize
    ) external view returns (bool valid, string memory reason);
    
    /// @notice Get authorization status
    function authorizedAgents(address agent) external view returns (bool);
    
    /// @notice Get max trade limit
    function maxTradeLimit(address agent) external view returns (uint256);
    
    /// @notice Get agent owner
    function agentOwner(address agent) external view returns (address);
    
    /// @notice Get agent ENS name
    function agentENSName(address agent) external view returns (string memory);
}
