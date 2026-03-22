#!/usr/bin/env node
/**
 * Lido MCP Server — exposes Lido stETH yield treasury operations via MCP.
 *
 * Tools: stake, get_yield_balance, distribute_yield, get_vault_health, list_jobs
 * All write operations support dry_run=true for simulation.
 * Falls back to mock mode if RPC/contract addresses not configured.
 */

import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ethers } from "ethers";
import {
  CONTRACTS,
  LIDO_TREASURY_ABI,
  STAKE_SIGNAL_JOB_ABI,
  ERC20_ABI,
  WSTETH_ABI,
  LIDO_DAO_ABI,
  WITHDRAWAL_QUEUE_ABI,
} from "./contracts.js";

// --- Setup ---

const RPC_URL = process.env.BASE_RPC_URL || process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
const PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.BASE_SEPOLIA_PRIVATE_KEY;

let provider = null;
let signer = null;
let treasuryContract = null;
let jobContract = null;
let wstETH = null;
let wstETHContract = null;
let withdrawalQueueContract = null;
let lidoDAOContract = null;
let mockMode = true;

try {
  provider = new ethers.JsonRpcProvider(RPC_URL);

  if (PRIVATE_KEY) {
    signer = new ethers.Wallet(PRIVATE_KEY, provider);
  }

  if (CONTRACTS.lidoTreasury) {
    treasuryContract = new ethers.Contract(
      CONTRACTS.lidoTreasury,
      LIDO_TREASURY_ABI,
      signer || provider
    );
    mockMode = false;
  }

  if (CONTRACTS.stakeSignalJob) {
    jobContract = new ethers.Contract(
      CONTRACTS.stakeSignalJob,
      STAKE_SIGNAL_JOB_ABI,
      provider
    );
  }

  wstETH = new ethers.Contract(CONTRACTS.wstETH_base, ERC20_ABI, provider);

  // wstETH wrap/unwrap contract (mainnet)
  wstETHContract = new ethers.Contract(
    CONTRACTS.wstETH_mainnet,
    WSTETH_ABI,
    signer || provider
  );

  // Withdrawal queue contract (mainnet)
  withdrawalQueueContract = new ethers.Contract(
    CONTRACTS.withdrawalQueue_mainnet,
    WITHDRAWAL_QUEUE_ABI,
    signer || provider
  );

  // Lido DAO voting contract (mainnet)
  lidoDAOContract = new ethers.Contract(
    CONTRACTS.lidoDAO_mainnet,
    LIDO_DAO_ABI,
    signer || provider
  );
} catch (err) {
  console.error("[Lido MCP] Setup error:", err.message);
}

// --- Tool Definitions ---

