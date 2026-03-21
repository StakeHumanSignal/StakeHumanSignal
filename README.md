# StakeHumanSignal

**Staked human feedback & policy for autonomous AI agents.**

Humans stake USDC on AI review quality. Autonomous agents pay via x402 to access ranked reviews. Winning reviewers earn Lido wstETH yield. Every outcome is recorded as an ERC-8004 receipt on-chain.

Built for [Synthesis Hackathon](https://synthesis.md) — March 2026.

**Live demo:** [stakehumansignal.vercel.app](https://stakehumansignal.vercel.app) | **API:** [stakesignal-api-production.up.railway.app](https://stakesignal-api-production.up.railway.app/reviews)

---

## What it does

1. **Human A** submits a structured review claim comparing two AI outputs. Stakes USDC. Review stored permanently on Filecoin.
2. **Buyer Agent** pays 0.001 USDC via x402 to access ranked reviews. Heuristic-scores each claim against task intent.
3. **ERC-8183 job** lifecycle: Open → Funded → Submitted → Completed. Independence check prevents self-review at contract level.
4. **Winning reviewer** earns Lido wstETH yield. ERC-8004 receipt minted. Human reputation score updated.
5. **Human B** submits outcome — validates or rejects Human A's prediction. Feeds back into yield weight.

## Architecture

```
Human A
  └── POST /reviews (staked claim + task_intent)
        └── Filecoin FOC storage → CID returned
              └── ERC-8183 Job created on Base Sepolia
                    └── Buyer Agent (pays x402)
                          └── Heuristic scorer (verdict)
                                └── Independence check
                                      ├── complete() → Lido yield hook
                                      │       └── wstETH yield to reviewer
                                      └── ERC-8004 receipt minted
                                              └── Human reputation updated
```

## Contracts (Base Sepolia Testnet)

| Contract | Address | Basescan |
|----------|---------|----------|
| StakeHumanSignalJob (ERC-8183) | `0xE99027DDdF153Ac6305950cD3D58C25D17E39902` | [View](https://sepolia.basescan.org/address/0xE99027DDdF153Ac6305950cD3D58C25D17E39902) |
| LidoTreasury | `0x8E29D161477D9BB00351eA2f69702451443d7bf5` | [View](https://sepolia.basescan.org/address/0x8E29D161477D9BB00351eA2f69702451443d7bf5) |
| ReceiptRegistry (ERC-8004) | `0xa39c7b475b0708a9854052Fb3Fbc93ccBf656332` | [View](https://sepolia.basescan.org/address/0xa39c7b475b0708a9854052Fb3Fbc93ccBf656332) |

## Prize tracks

| Track | Sponsor | Prize | Evidence |
|-------|---------|-------|----------|
| stETH Agent Treasury | Lido | $2,000 | LidoTreasury.sol, yield-only withdrawal enforced |
| Lido MCP Server | Lido | $3,000 | lido-mcp/ with 5 tools + dry_run + SKILL.md |
| Vault Monitor Alert Agent | Lido | $1,500 | lido-mcp/vault-monitor.js |
| Agents With Receipts ERC-8004 | Protocol Labs | $2,000 | docs/erc8004-proof.md, all 3 registries |
| Let the Agent Cook | Protocol Labs | $2,000 | buyer_agent.py autonomous loop, agent_log.json |
| Agent Services on Base | Base | $1,667 | x402 gate on /reviews/top, real payments |
| Agentic Storage | Filecoin | $1,000 | Every review has Filecoin CID |
| ERC-8183 Open Build | Virtuals | $2,000 | StakeHumanSignalJob.sol full lifecycle |
| Open Track | Synthesis | share | Full end-to-end working system |

## ERC standards implemented

- **ERC-8183** — Agentic Commerce: every review is a Job with Client/Provider/Evaluator lifecycle
- **ERC-8004** — Agent Identity & Receipts: 3 registries used (identity, reputation, validation)
- **ERC-7857** — Private AI Agent Metadata: co-authored by Ling Siew Win; used for structured claim metadata architecture

## Running locally

```bash
# Clone
git clone https://github.com/StakeHumanSignal/StakeHumanSignal
cd StakeHumanSignal
cp .env.example .env
# Fill .env with your Base Sepolia keys

# Contracts
bun install
npx hardhat test                              # 78 Solidity tests

# Backend
pip install -r requirements.txt
python -m pytest test/ -v                     # 50 Python tests
uvicorn api.main:app --port 8000

# Filecoin bridge (mock mode if no FILECOIN_PRIVATE_KEY)
cd filecoin-bridge && bun install && node index.js

# x402 gateway (real payments on Base Sepolia)
# First: get testnet USDC at https://faucet.circle.com
node x402-server.js

# Frontend
cd frontend && bun install && bun dev

# Run buyer agent (single cycle)
python -m api.agent.buyer_agent --once
```

## Project structure

```
contracts/                        # 3 Solidity contracts on Base
├── StakeHumanSignalJob.sol       # ERC-8183 jobs + independence check
├── LidoTreasury.sol              # wstETH yield-only treasury
└── ReceiptRegistry.sol           # ERC-8004 receipts + ownership + reputation

api/                              # Python FastAPI backend
├── routes/                       # reviews, jobs, outcomes, agent, leaderboard
├── services/                     # scorer, filecoin, web3, bankr
└── agent/                        # buyer_agent, verifier_agent

frontend/                         # Next.js 16 + Tailwind dark theme
├── src/app/                      # 5 pages: landing, marketplace, submit,
│                                 #   agent-feed, leaderboard
└── src/lib/api.ts                # API client

lido-mcp/                         # MCP server for Lido stETH operations
├── index.js                      # 5 tools: stake, yield, distribute, health, jobs
├── vault-monitor.js              # Continuous APY monitoring + alerts
└── SKILL.md                      # Agent-consumable skill file

filecoin-bridge/                  # Filecoin FOC + x402 gateway
├── index.js                      # Synapse SDK bridge (:3001)
└── x402-server.js                # Real x402 with public facilitator (:3002)

test/                             # 128 tests (78 Solidity + 50 Python)
```

## License

MIT
