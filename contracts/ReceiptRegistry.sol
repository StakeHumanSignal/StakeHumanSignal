// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ReceiptRegistry - ERC-8004 Agent Receipt NFTs
/// @notice Mints on-chain receipts for every completed review job.
/// @dev Each receipt is an ERC-721 NFT storing job outcome metadata.
contract ReceiptRegistry is ERC721, Ownable {
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

    event ReceiptMinted(
        uint256 indexed tokenId,
        uint256 indexed jobId,
        address indexed winner,
        string filecoinCID
    );

    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "Not minter");
        _;
    }

    constructor() ERC721("StakeHumanSignal Receipt", "SHS-RECEIPT") Ownable(msg.sender) {}

    function setMinter(address addr, bool status) external onlyOwner {
        minters[addr] = status;
    }

    /// @notice Mint an ERC-8004 receipt for a completed job
    function mintReceipt(
        uint256 jobId,
        address winner,
        string calldata apiUrl,
        string calldata outcome,
        string calldata filecoinCID
    ) external onlyMinter returns (uint256 tokenId) {
        tokenId = nextTokenId++;
        _mint(winner, tokenId);

        receipts[tokenId] = Receipt({
            jobId: jobId,
            winner: winner,
            apiUrl: apiUrl,
            outcome: outcome,
            filecoinCID: filecoinCID,
            timestamp: block.timestamp
        });

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
}
