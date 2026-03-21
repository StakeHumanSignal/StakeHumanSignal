# StakeHumanSignal Agent Interface

## What this agent does
StakeHumanSignal Buyer Agent is a fully autonomous agent that:
1. Queries staked human reviews via x402 payment (0.001 USDC on Base)
2. Scores reviews with local heuristic scorer (5-dimension rubric: correctness, relevance, completeness, efficiency, reasoning_quality)
3. Enforces independence on-chain — blocks self-review via agent-owner mapping
4. Completes ERC-8183 jobs on-chain (Base Sepolia)
5. Mints ERC-8004 receipts with rubric scores and Filecoin CIDs
6. Tracks win/loss reputation per agent wallet
7. Stores all outcomes permanently on Filecoin FOC

## Endpoints
- GET  /reviews           — public review list (free)
- GET  /reviews/top       — ranked reviews (x402: 0.001 USDC on Base)
- POST /reviews           — submit a structured claim + stake proof
- POST /outcomes          — signal a winner (agent-only)
- GET  /jobs/{id}         — ERC-8183 job status
- GET  /health            — API health check

## On-chain (Base Sepolia)
- StakeHumanSignalJob: [`0x5298F4D8d8043C14e5F2683Ad642fEbC8B54638f`](https://sepolia.basescan.org/address/0x5298F4D8d8043C14e5F2683Ad642fEbC8B54638f) (ERC-8183)
- LidoTreasury: [`0xE78f6c235FD1686547DBea41F742D649607316B1`](https://sepolia.basescan.org/address/0xE78f6c235FD1686547DBea41F742D649607316B1) (yield-only)
- ReceiptRegistry: [`0xA471D2C45F03518E47c7Fc71C897d244dF01859D`](https://sepolia.basescan.org/address/0xA471D2C45F03518E47c7Fc71C897d244dF01859D) (ERC-8004)

## ERC-8004 Registries (3 uses)
1. **Identity** — Agent registered via Synthesis hackathon ([tx](https://basescan.org/tx/0xcd3eb6582b19a2fad433a24396c0f55e78bf1ccdaea082ee9738fec26eacc1d0))
2. **Reputation** — `agentWins`/`agentJobs` tracked per receipt mint, `getHumanReputationScore()` aggregates across agents
3. **Validation** — `getIndependenceScore()` called in `complete()` to block self-review

## ERC standards
- ERC-8183: Agentic Commerce (job lifecycle)
- ERC-8004: Agent Identity and Receipts (3 registries)

## Safety guardrails
- Independence check: evaluator must not be owned by job client
- Duplicate receipt guard: one receipt per job
- Rate limit: 3 jobs/minute max
- Dry-run: add ?dryRun=true to any endpoint
- Budget cap: max 0.01 ETH per session
- Principal protection: enforced by LidoTreasury contract (locked forever)
