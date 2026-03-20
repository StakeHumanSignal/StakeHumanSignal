# StakeHumanSignal — External Tools & Services

## Smart Contract Tooling

### Hardhat
- **What:** Solidity compiler, deployer, verifier, test runner
- **Used in:** `hardhat.config.js`, `scripts/deploy.js`, `npx hardhat compile|test|verify`
- **Install:** `bun add -d hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-verify`
- **Docs:** https://hardhat.org/docs
- **Env vars:** PRIVATE_KEY, BASE_RPC_URL, BASESCAN_API_KEY
- **Note:** MUST run with `npx hardhat`, NOT `bun`

### OpenZeppelin Contracts v5.6.1
- **What:** Audited Solidity base contracts (ERC721, Ownable, ReentrancyGuard, SafeERC20)
- **Used in:** All 3 .sol contracts import from @openzeppelin/contracts
- **Install:** `bun add @openzeppelin/contracts`
- **Docs:** https://docs.openzeppelin.com/contracts/5.x/

### Ethers.js v6
- **What:** Ethereum library for deploy script
- **Used in:** `scripts/deploy.js` (via Hardhat), `x402-server/index.js`
- **Install:** `bun add ethers`
- **Docs:** https://docs.ethers.org/v6/

## Blockchain

### Base Mainnet (Chain ID: 8453)
- **What:** L2 deployment target for all contracts
- **Used in:** hardhat.config.js networks, web3_client.py
- **RPC:** https://mainnet.base.org
- **Explorer:** https://basescan.org
- **Env var:** BASE_RPC_URL

### USDC on Base
- **Address:** `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Used in:** StakeHumanSignalJob.sol (stake token), deploy.js
- **What:** Payment token for review stakes

### wstETH on Base (Lido)
- **Address:** `0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452`
- **Used in:** LidoTreasury.sol (yield-bearing asset), deploy.js
- **Docs:** https://docs.lido.fi/guides/lido-tokens-integration-guide/

## Payment

### x402 Protocol (Coinbase)
- **What:** HTTP 402 micropayment protocol. Protects /reviews/top endpoint
- **Used in:** `x402-server/index.js` (server-side gate), `api/agent/buyer_agent.py` (client-side)
- **Install (JS):** `bun add @x402/core @x402/evm @x402/express`
- **Install (Python):** `pip install x402`
- **Docs:** https://github.com/coinbase/x402
- **Spec:** https://github.com/coinbase/x402/blob/main/specs/x402-specification.md
- **Env vars:** CDP_API_KEY_ID, CDP_API_KEY_SECRET, RECEIVER_ADDRESS
- **Keys from:** https://portal.cdp.coinbase.com

## Storage

### Filecoin FOC (Synapse SDK)
- **What:** Permanent decentralized storage for review outcomes
- **Used in:** `api/services/filecoin.py` (Python bridge client), planned Node.js bridge on :3001
- **Install:** `bun add @filecoin-synapse/sdk`
- **Docs:** https://docs.filecoin.cloud/developer-guides/synapse/
- **Env var:** FILECOIN_PRIVATE_KEY
- **Status:** Bridge not yet built — filecoin.py calls http://localhost:3001 which doesn't exist yet

## AI / LLM

### Venice AI
- **What:** Private LLM inference for review scoring. OpenAI-compatible API
- **Used in:** `api/services/venice.py` — calls llama-3.3-70b for scoring
- **Install:** None (direct REST calls via httpx)
- **Base URL:** `https://api.venice.ai/api/v1`
- **Endpoint:** POST /chat/completions
- **Docs:** https://docs.venice.ai
- **Env var:** VENICE_API_KEY
- **Keys from:** https://venice.ai/settings/api
- **Model:** llama-3.3-70b (also available: qwen2.5-coder-32b for code reviews)

## Python Backend

### FastAPI
- **What:** Async Python web framework for API server
- **Used in:** `api/main.py`, all route files
- **Install:** `pip install fastapi uvicorn`
- **Docs:** https://fastapi.tiangolo.com
- **Run:** `uvicorn api.main:app --reload --port 8000`

### web3.py v7
- **What:** Python Ethereum library for contract interactions
- **Used in:** `api/services/web3_client.py`
- **Install:** `pip install web3 eth-account`
- **Docs:** https://web3py.readthedocs.io
- **Env var:** PRIVATE_KEY, BASE_RPC_URL

### httpx
- **What:** Async HTTP client for Venice API + Filecoin bridge calls
- **Used in:** `api/services/venice.py`, `api/services/filecoin.py`, `api/agent/buyer_agent.py`
- **Install:** `pip install httpx`

## Node.js Services

### Express
- **What:** HTTP server for x402 payment gateway
- **Used in:** `x402-server/index.js`
- **Install:** `bun add express`

### http-proxy-middleware
- **What:** Proxies non-x402 routes to FastAPI backend
- **Used in:** `x402-server/index.js`
- **Install:** `bun add http-proxy-middleware` (in x402-server/)

## Hackathon

### Synthesis API
- **What:** Hackathon registration, team management, project submission
- **Base URL:** https://synthesis.devfolio.co
- **Env var:** SYNTHESIS_API_KEY (`sk-synth-...`)
- **Docs:** https://synthesis.md/skill.md (registration), https://synthesis.md/submission/skill.md (submission)

## ERC Standards

| Standard | Spec | Usage in Project |
|----------|------|-----------------|
| ERC-8183 | https://eips.ethereum.org/EIPS/eip-8183 | Job lifecycle in StakeHumanSignalJob.sol |
| ERC-8004 | https://eips.ethereum.org/EIPS/eip-8004 | Receipt NFTs in ReceiptRegistry.sol |
| ERC-2612 | https://eips.ethereum.org/EIPS/eip-2612 | Gasless USDC permit (planned, not yet implemented) |
