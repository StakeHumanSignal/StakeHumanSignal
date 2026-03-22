/**
 * Contract addresses and ABIs for Lido MCP server.
 *
 * Three networks supported:
 * - Ethereum mainnet: staking, governance, wrap/unwrap, withdrawals
 * - Holesky testnet: same operations for testing (no real ETH)
 * - Base Sepolia: StakeHumanSignal treasury + job contracts
 *
 * Source: https://docs.lido.fi/deployed-contracts
 */

// --- Ethereum Mainnet (staking + governance) ---
export const ETH_MAINNET = {
  stETH: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
  wstETH: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
  lidoDAO: "0x2e59A20f205bB85a89C53f1936454680651E618e", // Aragon Voting
  withdrawalQueue: "0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1",
  rpc: "https://ethereum-rpc.publicnode.com",
};

// --- Holesky Testnet (staking + governance testing) ---
export const ETH_HOLESKY = {
  stETH: "0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034",
  wstETH: "0x8d09a4502Cc8Cf1547aD300E066060D043f6982D",
  lidoDAO: "0xdA7d2573Df555002503F29aA4003e398d28cc00f", // Aragon Voting
  withdrawalQueue: "0xc7cc160b58F8Bb0baC94b80847E2CF2800565C50",
  rpc: "https://ethereum-holesky-rpc.publicnode.com",
};

// --- Base (wstETH balance reads) ---
export const BASE = {
  wstETH: "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452",
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
};

// --- StakeHumanSignal contracts (Base Sepolia) ---
export const CONTRACTS = {
  lidoTreasury: process.env.LIDO_TREASURY_ADDRESS || "0x8E29D161477D9BB00351eA2f69702451443d7bf5",
  stakeSignalJob: process.env.STAKE_SIGNAL_JOB_ADDRESS || "0xE99027DDdF153Ac6305950cD3D58C25D17E39902",
  receiptRegistry: process.env.RECEIPT_REGISTRY_ADDRESS || "0xa39c7b475b0708a9854052Fb3Fbc93ccBf656332",
};

// Minimal ABIs for the functions we call
export const LIDO_TREASURY_ABI = [
  "function totalPrincipal() view returns (uint256)",
  "function totalYieldDistributed() view returns (uint256)",
  "function availableYield() view returns (uint256)",
  "function totalBalance() view returns (uint256)",
  "function deposits(address) view returns (uint256)",
  "function depositPrincipal(uint256 amount) external",
  "function distributeYield(address winner, uint256 amount) external",
  "function receiveStake(address reviewer, uint256 usdcAmount) external",
];

export const STAKE_SIGNAL_JOB_ABI = [
  "function nextJobId() view returns (uint256)",
  "function getJob(uint256 jobId) view returns (address client, address provider, uint256 budget, uint8 status, bytes32 deliverableHash)",
  "function getJobSpec(uint256 jobId) view returns (string)",
  "function getJobCount() view returns (uint256)",
];

export const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

export const STETH_ABI = [
  "function submit(address referral) payable returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

export const WSTETH_ABI = [
  "function wrap(uint256 stETHAmount) returns (uint256)",
  "function unwrap(uint256 wstETHAmount) returns (uint256)",
  "function getStETHByWstETH(uint256 wstETHAmount) view returns (uint256)",
  "function getWstETHByStETH(uint256 stETHAmount) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];

export const LIDO_DAO_ABI = [
  "function vote(uint256 voteId, bool supports, bool executesIfDecided)",
  "function getVote(uint256 voteId) view returns (bool open, bool executed, uint64 startDate, uint64 snapshotBlock, uint64 supportRequired, uint64 minQuorum, uint256 yea, uint256 nay, uint256 votingPower, bytes script)",
  "function votesLength() view returns (uint256)",
];

export const WITHDRAWAL_QUEUE_ABI = [
  "function requestWithdrawals(uint256[] amounts, address owner) returns (uint256[] requestIds)",
  "function getWithdrawalStatus(uint256[] requestIds) view returns (tuple(uint256 amountOfStETH, uint256 amountOfShares, address owner, uint256 timestamp, bool isFinalized, bool isClaimed)[])",
  "function getLastFinalizedRequestId() view returns (uint256)",
];
