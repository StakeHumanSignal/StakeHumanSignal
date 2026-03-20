# StakeHumanSignal Agent Interface

## What this agent does
StakeHumanSignal Buyer Agent is a fully autonomous agent that:
1. Queries staked human reviews via x402 payment (Base Mainnet, USDC)
2. Scores reviews privately using Venice LLM (no data leakage)
3. Completes ERC-8183 jobs on-chain (Base Mainnet)
4. Triggers Lido wstETH yield to winning reviewers via contract hook
5. Mints ERC-8004 receipts for every verified outcome
6. Stores all outcomes permanently on Filecoin FOC

## Endpoints
- GET  /reviews           — public review list (free)
- GET  /reviews/top       — ranked reviews (x402: 0.001 USDC on Base)
- POST /reviews           — submit a review + stake proof
- POST /outcomes          — signal a winner (agent-only)
- GET  /jobs/{id}         — ERC-8183 job status

## On-chain (Base Mainnet)
- StakeHumanSignalJob: FILL_AFTER_DEPLOY (ERC-8183)
- LidoTreasury:        FILL_AFTER_DEPLOY (yield-only)
- ReceiptRegistry:     FILL_AFTER_DEPLOY (ERC-8004)

## ERC standards
- ERC-8183: Agentic Commerce (job lifecycle)
- ERC-8004: Agent Identity and Receipts

## Safety guardrails
- Rate limit: 3 jobs/minute max
- Dry-run: add ?dryRun=true to any endpoint
- Budget cap: max 0.01 ETH per session
- Principal protection: enforced by LidoTreasury contract
