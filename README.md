# StakeHumanSignal

> Staked human feedback marketplace on Base. Humans stake USDC on AI review quality — winners earn Lido yield, agents get better signal.

## How It Works

1. **Humans stake USDC** on structured A/B comparison reviews (5-dimension rubric scoring)
2. **Buyer agents pay via x402** to access ranked reviews, scored privately by Venice AI
3. **Independence enforced on-chain** — contracts block self-review via agent-owner tracking
4. **Winners earn Lido wstETH yield** — principal locked forever, only yield distributed
5. **Every outcome on-chain** — ERC-8183 jobs + ERC-8004 receipt NFTs on Base
6. **All data permanent** — reviews, outcomes, agent logs stored on Filecoin FOC

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  Frontend ──► x402 Gateway ──► FastAPI Backend (:8000)             │
│               (Express :3000)   /reviews  /jobs  /outcomes         │
│                                       │                            │
│               ┌───────────────────────┼──────────┐                 │
│               │                       │          │                 │
│         Venice AI          Filecoin Bridge    Web3 Client          │
│         (rubric scoring)   (:3001)           (web3.py)             │
│         Bankr (fallback)   store/retrieve        │                 │
│                                                   │                 │
│         ┌─────────────────────────────────────────┘                 │
│         │           Base (Sepolia / Mainnet)                        │
│         │                                                           │
│         │  StakeHumanSignalJob ──► LidoTreasury                    │
│         │  (ERC-8183)              (wstETH yield-only)             │
│         │    ↳ independence check                                   │
│         │                                                           │
│         │  ReceiptRegistry (ERC-8004)                              │
│         │    ownership mapping · independence score                 │
│         │    human reputation · duplicate receipt guard             │
│         │                                                           │
│         │  Buyer Agent          Verifier Agent                     │
│         │  (60s loop)           (Venice + Bankr ensemble)          │
│         │  x402 → score →       auto-complete/reject               │
│         │  complete → mint →    zero human intervention             │
│         │  Filecoin pin                                             │
└─────────┘                                                           │
```

## Deployed Contracts (Base Sepolia)

| Contract | Address |
|----------|---------|
| **StakeHumanSignalJob** (ERC-8183) | [`0x5298F4D8...`](https://sepolia.basescan.org/address/0x5298F4D8d8043C14e5F2683Ad642fEbC8B54638f) |
| **LidoTreasury** (wstETH) | [`0xE78f6c23...`](https://sepolia.basescan.org/address/0xE78f6c235FD1686547DBea41F742D649607316B1) |
| **ReceiptRegistry** (ERC-8004) | [`0xA471D2C4...`](https://sepolia.basescan.org/address/0xA471D2C45F03518E47c7Fc71C897d244dF01859D) |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity ^0.8.28, OpenZeppelin 5.x, Hardhat |
| Backend | Python FastAPI, Pydantic v2 |
| Payments | x402 (Coinbase), Express |
| Scoring | Venice AI (private rubric), Bankr LLM Gateway (ensemble) |
| Storage | Filecoin FOC (Synapse SDK) |
| Agents | Buyer agent + Verifier agent (Python asyncio) |
| Standards | ERC-8183, ERC-8004, x402 |

## Quick Start

```bash
bun install && cd filecoin-bridge && bun install && cd ..
pip install -r requirements.txt
cp .env.example .env

npx hardhat compile
npx hardhat test                              # 78 Solidity tests
python -m pytest test/ -v                     # 27 Python tests

# Start services
uvicorn api.main:app --reload --port 8000     # API
node x402-server/index.js                     # x402 gateway
node filecoin-bridge/index.js                 # Filecoin bridge
python -m api.agent.buyer_agent               # Agent
```

## Project Structure

```
contracts/
├── StakeHumanSignalJob.sol       # ERC-8183 jobs + independence check
├── LidoTreasury.sol              # wstETH yield-only treasury
├── ReceiptRegistry.sol           # ERC-8004 receipts + ownership + reputation
├── interfaces/                   # IERC8183, IWstETH
└── mocks/                        # MockERC20

api/
├── main.py                       # FastAPI entry
├── routes/                       # reviews, jobs, outcomes
├── services/                     # web3, venice, bankr, filecoin, scorer
└── agent/                        # buyer_agent, verifier_agent

x402-server/                      # Express x402 payment gateway
filecoin-bridge/                  # Synapse SDK bridge (mock mode available)
scripts/                          # deploy, wire, e2e test
test/                             # 105 tests (78 Solidity + 27 Python)
```

## License

MIT
