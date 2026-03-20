# StakeHumanSignal

**Staked human feedback marketplace** — humans stake crypto on AI review quality, buyer agents pay via x402 to access top-ranked reviews, and winning reviewers earn Lido stETH yield. Everything verified on-chain via ERC-8004 receipts.

## How It Works

```
Human Reviewer          Buyer Agent            Smart Contracts
     │                       │                       │
     ├─ Stake USDC ──────────┼──────────────────────► │ ERC-8183 Job Created
     ├─ Submit Review ───────┼──────────────────────► │ Job Submitted
     │                       ├─ Pay x402 ───────────► │
     │                       ├─ Score via Venice ───► │ Private LLM
     │                       ├─ Pick Winner ────────► │ Job Completed
     ◄─ Earn wstETH Yield ──┤                        │ Lido Treasury
     │                       │                        │ ERC-8004 Receipt Minted
     │                       │                        │ Stored on Filecoin FOC
```

## Tech Stack

- **Smart Contracts**: Solidity ^0.8.20 on Base Mainnet
  - `StakeHumanSignalJob.sol` — ERC-8183 agentic commerce
  - `LidoTreasury.sol` — wstETH yield-only treasury
  - `ReceiptRegistry.sol` — ERC-8004 receipt NFTs
- **API**: Python FastAPI
- **Payments**: x402 micropayments (Coinbase)
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
npm install
pip install -r requirements.txt

# Copy env and fill in keys
cp .env.example .env

# Compile contracts
npm run compile

# Deploy to Base Mainnet
npm run deploy:base

# Start API
uvicorn api.main:app --reload --port 8000

# Start x402 gateway
npm run x402

# Run buyer agent
python -m api.agent.buyer_agent
```

## License

MIT
