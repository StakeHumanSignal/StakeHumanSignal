# StakeHumanSignal — File Map

## Root Config

| File | Purpose | Details |
|------|---------|---------|
| `package.json` | JS dependencies + scripts | Hardhat, OpenZeppelin, x402, ethers, express. Scripts: compile, test, deploy:base, deploy:testnet, x402 |
| `hardhat.config.js` | Solidity compiler + network config | Solidity 0.8.28, Cancun EVM, Base Mainnet (8453) + Base Sepolia (84532). Reads PRIVATE_KEY, BASE_RPC_URL, BASESCAN_API_KEY from .env |
| `requirements.txt` | Python deps | fastapi, uvicorn, httpx, web3, eth-account, pydantic, x402, python-dotenv |
| `.env.example` | Env var template | 9 vars: PRIVATE_KEY, BASE_RPC_URL, FILECOIN_PRIVATE_KEY, VENICE_API_KEY, CDP_API_KEY_ID, CDP_API_KEY_SECRET, RECEIVER_ADDRESS, SYNTHESIS_API_KEY, BASESCAN_API_KEY |
| `.gitignore` | Git exclusions | docs/, node_modules/, bun.lockb, .env, __pycache__, artifacts/, cache/ |
| `agent.json` | Agent identity manifest | Required by Protocol Labs track. Name, capabilities, standards, endpoints, on-chain contract addresses. Has FILL_AFTER_DEPLOY placeholders |
| `AGENTS.md` | Agent interface docs | Endpoint list, on-chain addresses, ERC standards, safety guardrails. Has FILL_AFTER_DEPLOY placeholders |
| `README.md` | Repo README | Architecture diagram, tech stack, quick start. Still references npm (should update to bun) |
| `addresses.json` | (generated) | Created by deploy script. Contains deployed contract addresses, deployer, token addresses |

## Smart Contracts (`contracts/`)

| File | Purpose | Key Functions | Depends On |
|------|---------|---------------|------------|
| `StakeHumanSignalJob.sol` | ERC-8183 job lifecycle | `createJob(spec)`, `fund(jobId, amount)`, `submit(jobId, hash)`, `complete(jobId)`, `reject(jobId)` | IERC8183, IERC20 (USDC), Ownable, ReentrancyGuard |
| `LidoTreasury.sol` | wstETH yield treasury | `depositPrincipal(amount)`, `distributeYield(winner, amount)`, `receiveStake(reviewer, amount)`, `availableYield()` | IERC20 (wstETH, USDC), Ownable, ReentrancyGuard |
| `ReceiptRegistry.sol` | ERC-8004 receipt NFTs | `mintReceipt(jobId, winner, apiUrl, outcome, cid)`, `getReceipt(tokenId)`, `totalReceipts()` | ERC721, Ownable |
| `interfaces/IERC8183.sol` | ERC-8183 interface | JobStatus enum, 5 events, 6 functions | — |
| `interfaces/IWstETH.sol` | Lido wstETH interface | wrap, unwrap, rate conversion | IERC20 |

**Contract wiring (done in deploy.js):**
- StakeHumanSignalJob → sets LidoTreasury + ReceiptRegistry addresses
- LidoTreasury → whitelists StakeHumanSignalJob + deployer
- ReceiptRegistry → grants minter role to StakeHumanSignalJob + deployer

## Deploy Scripts (`scripts/`)

| File | Purpose | Details |
|------|---------|---------|
| `deploy.js` | Deploy all 3 contracts + wire them | Deploys to Base Mainnet using USDC (0x8335...) and wstETH (0xc1CB...). Saves addresses.json. 8 transactions total (3 deploys + 5 config calls) |

## Python API (`api/`)

| File | Purpose | Endpoints / Exports |
|------|---------|---------------------|
| `main.py` | FastAPI app entry | Mounts /reviews, /jobs, /outcomes routers. GET /, GET /health |
| `routes/reviews.py` | Review CRUD + ranking | POST /reviews, GET /reviews, GET /reviews/top, GET /reviews/{id}. In-memory `reviews_db` dict |
| `routes/jobs.py` | ERC-8183 job management | POST /jobs, GET /jobs, GET /jobs/{id}. Calls web3_client. In-memory `jobs_db` dict |
| `routes/outcomes.py` | Winner signaling | POST /outcomes. Triggers: complete_job → mint_receipt → store_on_filecoin. Imports from web3_client, venice, reviews |
| `services/web3_client.py` | Base Mainnet contract calls | `Web3Service` class: create_job, complete_job, mint_receipt, distribute_yield. Reads addresses.json + Hardhat artifacts for ABIs. Singleton via `get_web3_service()` |
| `services/venice.py` | Private LLM scoring | `score_review_privately(review_text, api_output)` → {score: 0-100, reasoning}. Calls Venice llama-3.3-70b. Needs VENICE_API_KEY |
| `services/filecoin.py` | Filecoin FOC bridge client | `store_on_filecoin(data)` → CID, `retrieve_from_filecoin(cid)` → data. Calls Node.js bridge on FILECOIN_BRIDGE_URL (:3001) |
| `services/scorer.py` | Review ranking algorithm | `rank_reviews(reviews)` → sorted by composite_score (stake * score/100 * win_rate) |
| `agent/buyer_agent.py` | Autonomous buyer loop | 60s cycles: fetch_top_reviews → score_with_venice → complete_and_reward. Writes agent_log.json. Reads API_BASE_URL env |

## x402 Gateway (`x402-server/`)

| File | Purpose | Details |
|------|---------|---------|
| `index.js` | Express payment proxy | Port 3000 (X402_PORT). GET /reviews/top returns 402 without payment header. ?dryRun=true bypasses. All other routes proxy to FastAPI (API_BACKEND, default :8000) |
| `package.json` | x402 server deps | express, http-proxy-middleware |

## Documentation (`docs/` — gitignored)

| File | Purpose |
|------|---------|
| `STAKEHUMANSIGNAL_PROJECT.md` | Master project spec. Prize tracks, tech stack, build order, submission checklist, all reference links |

## Generated at Runtime

| File | Created By | Purpose |
|------|-----------|---------|
| `addresses.json` | deploy.js | Deployed contract addresses |
| `agent_log.json` | buyer_agent.py | Agent decision log (required for submission) |
| `artifacts/` | hardhat compile | Contract ABIs (read by web3_client.py) |
| `cache/` | hardhat compile | Solidity compiler cache |
