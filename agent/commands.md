# StakeHumanSignal — Command Reference

## Setup

```bash
# Clone and enter repo
git clone https://github.com/LingSiewWin/StakeHumanSignal.git
cd StakeHumanSignal

# Install JS dependencies (bun, NOT npm)
bun install

# Install x402-server dependencies
cd x402-server && bun install && cd ..

# Install Python dependencies
pip install -r requirements.txt

# Create .env from template
cp .env.example .env
# Fill in: PRIVATE_KEY, VENICE_API_KEY, CDP_API_KEY_ID, CDP_API_KEY_SECRET,
#          RECEIVER_ADDRESS, FILECOIN_PRIVATE_KEY, SYNTHESIS_API_KEY, BASESCAN_API_KEY
```

## Smart Contracts

```bash
# Compile (MUST use npx, not bun — Hardhat native module issue)
npx hardhat compile
# Output: "Compiled 28 Solidity files successfully (evm target: cancun)"

# Deploy to Base Mainnet
# Requires: PRIVATE_KEY, BASE_RPC_URL in .env
# Wallet needs ~0.01 ETH on Base for gas
npx hardhat run scripts/deploy.js --network base
# Output: 3 contract addresses + addresses.json created

# Deploy to Base Sepolia (testnet)
npx hardhat run scripts/deploy.js --network baseSepolia

# Verify contracts on Basescan
# Requires: BASESCAN_API_KEY in .env
npx hardhat verify --network base <StakeHumanSignalJob_ADDRESS> "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" "<DEPLOYER_ADDRESS>"
npx hardhat verify --network base <LidoTreasury_ADDRESS> "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452" "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
npx hardhat verify --network base <ReceiptRegistry_ADDRESS>

# Run contract tests
npx hardhat test
```

## API Server (Python FastAPI)

```bash
# Start with hot-reload (development)
uvicorn api.main:app --reload --port 8000
# Output: "Uvicorn running on http://127.0.0.1:8000"

# Start production
uvicorn api.main:app --host 0.0.0.0 --port 8000

# Health check
curl http://localhost:8000/health
# Output: {"status":"ok"}

# Test endpoints
curl http://localhost:8000/reviews          # List reviews (free)
curl http://localhost:8000/reviews/top      # Ranked reviews (x402-gated via proxy)
curl http://localhost:8000/jobs             # List jobs
```

## x402 Payment Gateway (Node/Express)

```bash
# Start gateway (proxies to FastAPI on :8000)
# Requires: RECEIVER_ADDRESS, X402_PORT (default 3000), API_BACKEND (default http://localhost:8000)
bun run x402-server/index.js
# Output: "[x402] Payment gateway on port 3000"

# Or via npm script from root
node x402-server/index.js

# Test x402 gate
curl http://localhost:3000/reviews/top
# Output: 402 Payment Required (without payment header)

curl "http://localhost:3000/reviews/top?dryRun=true"
# Output: ranked reviews (bypasses payment for testing)
```

## Buyer Agent

```bash
# Run autonomous agent loop
# Requires: API server running on :8000, VENICE_API_KEY in .env
python -m api.agent.buyer_agent
# Output: "[AGENT] Agent starting autonomous loop"
# Cycles every 60s: fetch → score → select → complete

# Env vars:
#   API_BASE_URL=http://localhost:8000  (default)
#   VENICE_API_KEY=<required for scoring>
```

## Filecoin Bridge (NOT YET IMPLEMENTED)

```bash
# Will run on port 3001
# Requires: FILECOIN_PRIVATE_KEY, @filecoin-synapse/sdk
# bun run filecoin-bridge/index.js
# Python service expects bridge at FILECOIN_BRIDGE_URL=http://localhost:3001
```

## Git

```bash
# Push to private repo
git add <files>
git commit -m "short clear message"
git push origin main

# Before submission: make repo public
# GitHub Settings → Danger Zone → Change visibility → Public
```

## Synthesis Hackathon API

```bash
# Check team status
curl -s "https://synthesis.devfolio.co/teams/baacd78ca8d44b7b97e48ed8bdc1b9db" \
  -H "Authorization: Bearer $SYNTHESIS_API_KEY"

# Create draft project
curl -s -X POST "https://synthesis.devfolio.co/projects" \
  -H "Authorization: Bearer $SYNTHESIS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"teamUUID":"baacd78ca8d44b7b97e48ed8bdc1b9db","name":"StakeHumanSignal",...}'

# Browse tracks
curl -s "https://synthesis.devfolio.co/catalog?page=1&limit=50"
```

## Full Stack (run all services)

```bash
# Terminal 1: API
uvicorn api.main:app --reload --port 8000

# Terminal 2: x402 gateway
bun run x402-server/index.js

# Terminal 3: Buyer agent
python -m api.agent.buyer_agent

# Terminal 4: Frontend (when built)
# cd frontend && bun run dev
```
