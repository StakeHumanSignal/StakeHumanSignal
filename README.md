# StakeHumanSignal

> Humans stake crypto on AI review quality — winners earn Lido yield, agents get better signal.

## The Problem

AI agents are making thousands of API purchasing decisions every day — which LLM to call, which data provider to trust, which service to pay for. But they have no reliable way to evaluate quality before spending. Current review systems are broken for agents:

- **Yelp/G2-style reviews** are gamed, unverifiable, and written for humans
- **No skin in the game** — reviewers face zero consequences for bad reviews
- **No agent-readable signal** — reviews are unstructured text, not queryable data
- **No outcome verification** — nobody checks if the review was actually right

Agents need trusted, outcome-verified human signal to make better purchasing decisions. Without it, they overpay for bad APIs and miss good ones.

## The Solution

StakeHumanSignal creates a **staked feedback marketplace** where economic incentives align review quality with agent needs:

1. **Humans stake USDC** on the quality of their AI API reviews — putting money behind their opinions
2. **Structured claims, not free text** — every review is a verifiable A/B comparison with rubric scores across 5 dimensions
3. **Buyer agents pay via x402** to access top-ranked reviews, scored privately by Venice AI
4. **Independence enforced on-chain** — contracts block self-review via agent-owner relationship tracking
5. **Winning reviewers earn Lido wstETH yield** — the staked principal generates yield, and accurate reviewers earn it
6. **Every outcome is verified on-chain** — ERC-8183 job lifecycle + ERC-8004 receipt NFTs on Base
7. **All data stored permanently** on Filecoin FOC — reviews, outcomes, and agent decisions are immutable

The result: a self-correcting marketplace where the best reviewers rise to the top, agents get trustworthy signal, and the entire history is verifiable on-chain.

## Future Vision: Agentic GDP

StakeHumanSignal is infrastructure for the emerging **agentic economy** — where AI agents are autonomous economic actors that buy, sell, and evaluate services without human intervention.

- **Review-as-a-Service**: Any agent can query our marketplace via x402 to get trusted reviews before making a purchase. One API call, one micropayment, better decisions.
- **Composable reputation**: ERC-8004 receipts create a portable, on-chain reputation layer. A reviewer's track record follows them across marketplaces.
- **Yield-aligned incentives**: By routing stakes through Lido wstETH, we turn idle review capital into productive DeFi yield — reviewers earn even while waiting for evaluation.
- **Protocol-level trust**: As the agentic economy scales, the agents that make the best purchasing decisions will outcompete. StakeHumanSignal gives them the signal to do that.
- **Human-agent collaboration**: This isn't AI replacing humans — it's humans providing the judgment that AI can't, and getting paid for being right.

The agentic GDP needs trusted marketplaces. We're building one.

---

## Prize Tracks

| # | Sponsor | Track | Prize | What We Ship | Status |
|---|---------|-------|-------|-------------|--------|
| 1 | **Lido** | stETH Agent Treasury | $3,000 | Principal locked forever, yield-only distribution, real wstETH | Deployed |
| 2 | **Lido** | Lido MCP Server | $5,000 | MCP server wrapping stETH staking + position management | To build |
| 3 | **Base** | Agent Services on Base | $5,000 | x402-gated review marketplace on Base | Working |
| 4 | **Protocol Labs** | Let the Agent Cook | $4,000 | Auto-Verifier Agent — zero human in scoring loop | Working |
| 5 | **Protocol Labs** | Agents With Receipts — ERC-8004 | $4,000 | Receipt NFT per job completion, on-chain verifiable | Deployed |
| 6 | **Filecoin** | Agentic Storage | $2,000 | Reviews + outcomes on FOC mainnet, real CIDs | Working |
| 7 | **Venice** | Private Agents, Trusted Actions | $11,500 | Venice LLM as load-bearing private scorer | Working |
| 8 | **Bankr** | Best Bankr LLM Gateway | $5,000 | Multi-LLM ensemble scoring via Bankr Gateway | Working |
| 9 | **Olas** | Monetize on Olas Marketplace | $1,000 | `/reviews/top` registered as Olas mech, 50+ requests | To build |
| 10 | **Self** | Best Self Protocol Integration | $1,000 | Self Agent ID for reviewer verification | Deferred |
| + | **Synthesis** | Open Track | $28,309 | Full end-to-end staked marketplace | In progress |

