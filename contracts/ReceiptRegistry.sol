// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ReceiptRegistry - ERC-8004 Agent Receipt NFTs
/// @notice Mints on-chain receipts for every completed review job.
/// @dev Each receipt is an ERC-721 NFT storing job outcome metadata.
///      ReentrancyGuard added because _mint triggers onERC721Received callback.
contract ReceiptRegistry is ERC721, Ownable, ReentrancyGuard {
    struct Receipt {
        uint256 jobId;
        address winner;
        string apiUrl;
        string outcome;
        string filecoinCID;
        uint256 timestamp;
    }

    uint256 public nextTokenId;
    mapping(uint256 => Receipt) public receipts;

    /// @notice Whitelisted minters (StakeHumanSignalJob contract, owner)
    mapping(address => bool) public minters;

    /// @notice Agent ownership: agent → owner (human wallet)
    mapping(address => address) public agentToOwner;
    /// @notice Owner → list of agents
    mapping(address => address[]) public ownerToAgents;

    /// @notice Win/job tracking for reputation
    mapping(address => uint256) public agentWins;
    mapping(address => uint256) public agentJobs;

    event ReceiptMinted(
        uint256 indexed tokenId,
        uint256 indexed jobId,
        address indexed winner,
        string filecoinCID
    );

    event MinterUpdated(address indexed addr, bool status);
    event AgentRegistered(address indexed agent, address indexed agentOwner);

    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "Not minter");
        _;
    }

    constructor() ERC721("StakeHumanSignal Receipt", "SHS-RECEIPT") Ownable(msg.sender) {}

    function setMinter(address addr, bool status) external onlyOwner {
        require(addr != address(0), "Cannot set zero address as minter");
        minters[addr] = status;
        emit MinterUpdated(addr, status);
    }

    /// @notice Register agent-to-owner relationship
    /// @dev Only the agent itself or contract owner can register
    function registerAgentOwnership(address agent, address agentOwner) external {
        require(
            msg.sender == agent || msg.sender == owner(),
            "Only agent or contract owner"
        );
        require(agent != address(0), "Agent cannot be zero address");
        require(agentOwner != address(0), "Owner cannot be zero address");

        // Remove from old owner's list if re-registering
        address oldOwner = agentToOwner[agent];
        if (oldOwner != address(0)) {
            _removeFromOwnerList(oldOwner, agent);
        }

        agentToOwner[agent] = agentOwner;
        ownerToAgents[agentOwner].push(agent);

        emit AgentRegistered(agent, agentOwner);
    }

    /// @notice Check independence between reviewer and agent owner
    /// @return 0 if related, 100 if completely unrelated
    function getIndependenceScore(
        address reviewer,
        address agentOwner
    ) public view returns (uint256) {
        if (reviewer == address(0) || agentOwner == address(0)) return 0;
        if (reviewer == agentOwner) return 0;
        if (agentToOwner[reviewer] == agentOwner) return 0;
        if (reviewer == agentToOwner[agentOwner]) return 0;
        return 100;
    }

    /// @notice Record a participation (job attempt) without a win
    function recordParticipation(address agent) external onlyMinter {
        require(agent != address(0), "Agent cannot be zero address");
        agentJobs[agent]++;
    }

    /// @notice Get human reputation score across all owned agents
    /// @return score Weighted average win rate (0-100), totalJobs across all agents
    function getHumanReputationScore(
        address humanWallet
    ) public view returns (uint256 score, uint256 totalJobs) {
        address[] memory agents = ownerToAgents[humanWallet];
        if (agents.length == 0) return (0, 0);

        uint256 totalScore;
        uint256 agentsWithJobs;

        for (uint256 i = 0; i < agents.length; i++) {
            uint256 jobs = agentJobs[agents[i]];
            if (jobs > 0) {
                totalScore += (agentWins[agents[i]] * 100) / jobs;
                totalJobs += jobs;
                agentsWithJobs++;
            }
        }

        if (agentsWithJobs > 0) {
            score = totalScore / agentsWithJobs;
        }
    }

    /// @notice Mint an ERC-8004 receipt for a completed job
    /// @dev nonReentrant because _mint triggers onERC721Received on recipient
    function mintReceipt(
        uint256 jobId,
        address winner,
        string calldata apiUrl,
        string calldata outcome,
        string calldata filecoinCID
    ) external onlyMinter nonReentrant returns (uint256 tokenId) {
        require(winner != address(0), "Winner cannot be zero address");
        require(bytes(apiUrl).length > 0, "API URL cannot be empty");

        tokenId = nextTokenId++;

        // Track wins and jobs
        agentWins[winner]++;
        agentJobs[winner]++;

        // Store receipt data before mint (checks-effects-interactions)
        receipts[tokenId] = Receipt({
            jobId: jobId,
            winner: winner,
            apiUrl: apiUrl,
            outcome: outcome,
            filecoinCID: filecoinCID,
            timestamp: block.timestamp
        });

        // Interaction last — _mint triggers onERC721Received callback
        _mint(winner, tokenId);

        emit ReceiptMinted(tokenId, jobId, winner, filecoinCID);
    }

    /// @notice Get receipt metadata
    function getReceipt(uint256 tokenId) external view returns (Receipt memory) {
        require(tokenId < nextTokenId, "Token does not exist");
        return receipts[tokenId];
    }

    /// @notice Total receipts minted
    function totalReceipts() external view returns (uint256) {
        return nextTokenId;
    }

    /// @dev Remove agent from owner's agent list
    function _removeFromOwnerList(address agentOwner, address agent) internal {
        address[] storage agents = ownerToAgents[agentOwner];
        for (uint256 i = 0; i < agents.length; i++) {
            if (agents[i] == agent) {
                agents[i] = agents[agents.length - 1];
                agents.pop();
                break;
            }
        }
    }

    /// @notice Get list of agents for an owner
    function getOwnerAgents(address agentOwner) external view returns (address[] memory) {
        return ownerToAgents[agentOwner];
    }
}
