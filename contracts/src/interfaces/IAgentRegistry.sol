// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IAgentRegistry
/// @notice Interface for UniPerk Agent Registry
/// @dev Matches AgentRegistry.sol implementation
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
    /// @param agent Address of the agent wallet
    /// @param limit Maximum trade size per transaction
    /// @param ensName ENS subdomain (e.g., "alice.uniperk.eth")
    function registerAgent(
        address agent,
        uint256 limit,
        string calldata ensName
    ) external;
    
    /// @notice Revoke an agent's authorization
    /// @param agent Address of the agent to revoke
    function revokeAgent(address agent) external;
    
    /// @notice Update an agent's maximum trade limit
    /// @param agent Address of the agent
    /// @param newLimit New maximum trade size
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
    /// @return valid Whether the trade is valid
    /// @return reason Reason if invalid
    function validateTrade(
        address agent,
        uint256 tradeSize
    ) external view returns (bool valid, string memory reason);
    
    // ============ State Variables (view) ============
    
    function authorizedAgents(address agent) external view returns (bool);
    function maxTradeLimit(address agent) external view returns (uint256);
    function agentOwner(address agent) external view returns (address);
    function agentENSName(address agent) external view returns (string memory);
}
