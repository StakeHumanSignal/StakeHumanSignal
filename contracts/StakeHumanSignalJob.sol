// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IERC8183.sol";

/// @title StakeHumanSignalJob - ERC-8183 Agentic Commerce for staked reviews
/// @notice Humans stake USDC on review quality. Buyer agents evaluate and complete jobs.
/// @dev Implements ERC-8183 job lifecycle with Lido yield distribution hooks.
contract StakeHumanSignalJob is IERC8183, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Job {
        address client;      // Human reviewer who created the job
        address provider;    // API being reviewed
        uint256 budget;      // USDC staked
        JobStatus status;
        bytes32 deliverableHash;
        string spec;         // apiUrl + reviewHash
        uint256 createdAt;
    }

    IERC20 public immutable usdc;
    address public lidoTreasury;
    address public receiptRegistry;
    address public evaluator; // Buyer agent address

    uint256 public nextJobId;
    mapping(uint256 => Job) public jobs;

    modifier onlyEvaluator() {
        require(msg.sender == evaluator, "Only evaluator");
        _;
    }

    constructor(
        address _usdc,
        address _evaluator
    ) Ownable(msg.sender) {
        require(_usdc != address(0), "USDC address cannot be zero");
        require(_evaluator != address(0), "Evaluator address cannot be zero");
        usdc = IERC20(_usdc);
        evaluator = _evaluator;
    }

    function setLidoTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Treasury address cannot be zero");
        lidoTreasury = _treasury;
    }

    function setReceiptRegistry(address _registry) external onlyOwner {
        require(_registry != address(0), "Registry address cannot be zero");
        receiptRegistry = _registry;
    }

    function setEvaluator(address _evaluator) external onlyOwner {
        require(_evaluator != address(0), "Evaluator address cannot be zero");
        evaluator = _evaluator;
    }

    /// @notice Human reviewer creates a job by specifying the API to review
    function createJob(string calldata spec) external returns (uint256 jobId) {
        require(bytes(spec).length > 0, "Spec cannot be empty");

        jobId = nextJobId++;
        jobs[jobId] = Job({
            client: msg.sender,
            provider: address(0),
            budget: 0,
            status: JobStatus.Open,
            deliverableHash: bytes32(0),
            spec: spec,
            createdAt: block.timestamp
        });
        emit JobCreated(jobId, msg.sender, spec);
    }

    /// @notice Human reviewer stakes USDC to fund their job
    /// @dev Checks-effects-interactions: state updated before external calls
    function fund(uint256 jobId, uint256 amount) external nonReentrant {
        Job storage job = jobs[jobId];
        require(job.client == msg.sender, "Not job client");
        require(job.status == JobStatus.Open, "Job not open");
        require(amount > 0, "Amount must be greater than zero");

        // Effects first (checks-effects-interactions)
        job.budget += amount;
        job.status = JobStatus.Funded;

        // Interactions last
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        // Forward stake to Lido Treasury for yield generation
        if (lidoTreasury != address(0)) {
            usdc.safeTransfer(lidoTreasury, amount);
        }

        emit JobFunded(jobId, amount);
    }

    /// @notice Human reviewer submits their review deliverable
    function submit(uint256 jobId, bytes32 deliverableHash) external {
        require(deliverableHash != bytes32(0), "Deliverable hash cannot be zero");
        Job storage job = jobs[jobId];
        require(job.client == msg.sender, "Not job client");
        require(job.status == JobStatus.Funded, "Job not funded");

        job.deliverableHash = deliverableHash;
        job.status = JobStatus.Submitted;

        emit JobSubmitted(jobId, deliverableHash);
    }

    /// @notice Buyer agent completes the job — triggers yield distribution
    function complete(uint256 jobId) external onlyEvaluator nonReentrant {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Submitted, "Job not submitted");

        job.status = JobStatus.Completed;

        emit JobCompleted(jobId, msg.sender);
    }

    /// @notice Buyer agent rejects the job — reviewer loses stake
    function reject(uint256 jobId) external onlyEvaluator nonReentrant {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Submitted, "Job not submitted");

        job.status = JobStatus.Rejected;

        emit JobRejected(jobId, msg.sender);
    }

    function getJob(uint256 jobId) external view returns (
        address client,
        address provider,
        uint256 budget,
        JobStatus status,
        bytes32 deliverableHash
    ) {
        Job storage job = jobs[jobId];
        return (job.client, job.provider, job.budget, job.status, job.deliverableHash);
    }

    function getJobSpec(uint256 jobId) external view returns (string memory) {
        return jobs[jobId].spec;
    }

    function getJobCount() external view returns (uint256) {
        return nextJobId;
    }
}