const TOOLS = [
  {
    name: "lido_stake",
    description:
      "Stake USDC into the LidoTreasury contract. Principal is locked forever, only yield is distributable. Supports dry_run for simulation.",
    inputSchema: {
      type: "object",
      properties: {
        amount_usdc: { type: "number", description: "USDC amount to stake" },
        wallet: { type: "string", description: "Wallet address staking" },
        dry_run: {
          type: "boolean",
          description: "If true, simulate without sending tx",
          default: true,
        },
      },
      required: ["amount_usdc", "wallet"],
    },
  },
  {
    name: "lido_get_yield_balance",
    description:
      "Query wstETH yield balance for the LidoTreasury. Shows available yield, principal locked, and total balance.",
    inputSchema: {
      type: "object",
      properties: {
        wallet: {
          type: "string",
          description: "Wallet address to check deposits for (optional)",
        },
      },
    },
  },
  {
    name: "lido_distribute_yield",
    description:
      "Distribute wstETH yield to a winning reviewer. Only callable by whitelisted addresses. Supports dry_run.",
    inputSchema: {
      type: "object",
      properties: {
        winner_wallet: {
          type: "string",
          description: "Wallet of the winning reviewer",
        },
        amount_wsteth: {
          type: "string",
          description: "Amount of wstETH to distribute (in wei)",
        },
        dry_run: {
          type: "boolean",
          description: "If true, simulate without sending tx",
          default: true,
        },
      },
      required: ["winner_wallet", "amount_wsteth"],
    },
  },
  {
    name: "lido_get_vault_health",
    description:
      "Check Lido vault position health. Returns current APY estimate, principal, yield distributed, and alerts if yield is below benchmark.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "lido_list_jobs",
    description:
      "List ERC-8183 jobs from the StakeHumanSignalJob contract. Filter by status.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["open", "funded", "submitted", "completed", "rejected", "all"],
          description: "Filter by job status",
          default: "all",
        },
        limit: {
          type: "number",
          description: "Max jobs to return",
          default: 20,
        },
      },
    },
  },
  {
    name: "lido_unstake",
    description:
      "Request withdrawal of stETH. Creates a withdrawal NFT that can be claimed after the queue processes. Supports dry_run.",
    inputSchema: {
      type: "object",
      properties: {
        amount_steth: {
          type: "string",
          description: "Amount of stETH to withdraw (in wei)",
        },
        dry_run: {
          type: "boolean",
          description: "Simulate without sending tx",
          default: true,
        },
      },
      required: ["amount_steth"],
    },
  },
  {
    name: "lido_wrap",
    description:
      "Wrap stETH into wstETH. wstETH is the non-rebasing version suitable for DeFi and L2 bridges. Supports dry_run.",
    inputSchema: {
      type: "object",
      properties: {
        amount_steth: {
          type: "string",
          description: "Amount of stETH to wrap (in wei)",
        },
        dry_run: {
          type: "boolean",
          description: "Simulate without sending tx",
          default: true,
        },
      },
      required: ["amount_steth"],
    },
  },
  {
    name: "lido_unwrap",
    description:
      "Unwrap wstETH back to stETH. Converts non-rebasing wstETH to rebasing stETH. Supports dry_run.",
    inputSchema: {
      type: "object",
      properties: {
        amount_wsteth: {
          type: "string",
          description: "Amount of wstETH to unwrap (in wei)",
        },
        dry_run: {
          type: "boolean",
          description: "Simulate without sending tx",
          default: true,
        },
      },
      required: ["amount_wsteth"],
    },
  },
  {
    name: "lido_vote",
    description:
      "Vote on a Lido DAO governance proposal. Requires Ethereum mainnet connection. Supports dry_run.",
    inputSchema: {
      type: "object",
      properties: {
        vote_id: {
          type: "number",
          description: "Lido DAO proposal ID to vote on",
        },
        supports: {
          type: "boolean",
          description: "true = vote FOR, false = vote AGAINST",
        },
        dry_run: {
          type: "boolean",
          description: "Simulate without sending tx",
          default: true,
        },
      },
      required: ["vote_id", "supports"],
    },
  },
];

const STATUS_MAP = {
  0: "open",
  1: "funded",
  2: "submitted",
  3: "completed",
  4: "rejected",
};

// --- Tool Handlers ---

