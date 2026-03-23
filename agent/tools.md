# StakeHumanSignal — External Tools & Services

## Smart Contract Tooling

### Hardhat
- Solidity compiler, deployer, test runner
- Run with `npx hardhat` (NOT bun — native module issue)
- Config: `hardhat.config.js`
- Networks: Base Sepolia (84532), Base Mainnet (8453)

### OpenZeppelin Contracts v5.x
- ERC721, Ownable, ReentrancyGuard, SafeERC20
- All contracts import from @openzeppelin/contracts

## Blockchain

### Base Sepolia (Chain ID: 84532)
- RPC: https://sepolia.base.org
- Explorer: https://sepolia.basescan.org
- USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
- wstETH: 0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452 (Base Mainnet)

### Filecoin Calibration (Chain ID: 314159)
- RPC: https://api.calibration.node.glif.io/rpc/v1
- Explorer: https://filecoin-testnet.blockscout.com
- USDFC: 0xb3042734b608a1B16e9e86B374A3f3e389B4cDf0
- USDFC obtained via CDP on Secured Finance (https://stg.usdfc.net)

## Payment

### x402 Protocol (real Coinbase SDK)
- Package: `x402[fastapi]` v2.5.0 (official Coinbase Python SDK)
- Server middleware: `PaymentMiddlewareASGI` in api/main.py
- Gate: GET /reviews/top requires 0.001 USDC on Base Sepolia (eip155:84532)
- Verification: real EIP-3009 signature verification via facilitator
- Facilitator: https://x402.org/facilitator (public testnet)
- Agent client: `EthAccountSigner` + `ExactEvmClientScheme` + `x402Client` in buyer_agent.py
- CDP keys: obtained (CDP_API_KEY_ID + CDP_API_KEY_SECRET)
- Skill doc: agent/skills/x402.skill.md

## Storage

### Filecoin Onchain Cloud (FOC) — PRIMARY
- SDK: `@filoz/synapse-sdk` v0.40.0
- Network: calibration (chain 314159) — same contracts as mainnet
- Bridge: filecoin-bridge/index.js (ESM, express + Synapse SDK)
- Deposit TX: 0x244c2a1d... (USDFC payment for storage)
- PieceCID: bafkzcibcduch6lsgmz3rpfq6uhjibwca2lofa6r43ppgul6gqy7vlut7mxsj4ny
- Tests: filecoin-bridge/filecoin-bridge.test.js (6 passing)

### Lighthouse (IPFS/Filecoin) — SECONDARY
- Python SDK: `pip install lighthouseweb3`
- Gateway: https://gateway.lighthouse.storage/ipfs/{CID}
- Env: LIGHTHOUSE_API_KEY
- Integration: api/services/filecoin.py (used by buyer_agent for log pinning)
- Status: working, real Qm... CIDs confirmed

## Scoring

### Local Heuristic Scorer
- File: api/services/scorer_local.py
- Uses claim's rubric_scores directly when available
- Fallback: term matching + length heuristics
- No external API, no API key needed

### Olas Mech-Client (external intelligence)
- Package: `pip install mech-client` (v0.20.0+, Python 3.10-3.11)
- File: api/services/olas.py
- Chain: Base mainnet (8453), mech #112 at 0xe535d7ac...
- Integration: buyer_agent queries mech for supplementary scoring
- Requires: ethereum_private_key.txt (gitignored) + ETH on Base for gas
- Deposit: prepaid balance via DepositService (must override internal RPC)
- Gotcha: default llamarpc returns 0 balance — override to mainnet.base.org
- Proof: 12 on-chain TXs in deployments/olas-mech-proof.json
- Track folder: olas-mech/ with README + skill.md

## MCP

### Lido MCP Server
- Location: lido-mcp/
- 11 tools (was 9): stake_eth, balance, treasury_deposit, get_yield_balance, distribute_yield, get_vault_health, list_jobs, unstake, wrap, unwrap, vote
- Dual-provider architecture: Ethereum mainnet for Lido + Base Sepolia for treasury
- lido_stake_eth calls real stETH.submit() on Ethereum mainnet
- lido_balance reads real stETH + wstETH balances from Ethereum mainnet
- All dry_run paths read live chain state (no hardcoded ratios)
- Verified: 1 stETH = 0.813 wstETH, 199 DAO votes, withdrawal #118573
- Skill file: lido-mcp/lido.skill.md (includes Lido mental model, rebasing explainer)
- Tests: lido-mcp/lido-mcp.test.js (12 passing, including live mainnet read)
- Live test: lido-mcp/live-test.js (11/11 tools passing against real RPCs)
- Fresh treasury: 0x639bBbE3D9624b96a7b6aC9a0A95493642bf2b72 (0.5 principal, 0.2 yield)

### StakeSignal MCP Server
- Location: stakesignal-mcp/
- 5 tools: get_ranked_reviews, submit_passive_selection, stake_on_review, get_leaderboard, check_agent_decisions
- Hits live Railway API
- Skill file: stakesignal-mcp/stakesignal.skill.md
- Tests: stakesignal-mcp/stakesignal-mcp.test.js (6 passing)

## Frontend

### Next.js 16 + Tailwind 4 + RainbowKit
- Location: frontend/
- 7 pages: landing, marketplace, submit, agent-feed, leaderboard, validate, town-square
- Shared nav routes: frontend/src/lib/nav-routes.ts (single source of truth)
- Wallet connect: RainbowKit + wagmi v2 (Base Sepolia)
- Design: Obsidian Architect (cyan #8ff5ff, purple #ac89ff, mint #c5ffc9)
- API client: frontend/src/lib/api.ts → Railway fallback
- Tests: vitest (5 nav consistency) + Playwright scaffold (not run)

## Deployment

### Railway (API)
- URL: https://stakesignal-api-production.up.railway.app
- Dockerfile: python:3.11-slim + uvicorn
- .dockerignore excludes frontend, contracts, node_modules

### Vercel (Frontend)
- URL: https://stakehumansignal.vercel.app
- Connected to: github.com/StakeHumanSignal/StakeHumanSignal
- Root directory: frontend
- Framework: Next.js
- Auto-deploys on push to main

## CI

### GitHub Actions
- File: .github/workflows/ci.yml
- 4 jobs: solidity-tests, python-tests, frontend-tests, security-scan
- Runs on push/PR to main

## Hackathon

### Synthesis
- Deadline: March 22, 2026 11:59 PM PT / March 23, 2026 2:59 PM MYT
- Team ID: baacd78ca8d44b7b97e48ed8bdc1b9db
- Submission API: https://synthesis.devfolio.co
- Track UUIDs: see docs/aim-tracks.md and agent/skills/submission.md
