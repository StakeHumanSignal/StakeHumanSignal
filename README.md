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

1. **Humans stake USDC** on the quality of their API reviews — putting money behind their opinions
2. **Buyer agents pay via x402** to access top-ranked reviews, scored privately by Venice AI
3. **Winning reviewers earn Lido wstETH yield** — the staked principal generates yield, and accurate reviewers earn it
4. **Losing reviewers lose their stake** — bad reviews have real financial consequences
5. **Every outcome is verified on-chain** — ERC-8183 job lifecycle + ERC-8004 receipt NFTs on Base
6. **All data stored permanently** on Filecoin FOC — reviews, outcomes, and agent decisions are immutable

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

| # | Sponsor | Track | Prize | What We Ship | Tech Stack | Status |
|---|---------|-------|-------|-------------|------------|--------|
| 1 | **Lido** | stETH Agent Treasury | $3,000 | Principal locked forever, yield-only distribution to winners, real wstETH transfers | `LidoTreasury.sol`, wstETH on Base, `distributeYield()` | Deployed |
| 2 | **Lido** | Lido MCP Server | $5,000 | MCP server wrapping stETH staking + position management, callable by any agent | `@modelcontextprotocol/sdk`, `LidoTreasury.sol`, wstETH | To build |
| 3 | **Base** | Agent Services on Base | $5,000 | x402-gated review marketplace, discoverable agent service on Base | `@x402/express`, `@x402/evm`, viem, Express, Base Sepolia/Mainnet | Working |
| 4 | **Protocol Labs** | Let the Agent Cook | $4,000 | Auto-Verifier Agent — zero human in scoring loop, full autonomy | `verifier-agent.py`, Venice API, `agent.json`, `agent_log.json` | To build |
| 5 | **Protocol Labs** | Agents With Receipts — ERC-8004 | $4,000 | Receipt NFT minted on every job completion, on-chain verifiable | `ReceiptRegistry.sol` (ERC-721), Base, Hardhat | Deployed |
| 6 | **Filecoin** | Agentic Storage | $2,000 | Reviews + outcomes stored permanently on FOC mainnet, real CIDs | `@filecoin-synapse/sdk`, Synapse bridge, ethers | To build |
| 7 | **Venice** | Private Agents, Trusted Actions | $11,500 | Venice LLM as load-bearing private scorer — sensitive review data never exposed | `httpx`, Venice API (`llama-3.3-70b`), `venice.py` | Working |
| 8 | **Bankr** | Best Bankr LLM Gateway | $5,000 | Multi-LLM ensemble scoring via Bankr Gateway (20+ models) | Bankr LLM Gateway API, `bankr.py` | To build |
| 9 | **Olas** | Monetize on Olas Marketplace | $1,000 | `/reviews/top` registered as Olas mech, 50+ requests served | `@valory-xyz/mech-client`, `mech-server.js`, Olas Pearl | To build |
| 10 | **Self** | Best Self Protocol Integration | $1,000 | Self Agent ID for human reviewer verification (proof of human) | Self Agent ID API (`app.ai.self.xyz`) | To build |
| + | **Synthesis** | Open Track | $28,309 | Full end-to-end staked marketplace with all integrations | Everything above | In progress |

**Total potential: $69,809 across 11 tracks.**
**Conservative target: $15,000-25,000 (6-7 tracks landed).**

### Track Priority (build order)

