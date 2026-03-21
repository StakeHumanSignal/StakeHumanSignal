// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SessionEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    address public immutable receiptRegistry;

    enum SessionStatus { Open, Generated, Settled, Refunded }

    struct Session {
        uint256 id;
        address buyer;
        bytes32 claimId;
        bytes32 promptHash;
        bytes32 outputHashA;
        bytes32 outputHashB;
        uint256 rewardUsdc;
        address reviewer;
        SessionStatus status;
        uint8 winner;
        uint64 createdAt;
        uint64 expiresAt;
    }

    uint256 public nextSessionId;
    mapping(uint256 => Session) public sessions;

    uint256 public protocolFeeBps = 1000;
    address public feeRecipient;

    event SessionOpened(uint256 indexed sessionId, address indexed buyer, bytes32 claimId, uint256 reward);
    event OutputsRecorded(uint256 indexed sessionId, bytes32 outputHashA, bytes32 outputHashB);
    event SessionSettled(uint256 indexed sessionId, address indexed winner, uint256 payout, uint8 winnerSide);
    event SessionRefunded(uint256 indexed sessionId);

    constructor(address _usdc, address _receiptRegistry, address _feeRecipient) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC");
        require(_receiptRegistry != address(0), "Invalid registry");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        usdc = IERC20(_usdc);
        receiptRegistry = _receiptRegistry;
        feeRecipient = _feeRecipient;
    }

    function openSession(bytes32 claimId, address reviewer, uint256 rewardUsdc, bytes32 promptHash) external nonReentrant returns (uint256 sessionId) {
        require(rewardUsdc > 0, "Reward required");
        require(reviewer != address(0), "Invalid reviewer");

        usdc.safeTransferFrom(msg.sender, address(this), rewardUsdc);

        sessionId = nextSessionId++;
        sessions[sessionId] = Session({
            id: sessionId,
            buyer: msg.sender,
            claimId: claimId,
            promptHash: promptHash,
            outputHashA: bytes32(0),
            outputHashB: bytes32(0),
            rewardUsdc: rewardUsdc,
            reviewer: reviewer,
            status: SessionStatus.Open,
            winner: 0,
            createdAt: uint64(block.timestamp),
            expiresAt: uint64(block.timestamp + 7 days)
        });

        emit SessionOpened(sessionId, msg.sender, claimId, rewardUsdc);
    }

    function recordOutputs(uint256 sessionId, bytes32 outputHashA, bytes32 outputHashB) external onlyOwner {
        Session storage s = sessions[sessionId];
        require(s.status == SessionStatus.Open, "Not open");
        s.outputHashA = outputHashA;
        s.outputHashB = outputHashB;
        s.status = SessionStatus.Generated;
        emit OutputsRecorded(sessionId, outputHashA, outputHashB);
    }

    function settle(uint256 sessionId, uint8 winner) external nonReentrant onlyOwner {
        Session storage s = sessions[sessionId];
        require(s.status == SessionStatus.Generated, "Not generated");
        require(winner == 1 || winner == 2, "Invalid winner");

        s.winner = winner;
        s.status = SessionStatus.Settled;

        uint256 fee = (s.rewardUsdc * protocolFeeBps) / 10000;
        uint256 payout = s.rewardUsdc - fee;

        if (winner == 1) {
            usdc.safeTransfer(s.reviewer, payout);
            usdc.safeTransfer(feeRecipient, fee);
        } else {
            usdc.safeTransfer(s.buyer, s.rewardUsdc);
        }

        emit SessionSettled(sessionId, winner == 1 ? s.reviewer : s.buyer, payout, winner);
    }

    function refundExpired(uint256 sessionId) external nonReentrant {
        Session storage s = sessions[sessionId];
        require(block.timestamp > s.expiresAt, "Not expired");
        require(s.status == SessionStatus.Open || s.status == SessionStatus.Generated, "Not refundable");
        s.status = SessionStatus.Refunded;
        usdc.safeTransfer(s.buyer, s.rewardUsdc);
        emit SessionRefunded(sessionId);
    }

    function getSession(uint256 sessionId) external view returns (Session memory) {
        return sessions[sessionId];
    }

    function setProtocolFee(uint256 bps) external onlyOwner {
        require(bps <= 2000, "Max 20%");
        protocolFeeBps = bps;
    }
}
