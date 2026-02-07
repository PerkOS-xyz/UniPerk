// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract AgentRegistry is Ownable {
    
    mapping(address => bool) public authorizedAgents;
    mapping(address => uint256) public maxTradeLimit;
    mapping(address => address) public agentOwner;
    mapping(address => string) public agentENSName;

    event AgentRegistered(address indexed agent, address indexed owner, uint256 maxLimit, string ensName);
    event AgentRevoked(address indexed agent, address indexed revokedBy);
    event TradeLimitUpdated(address indexed agent, uint256 oldLimit, uint256 newLimit);
    
    constructor() Ownable(msg.sender) {}
    
    function registerAgent(
        address agent,
        uint256 limit,
        string calldata ensName
    ) external onlyOwner {
        require(agent != address(0), "Invalid agent address");
        require(!authorizedAgents[agent], "Agent already registered");
        require(limit > 0, "Limit must be positive");
        
        authorizedAgents[agent] = true;
        maxTradeLimit[agent] = limit;
        agentOwner[agent] = msg.sender;
        agentENSName[agent] = ensName;
        
        emit AgentRegistered(agent, msg.sender, limit, ensName);
    }
    
    function revokeAgent(address agent) external {
        require(
            msg.sender == agentOwner[agent] || msg.sender == owner(),
            "Not authorized to revoke"
        );
        require(authorizedAgents[agent], "Agent not registered");
        
        authorizedAgents[agent] = false;
        emit AgentRevoked(agent, msg.sender);
    }
    
    function updateTradeLimit(address agent, uint256 newLimit) external {
        require(msg.sender == agentOwner[agent], "Only owner can update limit");
        require(authorizedAgents[agent], "Agent not registered");
        require(newLimit > 0, "Limit must be positive");
        
        uint256 oldLimit = maxTradeLimit[agent];
        maxTradeLimit[agent] = newLimit;
        
        emit TradeLimitUpdated(agent, oldLimit, newLimit);
    }
    
    function isAuthorized(address agent) external view returns (bool) {
        return authorizedAgents[agent];
    }
    
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