```
DONE     Lido Treasury + Base x402 + ERC-8004 + Venice scoring
         ─────────────────────────────────────────────────────
NEXT     Bankr LLM (2h) → Verifier Agent (2h) → Olas mech (3h)
         → Self Agent ID (2h) → Filecoin bridge (2h) → Lido MCP (4h)
         ─────────────────────────────────────────────────────
LAST     Frontend → Deploy mainnet → Demo video → Submit all tracks
```

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
        │                       │                       │◄──────{score: 87}     │
        │                       │                       │                       │
        │                       │                       │  6. complete(jobId)   │
        │                       │                       ├──────────────────────►│
        │                       │                       │        JobCompleted   │
        │                       │                       │◄──────────────────────┤
        │                       │                       │                       │
        │                       │                       │  7. mintReceipt()     │
        │                       │                       ├──────────────────────►│
        │                       │                       │    ERC-8004 NFT #0    │
        │                       │                       │◄──────────────────────┤
        │                       │                       │                       │
        │  8. wstETH yield      │                       │  distributeYield()    │
        │◄──────────────────────┼───────────────────────┼──────────────────────►│
        │     (winner earns)    │                       │    wstETH → winner    │
        │                       │                       │◄──────────────────────┤
        │                       │                       │                       │
        │                       │                       │  9. store on Filecoin │
        │                       │                       ├──────►[FOC]           │
        │                       │                       │◄──────{cid: bafy...}  │
        ▼                       ▼                       ▼                       ▼
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        StakeHumanSignal                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────────────┐ │
│  │   Frontend   │───►│  x402 Gateway │───►│   FastAPI Backend     │ │
│  │  (Next.js)   │    │  (Express)    │    │   :8000               │ │
│  │  :3000       │    │  :3000        │    │                        │ │
│  └─────────────┘    │               │    │  /reviews  /jobs       │ │
│                      │  Payment gate │    │  /reviews/top          │ │
│                      │  on /top only │    │  /outcomes             │ │
│                      └──────────────┘    └────────┬───────────────┘ │
│                                                    │                 │
│                    ┌───────────────────────────────┼─────────┐       │
│                    │                               │         │       │
│              ┌─────▼──────┐  ┌─────────────┐  ┌───▼───────┐ │       │
│              │  Venice AI  │  │  Filecoin   │  │  Web3     │ │       │
│              │  (scoring)  │  │  FOC        │  │  Client   │ │       │
│              │  llama-3.3  │  │  (storage)  │  │  (web3.py)│ │       │
│              └────────────┘  └─────────────┘  └───┬───────┘ │       │
│                                                    │         │       │
│                    ┌───────────────────────────────┘         │       │
│                    │         Base (Sepolia / Mainnet)        │       │
│              ┌─────▼───────────────────────────────────┐     │       │
│              │                                         │     │       │
│              │  ┌──────────────────┐  ┌─────────────┐  │     │       │
│              │  │StakeHumanSignal  │  │   Lido      │  │     │       │
│              │  │Job (ERC-8183)    │  │   Treasury  │  │     │       │
│              │  │                  │──►│   (wstETH)  │  │     │       │
│              │  │ createJob()      │  │             │  │     │       │
│              │  │ fund()           │  │ principal   │  │     │       │
│              │  │ submit()         │  │ locked      │  │     │       │
│              │  │ complete()       │  │ yield only  │  │     │       │
│              │  │ reject()         │  └─────────────┘  │     │       │
│              │  └────────┬─────────┘                   │     │       │
│              │           │                             │     │       │
│              │  ┌────────▼─────────┐                   │     │       │
│              │  │ReceiptRegistry   │                   │     │       │
│              │  │(ERC-8004 NFTs)   │                   │     │       │
│              │  │                  │                   │     │       │
│              │  │ mintReceipt()    │                   │     │       │
│              │  │ jobId + winner   │                   │     │       │
│              │  │ + CID + score    │                   │     │       │
│              │  └──────────────────┘                   │     │       │
│              │                                         │     │       │
│              └─────────────────────────────────────────┘     │       │
│                                                              │       │
│              ┌───────────────────────────────────────────┐   │       │
│              │  Buyer Agent (autonomous Python loop)     │   │       │
│              │                                           │   │       │
│              │  every 60s:                               │   │       │
│              │    1. fetch /reviews/top (x402 payment)   │   │       │
│              │    2. score with Venice LLM               │   │       │
│              │    3. pick winner (highest score)          │   │       │
│              │    4. complete() on-chain                  │   │       │
│              │    5. mintReceipt() ERC-8004               │   │       │
│              │    6. store outcome on Filecoin FOC        │   │       │
│              │    7. log to agent_log.json                │   │       │
│              └───────────────────────────────────────────┘   │       │
│                                                              │       │
└──────────────────────────────────────────────────────────────┘       │
                                                                       │
```

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

- **Smart Contracts**: Solidity ^0.8.28 (Cancun EVM) on Base
  - `StakeHumanSignalJob.sol` — ERC-8183 agentic commerce
  - `LidoTreasury.sol` — wstETH yield-only treasury
  - `ReceiptRegistry.sol` — ERC-8004 receipt NFTs
- **API**: Python FastAPI
- **Payments**: x402 micropayments (self-verified, no CDP dependency)
- **Storage**: Filecoin FOC (permanent, decentralized)
- **Private Scoring**: Venice AI (private LLM inference)
- **Agent**: Autonomous buyer agent loop

## Standards

| Standard | Usage |
|----------|-------|
| ERC-8183 | Agentic Commerce — job lifecycle |
| ERC-8004 | Agent Identity & Receipts |
| x402     | HTTP micropayments |

## Quick Start

```bash
# Install dependencies
bun install
pip install -r requirements.txt

# Copy env and fill in keys
cp .env.example .env

# Compile contracts
npx hardhat compile

# Run tests (59 passing)
npx hardhat test

# Deploy to Base Sepolia (testnet first)
npx hardhat run scripts/deploy-sepolia.js --network base-sepolia

# Deploy to Base Mainnet
npx hardhat run scripts/deploy.js --network base

# Start API
uvicorn api.main:app --reload --port 8000

# Start x402 gateway
node x402-server/index.js

# Run buyer agent
python -m api.agent.buyer_agent
```

## License

MIT