---

## Sequence Diagram

```
  Human Reviewer           x402 Gateway            Buyer Agent             Base Mainnet
  ──────────────           ────────────            ───────────             ────────────
        │                       │                       │                       │
        │  1. createJob(spec)   │                       │                       │
        ├───────────────────────┼───────────────────────┼──────────────────────►│
        │                       │                       │         JobCreated #0 │
        │                       │                       │◄──────────────────────┤
        │                       │                       │                       │
        │  2. fund(jobId, USDC) │                       │                       │
        ├───────────────────────┼───────────────────────┼──────────────────────►│
        │                       │                       │    USDC → LidoTreasury│
        │                       │                       │◄──────────────────────┤
        │                       │                       │                       │
        │  3. submit(hash)      │                       │                       │
        ├───────────────────────┼───────────────────────┼──────────────────────►│
        │                       │                       │        JobSubmitted   │
        │                       │                       │◄──────────────────────┤
        │                       │                       │                       │
        │                       │  4. GET /reviews/top  │                       │
        │                       │◄──────────────────────┤                       │
        │                       │   (x402: 0.001 USDC)  │                       │
        │                       ├──────────────────────►│                       │
        │                       │   ranked reviews      │                       │
        │                       │                       │                       │
        │                       │                       │  5. Venice LLM score  │
        │                       │                       ├──────►[Venice AI]     │
        │                       │                       │◄──────{rubric_scores} │
        │                       │                       │                       │
        │                       │                       │  6. Independence check│
        │                       │                       ├──────────────────────►│
        │                       │                       │   ReceiptRegistry     │
        │                       │                       │   getIndependenceScore│
        │                       │                       │◄──────────────────────┤
        │                       │                       │                       │
        │                       │                       │  7. complete(jobId)   │
        │                       │                       ├──────────────────────►│
        │                       │                       │        JobCompleted   │
        │                       │                       │◄──────────────────────┤
        │                       │                       │                       │
        │                       │                       │  8. mintReceipt()     │
        │                       │                       ├──────────────────────►│
        │                       │                       │    ERC-8004 NFT #0    │
        │                       │                       │◄──────────────────────┤
        │                       │                       │                       │
        │  9. wstETH yield      │                       │  distributeYield()    │
        │◄──────────────────────┼───────────────────────┼──────────────────────►│
        │     (winner earns)    │                       │    wstETH → winner    │
        │                       │                       │◄──────────────────────┤
        │                       │                       │                       │
        │                       │                       │  10. store on Filecoin│
        │                       │                       ├──────►[FOC bridge]    │
        │                       │                       │◄──────{cid: bafy...}  │
        │                       │                       │                       │
        │                       │                       │  11. pin agent_log    │
        │                       │                       ├──────►[FOC bridge]    │
        │                       │                       │◄──────{logCID}        │
        ▼                       ▼                       ▼                       ▼
```

## Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          StakeHumanSignal                                 │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────────────────┐ │
│  │   Frontend   │───►│  x402 Gateway │───►│      FastAPI Backend        │ │
│  │  (Next.js)   │    │  (Express)    │    │      :8000                  │ │
│  │  :3000       │    │  :3000        │    │                              │ │
│  └─────────────┘    │  Payment gate │    │  /reviews    (structured     │ │
│                      │  on /top only │    │               claims)        │ │
│                      └──────────────┘    │  /reviews/top (x402-gated)   │ │
│                                           │  /outcomes   (rubric scores) │ │
│                                           │  /jobs       (ERC-8183)      │ │
│                                           └──────────┬───────────────────┘ │
│                                                       │                     │
│                  ┌────────────────────────────────────┼──────────┐          │
│                  │                                    │          │          │
│            ┌─────▼──────┐  ┌──────────────┐  ┌──────▼───────┐  │          │
│            │  Venice AI  │  │  Filecoin    │  │   Web3       │  │          │
│            │  (private   │  │  FOC Bridge  │  │   Client     │  │          │
│            │   scoring)  │  │  :3001       │  │   (web3.py)  │  │          │
│            │  rubric     │  │              │  └──────┬───────┘  │          │
│            │  scores     │  │  store_review│         │          │          │
│            └────────────┘  │  store_log   │         │          │          │
│                             │  retrieve    │         │          │          │
│            ┌────────────┐  └──────────────┘         │          │          │
│            │  Bankr LLM │                            │          │          │
│            │  (ensemble  │                            │          │          │
│            │   fallback) │                            │          │          │
│            └────────────┘                            │          │          │
│                                                       │          │          │
│                  ┌────────────────────────────────────┘          │          │
│                  │       Base (Sepolia / Mainnet)                │          │
│            ┌─────▼─────────────────────────────────────────┐    │          │
│            │                                               │    │          │
│            │  ┌──────────────────┐    ┌─────────────────┐  │    │          │
│            │  │StakeHumanSignal  │    │   Lido          │  │    │          │
│            │  │Job (ERC-8183)    │───►│   Treasury      │  │    │          │
│            │  │                  │    │   (wstETH)      │  │    │          │
│            │  │ createJob()      │    │                 │  │    │          │
│            │  │ fund()           │    │ principal       │  │    │          │
│            │  │ submit()         │    │ locked forever  │  │    │          │
│            │  │ complete()       │    │ yield only      │  │    │          │
│            │  │  ↳ independence  │    └─────────────────┘  │    │          │
│            │  │    check ────────┤                         │    │          │
│            │  │ reject()         │                         │    │          │
│            │  └────────┬─────────┘                         │    │          │
│            │           │                                   │    │          │
│            │  ┌────────▼──────────────────┐                │    │          │
│            │  │ ReceiptRegistry           │                │    │          │
│            │  │ (ERC-8004 NFTs)           │                │    │          │
│            │  │                           │                │    │          │
│            │  │ mintReceipt()             │                │    │          │
│            │  │ registerAgentOwnership()  │                │    │          │
│            │  │ getIndependenceScore()    │                │    │          │
│            │  │ getHumanReputationScore() │                │    │          │
│            │  │ agentWins / agentJobs     │                │    │          │
│            │  │ duplicate receipt guard   │                │    │          │
│            │  └───────────────────────────┘                │    │          │
│            └───────────────────────────────────────────────┘    │          │
│                                                                  │          │
│            ┌─────────────────────────────────────────────────┐  │          │
│            │  Buyer Agent (autonomous Python loop)           │  │          │
│            │                                                 │  │          │
│            │  every 60s:                                     │  │          │
│            │    1. fetch /reviews/top (x402 payment)         │  │          │
│            │    2. score with Venice LLM (5-dim rubric)      │  │          │
│            │    3. rank by weighted rubric + stake + win_rate│  │          │
│            │    4. independence check on-chain               │  │          │
│            │    5. complete() → mintReceipt() ERC-8004       │  │          │
│            │    6. store outcome on Filecoin FOC             │  │          │
│            │    7. pin agent_log.json to Filecoin            │  │          │
│            └─────────────────────────────────────────────────┘  │          │
│                                                                  │          │
│            ┌─────────────────────────────────────────────────┐  │          │
│            │  Verifier Agent (autonomous review validation)  │  │          │
│            │                                                 │  │          │
│            │  Venice + Bankr ensemble scoring                │  │          │
│            │  Auto-complete / auto-reject ERC-8183 jobs      │  │          │
│            │  Zero human intervention                        │  │          │
│            └─────────────────────────────────────────────────┘  │          │
│                                                                  │          │
└──────────────────────────────────────────────────────────────────┘          │
```

## Structured Claim Schema

Every review is a **structured comparison claim** — not free text. Reviews capture:

| Field | Type | Description |
|-------|------|-------------|
| `task_type` | enum | `code_review`, `analysis`, `creative`, `data_extraction`, `customer_support`, `other` |
| `policy_a` / `policy_b` | object | Models being compared (model name, system prompt hash, tool config) |
| `winner` | enum | `policy_a`, `policy_b`, or `tie` |
| `rubric_scores` | object | 5-dimension scores (0.0-1.0): correctness, efficiency, relevance, completeness, reasoning_quality |
| `confidence_level` | object | `low`/`medium`/`high` + numeric 0.0-1.0 |
| `reasoning` | string | Why the reviewer picked the winner |

**Weighted rubric formula:**
```
score = correctness×0.30 + relevance×0.25 + completeness×0.20 + efficiency×0.15 + reasoning_quality×0.10
```

Backward compatible — old flat-text reviews still accepted during transition.

## Independence & Reputation System

Self-review is **blocked at the contract level**:

- `ReceiptRegistry.registerAgentOwnership(agent, owner)` maps agents to human wallets
- `getIndependenceScore(reviewer, agentOwner)` returns 0 if related, 100 if unrelated
- `StakeHumanSignalJob.complete()` reverts with "Evaluator not independent" if score == 0
- Human reputation: `getHumanReputationScore(wallet)` — weighted avg win rate across all owned agents

## Deployed Contracts (Base Sepolia)

| Contract | Address | Basescan |
|----------|---------|----------|
| **StakeHumanSignalJob** (ERC-8183) | `0x5298F4D8d8043C14e5F2683Ad642fEbC8B54638f` | [View](https://sepolia.basescan.org/address/0x5298F4D8d8043C14e5F2683Ad642fEbC8B54638f) |
| **LidoTreasury** (wstETH yield) | `0xE78f6c235FD1686547DBea41F742D649607316B1` | [View](https://sepolia.basescan.org/address/0xE78f6c235FD1686547DBea41F742D649607316B1) |
| **ReceiptRegistry** (ERC-8004) | `0xA471D2C45F03518E47c7Fc71C897d244dF01859D` | [View](https://sepolia.basescan.org/address/0xA471D2C45F03518E47c7Fc71C897d244dF01859D) |

| Token | Address | Network |
|-------|---------|---------|
| USDC | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | Base Sepolia |
| wstETH | `0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452` | Base Mainnet |

### E2E Test Transactions

| Action | TX Hash |
|--------|---------|
| Job #0 Created | [`0x773dde...`](https://sepolia.basescan.org/tx/0x773dde0d856359b7035360cbe394418a94d1133e8d0446b0c734efe610391089) |
| Receipt #0 Minted (ERC-8004) | [`0x7f29a7...`](https://sepolia.basescan.org/tx/0x7f29a730ecfb4de5c1c2eb377f730cadbf3f5cb878796b850a5d0054ac21fc79) |

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Smart Contracts** | Solidity ^0.8.28, Cancun EVM, OpenZeppelin 5.x | 3 contracts on Base |
| **Backend API** | Python FastAPI, Pydantic v2 | Structured claim API with validation |
| **Payments** | x402 (Coinbase), Express middleware | Micropayments for `/reviews/top` |
| **Private Scoring** | Venice AI (`llama-3.3-70b`) | 5-dimension rubric scoring |
| **Ensemble Scoring** | Bankr LLM Gateway (20+ models) | Multi-LLM fallback scoring |
| **Permanent Storage** | Filecoin FOC (Synapse SDK) | Reviews, outcomes, agent logs with CIDs |
| **Agent Runtime** | Python asyncio, 60s loop | Buyer agent + verifier agent |
| **Contract Tooling** | Hardhat, ethers.js v6 | Compile, deploy, test, verify |
| **Package Manager** | bun (JS), pip (Python) | `npx hardhat` for Solidity |

### Smart Contracts

| Contract | Purpose | Key Features |
|----------|---------|-------------|
| `StakeHumanSignalJob.sol` | ERC-8183 job lifecycle | createJob, fund, submit, complete (with independence check), reject |
| `LidoTreasury.sol` | wstETH yield treasury | Principal locked forever, yield-only distribution, whitelisted callers |
| `ReceiptRegistry.sol` | ERC-8004 receipt NFTs | mintReceipt (duplicate guard), agent ownership mapping, independence score, human reputation |

## Standards

| Standard | Usage |
|----------|-------|
| ERC-8183 | Agentic Commerce — job lifecycle (createJob → fund → submit → complete/reject) |
| ERC-8004 | Agent Identity & Receipts — on-chain proof of every completed evaluation |
| x402     | HTTP micropayments — agents pay 0.001 USDC per ranked review query |

## Test Suite

**105 tests total, all passing:**

| Suite | Count | Coverage |
|-------|-------|---------|
| Solidity — StakeHumanSignalJob | 26 | Constructor, createJob, fund, submit, complete, reject, admin, events |
| Solidity — LidoTreasury | 20 | Deposit, yield distribution, principal lock, whitelist |
| Solidity — ReceiptRegistry | 17 | Mint, metadata, minter management, duplicate guard |
| Solidity — Independence & Reputation | 15 | Ownership, independence score, reputation, self-review block |
| Python — Review Schema | 20 | Structured claims, validation, rubric scoring, backward compat |
| Python — Filecoin Storage | 7 | store_review, store_agent_log, retrieve, legacy compat |

## Quick Start

```bash
# Install dependencies
bun install
cd filecoin-bridge && bun install && cd ..
pip install -r requirements.txt

