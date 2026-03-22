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

### x402 Protocol
- Manual 402 gate on /reviews/top (0.001 USDC)
- Server: x402-server/index.js (port 3000)
- FastAPI inline gate: api/routes/reviews.py line 210
- Verification: checks header presence (theatrical — no crypto verification)
- CDP keys blocked (2FA issue from Malaysia)

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

## MCP

### Lido MCP Server
- Location: lido-mcp/
- 9 tools: stake, unstake, wrap, unwrap, get_yield, distribute, vault_health, list_jobs, vote
- All write ops: dry_run=true default
- dry_run reads REAL chain state via RPC (no hardcoded ratios)
- Vault monitor: lido-mcp/vault-monitor.js
- Skill file: lido-mcp/lido.skill.md
- Tests: lido-mcp/lido-mcp.test.js (7 passing)

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
