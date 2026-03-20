// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IERC8183 - Agentic Commerce Interface
/// @notice Defines the job lifecycle for human-agent commerce
interface IERC8183 {
    enum JobStatus { Open, Funded, Submitted, Completed, Rejected }

    event JobCreated(uint256 indexed jobId, address indexed client, string spec);
    event JobFunded(uint256 indexed jobId, uint256 amount);
    event JobSubmitted(uint256 indexed jobId, bytes32 deliverableHash);
    event JobCompleted(uint256 indexed jobId, address indexed evaluator);
    event JobRejected(uint256 indexed jobId, address indexed evaluator);

    function createJob(string calldata spec) external returns (uint256 jobId);
    function fund(uint256 jobId, uint256 amount) external;
    function submit(uint256 jobId, bytes32 deliverableHash) external;
    function complete(uint256 jobId) external;
    function reject(uint256 jobId) external;
    function getJob(uint256 jobId) external view returns (
        address client,
        address provider,
        uint256 budget,
        JobStatus status,
        bytes32 deliverableHash
    );
}
