# StakeHumanSignal

**A staked human feedback/policy marketplace where humans bet real money on AI evaluation quality, agents pay to access trusted verdicts, and winners earn yield.**

**Live:** [stakehumansignal.vercel.app](https://stakehumansignal.vercel.app) | **API:** [stakesignal-api-production.up.railway.app](https://stakesignal-api-production.up.railway.app/health) | **GitHub:** [StakeHumanSignal/StakeHumanSignal](https://github.com/StakeHumanSignal/StakeHumanSignal)

Built for [Synthesis Hackathon](https://synthesis.md) — March 2026.

---
## Problem

AI agents can already call models, APIs, and tools.  
The harder problem is deciding **which policy will work best for a specific user, task, and constraint**.

That problem is still unsolved because:

- **Performance is context-dependent.**  
  The same API, model, or prompt bundle can perform very differently depending on user intent, task type, quality requirements, latency/cost constraints, and output preferences.

- **Existing signals are either too weak or too expensive.**  
  Passive signals like clicks or usage scale well, but they do not reliably tell an agent which policy was actually better in context.  
  Stronger signals like structured reviews, expert evals, and staking are useful, but too high-friction to require from every user.

- **Good judgment does not compound.**  
  Valuable human preference is constantly produced in real usage, but it usually disappears inside one-off sessions, private workflows, or unstructured feedback. Other agents cannot reuse it.

As a result, every agent keeps re-learning the same routing decisions from scratch, wasting money and producing worse outputs.

## Solution

StakeHumanSignal turns human preference into a reusable policy-ranking layer for AI agents.

Humans compare two AI outputs side by side, pick the winner, and optionally stake real USDC on their choice. AI buyer agents pay via x402 micropayments to access these ranked, staked verdicts — because skin in the game means signal they can trust. Winners earn Lido wstETH yield. Every outcome is permanently recorded as an ERC-8004 receipt on Base and stored on Filecoin Onchain Cloud.

- **Policy creators stake policies in advance.**  
  A policy is the execution logic behind an output — for example an API, model, prompt, tool, or bundle of these choices.

- **Buyer agents retrieve relevant policies and generate competing outputs.**  
  Human B simply chooses the better result in their own context. No staking is required at this stage.

- **The winning policy is rewarded.**  
  If Human B prefers the output generated under Human A’s policy, Human A earns higher yield.

- **High-conviction users can add stronger validation.**  
  If Human B believes the winning policy will also help others with similar intent, they can optionally inspect it, attach context, and stake on it themselves.

This creates a two-layer system:

- **Passive selection layer:** users pick the better output in a blind A/B comparison. No stake required. 0.3x yield multiplier. Low barrier for adoption.
- **Active validation layer:** high-conviction users stake USDC with reasoning. 0.7x weight, sqrt-scaled to prevent whale farming. Durable signal for agents.

Over time, this builds a policy ranking layer that agents can use to make better decisions about which policy to run for which user and task.


## What's Built and Deployed

| Layer | Implementation | Status |
|-------|---------------|--------|
| Policy staking | `StakeHumanSignalJob.sol` — ERC-8183 job lifecycle | Deployed on Base Sepolia |
| Blind A/B compare | `SessionEscrow.sol` + `/validate` page | Deployed |
| Passive selection | `POST /sessions/{id}/settle` | Live on Railway |
| Active staking | `POST /reviews` with stake + reasoning | Live — stored on Filecoin |
| x402 payment gate | 402 challenge on `/reviews/top` (0.001 USDC) | Live |
| On-chain receipts | `ReceiptRegistry.sol` — ERC-8004, 3 registries | Deployed |
| Yield distribution | `LidoTreasury.sol` — wstETH principal locked, yield-only | Deployed + TX proven |
| Filecoin storage | `filecoin-bridge/` — Filecoin Onchain Cloud (Synapse SDK) + Lighthouse | Real PieceCID + real Qm CIDs |
| Autonomous agent | `buyer_agent.py` — fetch → score → independence check → complete → mint | 131+ log entries |
| Lido MCP | `lido-mcp/` — 11 tools, real Ethereum mainnet reads | 11/11 live test passing |
| StakeSignal MCP | `stakesignal-mcp/` — 5 tools, real API calls | 5/5 live test passing |
| Frontend | 7-page Next.js dashboard | [Live](https://stakehumansignal.vercel.app) |

---

## How It Works

```mermaid
graph TD
    A[Human A connects wallet] --> B[Submit structured review claim]
    B --> C[Stored on Filecoin — CID returned]
    C --> D[ERC-8183 job opens on Base]
    D --> E[Buyer Agent pays x402]
    E --> F[Heuristic scorer — task match x evidence x wins]
    F --> G{Independence check}
    G -->|pass| H[complete — ERC-8004 receipt minted]
    G -->|fail| I[rejected — self-review blocked]
    H --> J[Lido yield paid — wstETH to winner]
    H --> K[Human B blind A/B compare]
    K --> K1{Selection type}
    K1 -->|passive| K2[No stake — 0.3x yield multiplier]
    K1 -->|active| K3[Stake USDC — 0.7x sqrt-scaled]
    K2 --> L[Reputation updated — score recalculated]
    K3 --> L
    K -->|rejects| M[Claim flagged — yield reduced]
    J --> L

    style A fill:#1a1a2e,stroke:#8ff5ff,color:#fff
    style B fill:#1a1a2e,stroke:#8ff5ff,color:#fff
    style C fill:#1a1a2e,stroke:#8ff5ff,color:#fff
    style D fill:#1a1a2e,stroke:#8ff5ff,color:#fff
    style E fill:#1a1a2e,stroke:#ac89ff,color:#fff
    style F fill:#1a1a2e,stroke:#ac89ff,color:#fff
    style G fill:#1a1a2e,stroke:#ac89ff,color:#fff
    style H fill:#1a1a2e,stroke:#8ff5ff,color:#fff
    style I fill:#1a1a2e,stroke:#666,color:#999
    style J fill:#1a1a2e,stroke:#8ff5ff,color:#fff
    style K fill:#1a1a2e,stroke:#8ff5ff,color:#fff
    style K1 fill:#1a1a2e,stroke:#ac89ff,color:#fff
    style K2 fill:#1a1a2e,stroke:#8ff5ff,color:#fff
    style K3 fill:#1a1a2e,stroke:#8ff5ff,color:#fff
    style L fill:#1a1a2e,stroke:#8ff5ff,color:#fff
    style M fill:#1a1a2e,stroke:#666,color:#999
```

## For Judges — Track Navigation

| Track | Sponsor | Start Here |
|-------|---------|------------|
| ERC-8183 Open Build | Virtuals | [`contracts/`](contracts/) — `StakeHumanSignalJob.sol` |
| Agents With Receipts (ERC-8004) | Protocol Labs | [`contracts/`](contracts/) — `ReceiptRegistry.sol` (3 registries) |
| stETH Agent Treasury | Lido | [`contracts/`](contracts/) — `LidoTreasury.sol` + [`lido-mcp/`](lido-mcp/) |
| Lido MCP Server | Lido | [`lido-mcp/`](lido-mcp/) — 11 tools, real Ethereum mainnet |
| Mechanism Design | Octant | [`api/`](api/) — conviction-weighted staking + scorer |
| Data Collection | Octant | [`api/`](api/) — autonomous review collection + Filecoin |
| Agentic Storage | Filecoin | [`filecoin-bridge/`](filecoin-bridge/) — FOC Synapse SDK |
| Open Track | Synthesis | Full repo — [`frontend/`](frontend/) |

Each folder has a `README.md` and a `*.skill.md` for agent consumption.

---

## Contracts (Base Sepolia)

| Contract | Address | Basescan |
|----------|---------|----------|
| StakeHumanSignalJob (ERC-8183) | `0xE99027DDdF153Ac6305950cD3D58C25D17E39902` | [View](https://sepolia.basescan.org/address/0xE99027DDdF153Ac6305950cD3D58C25D17E39902) |
| LidoTreasury (yield-only) | `0x639bBbE3D9624b96a7b6aC9a0A95493642bf2b72` | [View](https://sepolia.basescan.org/address/0x639bBbE3D9624b96a7b6aC9a0A95493642bf2b72) |
| ReceiptRegistry (ERC-8004) | `0xa39c7b475b0708a9854052Fb3Fbc93ccBf656332` | [View](https://sepolia.basescan.org/address/0xa39c7b475b0708a9854052Fb3Fbc93ccBf656332) |
| SessionEscrow | `0xe817C338aD7612184CFB59AeA7962905b920e2e9` | [View](https://sepolia.basescan.org/address/0xe817C338aD7612184CFB59AeA7962905b920e2e9) |

**ERC standards:** ERC-8183 (Agentic Commerce), ERC-8004 (Agent Identity & Receipts), ERC-7857 (Private AI Agent Metadata)

## Use From Your Agent

**Via MCP** — install the skill file and connect:

```json
{
  "mcpServers": {
    "stakesignal": {
      "command": "node",
      "args": ["stakesignal-mcp/index.js"]
    },
    "lido": {
      "command": "node",
      "args": ["lido-mcp/index.js"]
    }
  }
}
```

**Via REST** — call the API directly:

```bash
# Ranked reviews (x402 gated)
curl -H "x-402-payment: agent" https://stakesignal-api-production.up.railway.app/reviews/top

# All reviews (public)
curl https://stakesignal-api-production.up.railway.app/reviews

# Leaderboard
curl https://stakesignal-api-production.up.railway.app/leaderboard
```

Skill files with full agent mental models: [`stakesignal-mcp/stakesignal.skill.md`](stakesignal-mcp/stakesignal.skill.md) | [`lido-mcp/lido.skill.md`](lido-mcp/lido.skill.md) | [`contracts/contracts.skill.md`](contracts/contracts.skill.md)

## Running Locally

```bash
git clone https://github.com/StakeHumanSignal/StakeHumanSignal
cd StakeHumanSignal && cp .env.example .env

bun install && pip install -r requirements.txt
npx hardhat test                         # 91 Solidity tests
python -m pytest test/ -v                # 71 Python tests
cd frontend && bun install && bun run test  # 5 nav tests

# Start services
uvicorn api.main:app --port 8000         # API
cd filecoin-bridge && node index.js      # FOC bridge
cd lido-mcp && node index.js             # Lido MCP (11 tools)
cd frontend && bun dev                   # Frontend

# Run buyer agent
python -m api.agent.buyer_agent --once

# Live integration tests
cd lido-mcp && node live-test.js         # 11/11 tools
cd stakesignal-mcp && node live-test.js  # 5/5 tools
```

## Project Structure

```
contracts/          4 Solidity contracts on Base Sepolia
├── StakeHumanSignalJob.sol    ERC-8183 jobs + independence check
├── LidoTreasury.sol           wstETH yield-only treasury
├── ReceiptRegistry.sol        ERC-8004 receipts + 3 registries
├── SessionEscrow.sol          Blind A/B compare escrow
└── contracts.skill.md         Agent skill file

api/                Python FastAPI backend
├── routes/         reviews, jobs, outcomes, sessions, agent, leaderboard
├── services/       scorer, filecoin, web3_client
├── agent/          buyer_agent.py (autonomous loop)
└── api.skill.md    Agent skill file

frontend/           Next.js 16 + Tailwind 4 + RainbowKit
├── src/app/        7 pages: landing, marketplace, submit,
│                     agent-feed, leaderboard, validate, town-square
└── src/lib/        Shared nav routes, API client, wagmi config

lido-mcp/           MCP server — 11 Lido tools
├── index.js        Dual-provider: Ethereum mainnet + Base Sepolia
├── contracts.js    Verified addresses from docs.lido.fi
├── lido.skill.md   Agent mental model (rebasing, wstETH vs stETH)
└── live-test.js    11/11 tools verified against real RPCs

stakesignal-mcp/    MCP server — 5 marketplace tools
├── index.js        All tools hit live Railway API
├── stakesignal.skill.md  Agent workflow guide
└── live-test.js    5/5 tools verified

filecoin-bridge/    Filecoin Onchain Cloud storage
├── index.js        @filoz/synapse-sdk v0.40.0 (ESM)
├── filecoin.skill.md  FOC setup guide + USDFC instructions
└── filecoin-bridge.test.js  6 integration tests

agent/              Project docs + skill files
├── CLAUDE.md       Security rules, sprint state, commands
├── skills/         Track-specific skill docs
└── memory.md       Full project decision log
```

## Test Coverage

| Suite | Tests | What's Verified |
|-------|-------|-----------------|
| Solidity (Hardhat) | 91 | Job lifecycle, receipts, treasury yield, escrow, independence |
| Python (pytest) | 71 | Scorer, schema, task intent, two-layer payout, filecoin |
| Frontend (vitest) | 5 | Nav route consistency across TopBar + SideNav |
| Lido MCP | 12 | Tool defs, ABIs, mainnet addresses, live rate read |
| StakeSignal MCP | 6 | Tool shapes, API calls, error handling |
| Filecoin FOC | 6 | SDK connect, balances, costs, proof CID |
| Lido live test | 11/11 | Every tool against real Ethereum mainnet |
| StakeSignal live test | 5/5 | Every tool against live Railway API |
| CI | 4 jobs | GitHub Actions: solidity, python, frontend, security |

## License

MIT
