---
name: stakesignal-contracts
description: Four Solidity smart contracts on Base Sepolia implementing ERC-8183 job lifecycle, ERC-8004 agent receipts with 3 registries (identity, reputation, validation), wstETH yield-only treasury, and blind A/B session escrow.
---

# StakeHumanSignal Smart Contracts

## The Mental Model

These contracts form the on-chain backbone of a staked human feedback marketplace. Every off-chain review eventually becomes an on-chain receipt. Every stake is tracked. Every yield payout is enforced at the contract level.

### How They Connect

```
Human stakes USDC on review
  → StakeHumanSignalJob.createJob() — ERC-8183 job opens
  → Agent scores review
  → StakeHumanSignalJob.complete() — job completed
    → checks ReceiptRegistry.getIndependenceScore() — blocks self-review
    → ReceiptRegistry.mintReceipt() — ERC-8004 NFT minted with outcome
    → LidoTreasury.distributeYield() — wstETH sent to winner
```

### Key Design Decisions

**Independence check:** Before completing a job, the contract calls `ReceiptRegistry.getIndependenceScore(reviewer, agentOwner)`. If the reviewer owns the evaluating agent (self-review), it returns 0 and the job is rejected. This is enforced on-chain — no off-chain workaround possible.

**Yield-only treasury:** `LidoTreasury` holds wstETH. The `totalPrincipal` is locked forever — no withdraw function exists. Only the difference between current balance and principal (the yield from stETH rebasing) can be distributed. This means the yield pool grows but the principal never shrinks.

**Three registries in one contract:** `ReceiptRegistry` is an ERC-721 that also serves as:
- **Identity registry:** `agentToOwner(agent)` → maps agent wallet to human owner
- **Reputation registry:** `getHumanReputationScore(owner)` → avg win rate across all owned agents
- **Validation registry:** each NFT receipt stores jobId, winner, apiUrl, outcome, filecoinCID

## Contracts (Base Sepolia)

| Contract | Address | Standard |
|----------|---------|----------|
| StakeHumanSignalJob | `0xE99027DDdF153Ac6305950cD3D58C25D17E39902` | ERC-8183 |
| ReceiptRegistry | `0xa39c7b475b0708a9854052Fb3Fbc93ccBf656332` | ERC-8004 (ERC-721) |
| LidoTreasury | `0x639bBbE3D9624b96a7b6aC9a0A95493642bf2b72` | Custom (yield-only) |
| SessionEscrow | `0xe817C338aD7612184CFB59AeA7962905b920e2e9` | Custom (blind A/B) |

## For Agents: Reading Contract State

You don't need to send transactions to read useful data. These view calls are free:

```solidity
// How many jobs exist?
StakeHumanSignalJob.getJobCount() → uint256

// Get job details
StakeHumanSignalJob.getJob(jobId) → (client, provider, budget, status, deliverableHash)

// Check if reviewer is independent of agent owner
ReceiptRegistry.getIndependenceScore(reviewer, agentOwner) → uint256 (100 = independent, 0 = same owner)

// Get human reputation across all their agents
ReceiptRegistry.getHumanReputationScore(ownerAddress) → uint256 (0-100)

// How much yield is available?
LidoTreasury.availableYield() → uint256 (wstETH wei)

// Total principal locked
LidoTreasury.totalPrincipal() → uint256 (wstETH wei)
```

## ERC Standards

- **ERC-8183** — Agentic Commerce: standardized job lifecycle (Open → Funded → Submitted → Completed/Rejected)
- **ERC-8004** — Agent Identity & Receipts: on-chain proof that work happened, who did it, and what the outcome was
- **ERC-721** — Each receipt is a non-fungible token owned by the winner

## Security

- All contracts use OpenZeppelin `ReentrancyGuard` on state-changing functions
- All token transfers use `SafeERC20`
- No `tx.origin` usage — only `msg.sender`
- Checks-effects-interactions pattern throughout
- Independence check is on-chain and cannot be bypassed