async function handleStake(args) {
  const { amount_usdc, wallet, dry_run = true } = args;

  if (mockMode) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              mode: "mock",
              tx_hash: null,
              amount_usdc,
              wallet,
              wsteth_estimated: (amount_usdc * 0.00035).toFixed(6),
              dry_run: true,
              note: "Mock mode — set LIDO_TREASURY_ADDRESS to use real contract",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (dry_run) {
    const principal = await treasuryContract.totalPrincipal();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              dry_run: true,
              amount_usdc,
              wallet,
              current_principal: ethers.formatUnits(principal, 18),
              estimated_wsteth: (amount_usdc * 0.00035).toFixed(6),
              note: "Simulation — no transaction sent. Set dry_run=false to execute.",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  // Real transaction
  const amount = ethers.parseUnits(amount_usdc.toString(), 18);
  const tx = await treasuryContract.depositPrincipal(amount);
  const receipt = await tx.wait();

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            dry_run: false,
            tx_hash: receipt.hash,
            amount_usdc,
            wallet,
            block: receipt.blockNumber,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleGetYieldBalance(args) {
  const { wallet } = args || {};

  if (mockMode) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              mode: "mock",
              yield_wsteth: "0.0",
              yield_usd_estimate: "$0.00",
              principal_locked: "0.0",
              total_balance: "0.0",
              wallet_deposits: wallet ? "0.0 USDC" : null,
              note: "Mock mode — set LIDO_TREASURY_ADDRESS for real data",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  const [principal, yieldAvailable, totalBalance, totalDistributed] =
    await Promise.all([
      treasuryContract.totalPrincipal(),
      treasuryContract.availableYield(),
      treasuryContract.totalBalance(),
      treasuryContract.totalYieldDistributed(),
    ]);

  let walletDeposits = null;
  if (wallet) {
    const deposits = await treasuryContract.deposits(wallet);
    walletDeposits = ethers.formatUnits(deposits, 6) + " USDC";
  }

  const yieldWsteth = ethers.formatUnits(yieldAvailable, 18);
  const principalStr = ethers.formatUnits(principal, 18);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            yield_wsteth: yieldWsteth,
            yield_usd_estimate: `$${(parseFloat(yieldWsteth) * 2800).toFixed(2)}`,
            principal_locked: principalStr,
            total_balance: ethers.formatUnits(totalBalance, 18),
            total_yield_distributed: ethers.formatUnits(totalDistributed, 18),
            wallet_deposits: walletDeposits,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleDistributeYield(args) {
  const { winner_wallet, amount_wsteth, dry_run = true } = args;

  if (mockMode) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              mode: "mock",
              tx_hash: null,
              amount_wsteth,
              recipient: winner_wallet,
              dry_run: true,
              note: "Mock mode — set LIDO_TREASURY_ADDRESS for real distribution",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (dry_run) {
    const yieldAvailable = await treasuryContract.availableYield();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              dry_run: true,
              amount_wsteth,
              recipient: winner_wallet,
              yield_available: ethers.formatUnits(yieldAvailable, 18),
              can_distribute:
                BigInt(amount_wsteth) <= BigInt(yieldAvailable.toString()),
              note: "Simulation — no transaction sent",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  const tx = await treasuryContract.distributeYield(
    winner_wallet,
    amount_wsteth
  );
  const receipt = await tx.wait();

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            dry_run: false,
            tx_hash: receipt.hash,
            amount_wsteth,
            recipient: winner_wallet,
            block: receipt.blockNumber,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleGetVaultHealth() {
  if (mockMode) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              mode: "mock",
              current_apy: "3.2%",
              benchmark_apy: "3.5%",
              below_benchmark: false,
              total_staked: "0.0 wstETH",
              total_yield_distributed: "0.0 wstETH",
              alert: null,
              note: "Mock mode — set LIDO_TREASURY_ADDRESS for real vault health",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  const [principal, yieldAvailable, totalDistributed] = await Promise.all([
    treasuryContract.totalPrincipal(),
    treasuryContract.availableYield(),
    treasuryContract.totalYieldDistributed(),
  ]);

  const principalFloat = parseFloat(ethers.formatUnits(principal, 18));
  const yieldFloat = parseFloat(ethers.formatUnits(yieldAvailable, 18));
  const distributedFloat = parseFloat(
    ethers.formatUnits(totalDistributed, 18)
  );

  // Estimate APY from yield accrued (rough — real APY needs time tracking)
  const currentApy = principalFloat > 0 ? (yieldFloat / principalFloat) * 100 : 0;
  const benchmarkApy = 3.5; // Lido historical average
  const belowBenchmark = currentApy < benchmarkApy;

  let alert = null;
  if (belowBenchmark && principalFloat > 0) {
    alert = `Yield ${currentApy.toFixed(1)}% below 7-day benchmark (${currentApy.toFixed(1)}% vs ${benchmarkApy}%)`;
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            current_apy: `${currentApy.toFixed(1)}%`,
            benchmark_apy: `${benchmarkApy}%`,
            below_benchmark: belowBenchmark,
            total_staked: `${principalFloat.toFixed(6)} wstETH`,
            total_yield_distributed: `${distributedFloat.toFixed(6)} wstETH`,
            yield_available: `${yieldFloat.toFixed(6)} wstETH`,
            alert,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleListJobs(args) {
  const { status = "all", limit = 20 } = args || {};

  if (mockMode || !jobContract) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              mode: "mock",
              jobs: [],
              total: 0,
              filter: status,
              note: "Mock mode — set STAKE_SIGNAL_JOB_ADDRESS for real jobs",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  const jobCount = await jobContract.getJobCount();
  const count = Number(jobCount);
  const jobs = [];

  for (let i = Math.max(0, count - limit); i < count; i++) {
    try {
      const [client, , budget, statusCode] = await jobContract.getJob(i);
      const jobStatus = STATUS_MAP[statusCode] || "unknown";

      if (status !== "all" && jobStatus !== status) continue;

      jobs.push({
        job_id: i,
        status: jobStatus,
        stake: ethers.formatUnits(budget, 6) + " USDC",
        reviewer: client,
      });
    } catch {
      // Skip invalid jobs
    }
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ jobs, total: jobs.length, filter: status }, null, 2),
      },
    ],
  };
}

async function handleUnstake(args) {
  const { amount_steth, dry_run = true } = args;

  if (mockMode) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              mode: "mock",
              tx_hash: null,
              amount_steth,
              request_ids: [42],
              estimated_wait: "1-5 days",
              dry_run: true,
              note: "Mock mode — set LIDO_TREASURY_ADDRESS to use real withdrawal queue",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (dry_run) {
    const stethFormatted = ethers.formatUnits(amount_steth, 18);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              dry_run: true,
              amount_steth: stethFormatted + " stETH",
              estimated_wait: "1-5 days",
              note: "Simulation — no transaction sent. Set dry_run=false to execute.",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  const signerAddress = await signer.getAddress();
  const tx = await withdrawalQueueContract.requestWithdrawals(
    [amount_steth],
    signerAddress
  );
  const receipt = await tx.wait();

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            dry_run: false,
            tx_hash: receipt.hash,
            amount_steth,
            block: receipt.blockNumber,
            note: "Withdrawal request submitted. Claim after queue processes.",
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleWrap(args) {
  const { amount_steth, dry_run = true } = args;

  if (mockMode) {
    // Estimate: wstETH ~ stETH * 0.87 (approximate rate)
    const stethFloat = parseFloat(ethers.formatUnits(amount_steth, 18));
    const estimatedWsteth = (stethFloat * 0.87).toFixed(6);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              mode: "mock",
              tx_hash: null,
              amount_steth,
              estimated_wsteth: estimatedWsteth,
              dry_run: true,
              note: "Mock mode — set LIDO_TREASURY_ADDRESS to use real wstETH contract",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (dry_run) {
    const estimatedWsteth = await wstETHContract.getWstETHByStETH(amount_steth);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              dry_run: true,
              amount_steth: ethers.formatUnits(amount_steth, 18) + " stETH",
              estimated_wsteth: ethers.formatUnits(estimatedWsteth, 18) + " wstETH",
              note: "Simulation — no transaction sent. Set dry_run=false to execute.",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  const tx = await wstETHContract.wrap(amount_steth);
  const receipt = await tx.wait();

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            dry_run: false,
            tx_hash: receipt.hash,
            amount_steth,
            block: receipt.blockNumber,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleUnwrap(args) {
  const { amount_wsteth, dry_run = true } = args;

  if (mockMode) {
    // Estimate: stETH ~ wstETH * 1.15 (approximate rate)
    const wstethFloat = parseFloat(ethers.formatUnits(amount_wsteth, 18));
    const estimatedSteth = (wstethFloat * 1.15).toFixed(6);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              mode: "mock",
              tx_hash: null,
              amount_wsteth,
              estimated_steth: estimatedSteth,
              dry_run: true,
              note: "Mock mode — set LIDO_TREASURY_ADDRESS to use real wstETH contract",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (dry_run) {
    const estimatedSteth = await wstETHContract.getStETHByWstETH(amount_wsteth);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              dry_run: true,
              amount_wsteth: ethers.formatUnits(amount_wsteth, 18) + " wstETH",
              estimated_steth: ethers.formatUnits(estimatedSteth, 18) + " stETH",
              note: "Simulation — no transaction sent. Set dry_run=false to execute.",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  const tx = await wstETHContract.unwrap(amount_wsteth);
  const receipt = await tx.wait();

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            dry_run: false,
            tx_hash: receipt.hash,
            amount_wsteth,
            block: receipt.blockNumber,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleVote(args) {
  const { vote_id, supports, dry_run = true } = args;

  if (mockMode) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              mode: "mock",
              tx_hash: null,
              vote_id,
              supports,
              vote_direction: supports ? "FOR" : "AGAINST",
              dry_run: true,
              note: "Mock mode — set LIDO_TREASURY_ADDRESS and Ethereum mainnet RPC to vote",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (dry_run) {
    try {
      const voteInfo = await lidoDAOContract.getVote(vote_id);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                dry_run: true,
                vote_id,
                supports,
                vote_direction: supports ? "FOR" : "AGAINST",
                proposal_open: voteInfo.open,
                proposal_executed: voteInfo.executed,
                current_yea: voteInfo.yea.toString(),
                current_nay: voteInfo.nay.toString(),
                note: "Simulation — no transaction sent. Set dry_run=false to execute.",
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                dry_run: true,
                vote_id,
                supports,
                vote_direction: supports ? "FOR" : "AGAINST",
                error: err.message,
                note: "Could not fetch vote info — ensure Ethereum mainnet RPC is configured.",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  const tx = await lidoDAOContract.vote(vote_id, supports, false);
  const receipt = await tx.wait();

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            dry_run: false,
            tx_hash: receipt.hash,
            vote_id,
            supports,
            vote_direction: supports ? "FOR" : "AGAINST",
            block: receipt.blockNumber,
          },
          null,
          2
        ),
      },
    ],
  };
}

// --- MCP Server ---

const server = new Server(
  { name: "lido-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "lido_stake":
      return handleStake(args);
    case "lido_get_yield_balance":
      return handleGetYieldBalance(args);
    case "lido_distribute_yield":
      return handleDistributeYield(args);
    case "lido_get_vault_health":
      return handleGetVaultHealth();
    case "lido_list_jobs":
      return handleListJobs(args);
    case "lido_unstake":
      return handleUnstake(args);
    case "lido_wrap":
      return handleWrap(args);
    case "lido_unwrap":
      return handleUnwrap(args);
    case "lido_vote":
      return handleVote(args);
    default:
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[Lido MCP] Server running (${mockMode ? "mock" : "live"} mode)`);
