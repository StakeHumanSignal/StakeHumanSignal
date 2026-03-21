# StakeHumanSignal Agent Interface

## What this agent does

StakeHumanSignal Buyer Agent is a fully autonomous agent that:
1. Queries staked human reviews via x402 payment (Base Sepolia)
2. Heuristic-scores each review against claim reasoning
3. Enforces independence check (ERC-8004 Registry 3)
4. Completes ERC-8183 jobs on-chain
5. Triggers Lido wstETH yield to winning reviewers
6. Mints ERC-8004 receipts for every verified outcome
7. Stores all outcomes on Filecoin FOC (mock mode)

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /reviews | none | Public list of all reviews |
| GET | /reviews/top | x402 0.001 USDC | Ranked reviews (via x402 gateway) |
| POST | /reviews | none | Submit a staked review claim |
| POST | /outcomes | none | Signal a job outcome |
| GET | /jobs/{id} | none | ERC-8183 job status |
| GET | /agent/log | none | Buyer agent decision log |
| GET | /leaderboard | none | Human reviewer reputation scores |
| GET | /health | none | API health check |

## x402 Payment

- Endpoint: GET /reviews/top
- Price: 0.001 USDC
- Network: base-sepolia
- Facilitator: https://x402.org/facilitator (public, no keys needed)

## On-chain (Base Sepolia)

- StakeHumanSignalJob: [`0xE99027DDdF153Ac6305950cD3D58C25D17E39902`](https://sepolia.basescan.org/address/0xE99027DDdF153Ac6305950cD3D58C25D17E39902) (ERC-8183)
- LidoTreasury: [`0x8E29D161477D9BB00351eA2f69702451443d7bf5`](https://sepolia.basescan.org/address/0x8E29D161477D9BB00351eA2f69702451443d7bf5) (yield-only)
- ReceiptRegistry: [`0xa39c7b475b0708a9854052Fb3Fbc93ccBf656332`](https://sepolia.basescan.org/address/0xa39c7b475b0708a9854052Fb3Fbc93ccBf656332) (ERC-8004)
- Agent ERC-8004 identity: [`0xcd3eb6...`](https://basescan.org/tx/0xcd3eb6582b19a2fad433a24396c0f55e78bf1ccdaea082ee9738fec26eacc1d0)

## ERC standards

- ERC-8183: Agentic Commerce (job lifecycle)
- ERC-8004: Agent Identity and Receipts (all 3 registries)
- ERC-7857: Private AI Agent Metadata

## Safety guardrails

- Rate limit: 3 jobs/minute max
- Independence check: self-review blocked at contract level
- Principal protection: enforced in LidoTreasury.sol
- Budget cap: buyer agent exits after --once flag
- Dry-run: add ?dryRun=true to Lido MCP tools

## Lido MCP Server

Located at lido-mcp/. Exposes 5 tools:
- `lido_stake(amount_usdc, wallet, dry_run)`
- `lido_get_yield_balance(wallet)`
- `lido_distribute_yield(winner_wallet, amount_wsteth, dry_run)`
- `lido_get_vault_health()`
- `lido_list_jobs(status)`

Skill file: lido-mcp/SKILL.md

## Running the buyer agent

Single cycle (for testing):
```
python -m api.agent.buyer_agent --once
```

Continuous (for judging period):
```
python -m api.agent.buyer_agent
```