# Copy env and fill in keys
cp .env.example .env

# Compile contracts
npx hardhat compile

# Run tests (105 passing)
npx hardhat test                              # 78 Solidity tests
python -m pytest test/ -v                     # 27 Python tests

# Deploy to Base Sepolia (testnet first)
npx hardhat run scripts/deploy-sepolia.js --network base-sepolia

# Start all services
uvicorn api.main:app --reload --port 8000     # API server
node x402-server/index.js                     # x402 payment gateway
node filecoin-bridge/index.js                 # Filecoin bridge (:3001)
python -m api.agent.buyer_agent               # Autonomous buyer agent
```

## Project Structure

```
contracts/
├── StakeHumanSignalJob.sol       # ERC-8183 job lifecycle + independence check
├── LidoTreasury.sol              # wstETH yield-only treasury
├── ReceiptRegistry.sol           # ERC-8004 receipts + ownership + reputation
├── interfaces/
│   ├── IERC8183.sol              # ERC-8183 interface
│   └── IWstETH.sol               # Lido wstETH interface
└── mocks/
    └── MockERC20.sol             # Test mock token

api/
├── main.py                       # FastAPI app entry
├── routes/
│   ├── reviews.py                # Structured claim submission + ranking
│   ├── jobs.py                   # ERC-8183 job management
│   └── outcomes.py               # Winner signaling with rubric scores
├── services/
│   ├── web3_client.py            # Base contract calls
│   ├── venice.py                 # Venice private scoring
│   ├── bankr.py                  # Bankr ensemble scoring
│   ├── filecoin.py               # FOC storage (store_review, store_agent_log)
│   └── scorer.py                 # Weighted rubric ranking + independence
└── agent/
    ├── buyer_agent.py            # Autonomous 60s loop
    └── verifier_agent.py         # Independent review validation

x402-server/
└── index.js                      # Express x402 payment gateway

filecoin-bridge/
└── index.js                      # Synapse SDK bridge (mock mode available)

scripts/
├── deploy.js                     # Base Mainnet deployment
├── deploy-sepolia.js             # Base Sepolia deployment
├── wire-sepolia.js               # Contract wiring
└── e2e-test-sepolia.js           # End-to-end test

test/
├── StakeHumanSignalJob.test.js   # 26 tests
├── LidoTreasury.test.js          # 20 tests
├── ReceiptRegistry.test.js       # 17 tests
├── ReceiptRegistry.independence.test.js  # 15 tests
├── test_review_schema.py         # 20 tests
└── test_filecoin.py              # 7 tests
```

## License

MIT
