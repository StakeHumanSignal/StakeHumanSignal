# StakeHumanSignal

> Humans stake crypto on AI review quality — winners earn Lido yield, agents get better signal.

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
