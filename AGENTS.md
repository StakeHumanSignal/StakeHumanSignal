# StakeHumanSignal Agent Interface

## What this agent does

StakeHumanSignal is a staked human feedback marketplace. The Buyer Agent autonomously:
1. Pays 0.001 USDC via x402 (real Coinbase SDK, EIP-3009) to access ranked reviews
2. Scores each review with 5-dimension rubric + Olas mech external intelligence
3. Enforces independence check (ERC-8004 on-chain — blocks self-review)
4. Completes ERC-8183 jobs on-chain
5. Mints ERC-8004 receipts (3 registries: identity, reputation, validation)
6. Distributes Lido wstETH yield to winning reviewers
7. Stores all outcomes on Filecoin Onchain Cloud (real Synapse SDK + Lighthouse)
8. Hires Olas mechs on Base mainnet for supplementary AI scoring

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /reviews | none | Public list of all reviews |
| GET | /reviews/top | x402 (0.001 USDC) | Ranked reviews — requires PAYMENT-SIGNATURE header |
| POST | /reviews | none | Submit a staked review claim |
| GET | /sessions | none | List blind A/B sessions |
| POST | /sessions/open | none | Create comparison session |
| POST | /sessions/{id}/settle | none | Human picks winner |
| POST | /sessions/passive | none | Record preference signal (no stake) |
| POST | /outcomes | none | Signal a job outcome |
| GET | /jobs/{id} | none | ERC-8183 job status |
| GET | /agent/log | none | Buyer agent decision log (264+ entries) |
| GET | /leaderboard | none | Reviewer reputation scores |
| GET | /health | none | `{"status":"ok","x402":"sdk"}` |

## x402 Payment

- Gate: `GET /reviews/top`
- SDK: `x402[fastapi]` v2.5.0 (official Coinbase Python SDK)
- Middleware: `PaymentMiddlewareASGI` in api/main.py
- Price: $0.001 USDC on Base Sepolia (eip155:84532)
- Facilitator: https://x402.org/facilitator
- Payment header: `PAYMENT-SIGNATURE` (EIP-3009 signed payload)

## MCP Servers

### Lido MCP (11 tools)
```json
{ "mcpServers": { "lido": { "command": "node", "args": ["lido-mcp/index.js"] } } }
```
Tools: `lido_stake_eth`, `lido_balance`, `lido_treasury_deposit`, `lido_get_yield_balance`, `lido_distribute_yield`, `lido_get_vault_health`, `lido_list_jobs`, `lido_unstake`, `lido_wrap`, `lido_unwrap`, `lido_vote`

Dual-provider: Ethereum mainnet (Lido contracts) + Base Sepolia (treasury)

### StakeSignal MCP (5 tools)
```json
{ "mcpServers": { "stakesignal": { "command": "node", "args": ["stakesignal-mcp/index.js"] } } }
```
Tools: `get_ranked_reviews`, `submit_passive_selection`, `stake_on_review`, `get_leaderboard`, `check_agent_decisions`

## On-chain (Base Sepolia)

| Contract | Address |
|----------|---------|
| StakeHumanSignalJob (ERC-8183) | [`0xE99027DDdF153Ac6305950cD3D58C25D17E39902`](https://sepolia.basescan.org/address/0xE99027DDdF153Ac6305950cD3D58C25D17E39902) |
| LidoTreasury (yield-only) | [`0x639bBbE3D9624b96a7b6aC9a0A95493642bf2b72`](https://sepolia.basescan.org/address/0x639bBbE3D9624b96a7b6aC9a0A95493642bf2b72) |
| ReceiptRegistry (ERC-8004) | [`0xa39c7b475b0708a9854052Fb3Fbc93ccBf656332`](https://sepolia.basescan.org/address/0xa39c7b475b0708a9854052Fb3Fbc93ccBf656332) |
| SessionEscrow | [`0xe817C338aD7612184CFB59AeA7962905b920e2e9`](https://sepolia.basescan.org/address/0xe817C338aD7612184CFB59AeA7962905b920e2e9) |

## ERC standards

- **ERC-8183** — Agentic Commerce (job lifecycle)
- **ERC-8004** — Agent Identity and Receipts (3 registries)
- **ERC-7857** — Private AI Agent Metadata

## Safety guardrails

- Independence check: self-review blocked at contract level (`getIndependenceScore`)
- Principal protection: wstETH locked forever in LidoTreasury
- sqrt staking: prevents plutocratic capture (`boost = sqrt(stake) * reputation`)
- Dry-run: all Lido MCP write tools default to `dry_run=true`
- Budget cap: buyer agent exits after `--once` flag

## Live

- Frontend: https://stakehumansignal.vercel.app
- API: https://stakesignal-api-production.up.railway.app
- Health: https://stakesignal-api-production.up.railway.app/health
- GitHub: https://github.com/StakeHumanSignal/StakeHumanSignal
