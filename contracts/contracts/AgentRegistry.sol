// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title AgentRegistry
/// @notice On-chain registry for authorized trading agents
/// @dev Complements ENS text records with on-chain fallback for UniPerk
contract AgentRegistry is Ownable {
    
    // ============ State Variables ============
    
    /// @notice Whether an agent is authorized to trade
    mapping(address => bool) public authorizedAgents;
    
    /// @notice Maximum trade size per transaction (in wei)
    mapping(address => uint256) public maxTradeLimit;
    
    /// @notice Owner who registered this agent
    mapping(address => address) public agentOwner;
    
    /// @notice ENS name associated with agent (for cross-reference)
    mapping(address => string) public agentENSName;
    
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
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {}
    
    // ============ External Functions ============
    
    /// @notice Register a new trading agent
    /// @param agent Address of the agent wallet
    /// @param limit Maximum trade size per transaction
    /// @param ensName ENS subdomain (e.g., "alice.uniperk.eth")
    function registerAgent(
        address agent,
        uint256 limit,
        string calldata ensName
    ) external {
        require(agent != address(0), "Invalid agent address");
        require(!authorizedAgents[agent], "Agent already registered");
        require(limit > 0, "Limit must be positive");
        
        authorizedAgents[agent] = true;
        maxTradeLimit[agent] = limit;
        agentOwner[agent] = msg.sender;
        agentENSName[agent] = ensName;
        
        emit AgentRegistered(agent, msg.sender, limit, ensName);
    }
    
    /// @notice Revoke an agent's authorization
    /// @param agent Address of the agent to revoke
    function revokeAgent(address agent) external {
        require(
            msg.sender == agentOwner[agent] || msg.sender == owner(),
            "Not authorized to revoke"
        );
        require(authorizedAgents[agent], "Agent not registered");
        
        authorizedAgents[agent] = false;
        
        emit AgentRevoked(agent, msg.sender);
    }
    
    /// @notice Update an agent's maximum trade limit
    /// @param agent Address of the agent
    /// @param newLimit New maximum trade size
    function updateTradeLimit(
        address agent,
        uint256 newLimit
    ) external {
        require(
            msg.sender == agentOwner[agent],
            "Only owner can update limit"
        );
        require(authorizedAgents[agent], "Agent not registered");
        require(newLimit > 0, "Limit must be positive");
        
        uint256 oldLimit = maxTradeLimit[agent];
        maxTradeLimit[agent] = newLimit;
        
        emit TradeLimitUpdated(agent, oldLimit, newLimit);
    }
    
    // ============ View Functions ============
    
    /// @notice Check if an agent is authorized
    function isAuthorized(address agent) external view returns (bool) {
        return authorizedAgents[agent];
    }
    
    /// @notice Get agent's full info
    function getAgentInfo(address agent) external view returns (
        bool authorized,
        uint256 limit,
        address ownerAddr,
        string memory ensName
    ) {
        return (
            authorizedAgents[agent],
            maxTradeLimit[agent],
            agentOwner[agent],
            agentENSName[agent]
        );
    }
    
    /// @notice Validate a trade against agent limits
    /// @return valid Whether the trade is valid
    /// @return reason Reason if invalid
    function validateTrade(
        address agent,
        uint256 tradeSize
    ) external view returns (bool valid, string memory reason) {
        if (!authorizedAgents[agent]) {
            return (false, "Agent not authorized");
        }
        if (tradeSize > maxTradeLimit[agent]) {
            return (false, "Trade exceeds limit");
        }
        return (true, "");
    }
}
