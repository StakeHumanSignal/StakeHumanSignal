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

## Payment

### x402 Protocol
- Manual 402 gate on /reviews/top (0.001 USDC)
- Server: filecoin-bridge/x402-server.js (port 3002)
- Also: x402-server/index.js (legacy, port 3000)
- Public facilitator: https://x402.org/facilitator
- No CDP keys needed

## Storage

### Lighthouse (Filecoin/IPFS)
- Python SDK: `pip install lighthouseweb3`
- Stores on IPFS (instant) + Filecoin (background deal)
- Gateway: https://gateway.lighthouse.storage/ipfs/{CID}
- Env: LIGHTHOUSE_API_KEY
- Integration: api/services/filecoin.py

## Scoring

### Local Heuristic Scorer
- File: api/services/scorer_local.py
- Uses claim's rubric_scores directly when available
- Fallback: term matching + length heuristics
- No external API, no API key needed

### Bankr LLM Gateway (optional)
- URL: https://llm.bankr.bot/v1/chat/completions
- Auth: X-API-Key header
- OpenAI-compatible format
- Env: BANKR_API_KEY
- Integration: api/services/bankr.py
- Status: key exists, needs credits ($2 USDC on Base)

### Locus Payments (optional)
- URL: https://beta-api.paywithlocus.com
- USDC on Base, sponsored gas
- Env: LOCUS_API_KEY
- Integration: api/services/locus.py
- Status: key exists, 401 auth issue

### Olas mech-client (optional)
- SDK: pip install mech-client
- Python MarketplaceService for hiring agents
- Env: OLAS_MECH_ADDRESS
- Integration: api/services/olas.py
- Status: demo mode (0 live requests)

## MCP

### Lido MCP Server
- Location: lido-mcp/
- 9 tools: stake, unstake, wrap, unwrap, get_yield, distribute, vault_health, list_jobs, vote
- All write ops: dry_run=true default
- Vault monitor: lido-mcp/vault-monitor.js
- Skill file: lido-mcp/lido.skill.md

## Frontend

### Next.js 16 + Tailwind + RainbowKit
- Location: frontend/
- 7 pages: landing, marketplace, submit, agent-feed, leaderboard, validate, town-square
- Wallet connect: RainbowKit + wagmi v2 (Base Sepolia)
- Design: Obsidian Architect (cyan #8ff5ff, purple #ac89ff, mint #c5ffc9)
- API client: frontend/src/lib/api.ts → Railway fallback

## Deployment

### Railway (API)
- URL: https://stakesignal-api-production.up.railway.app
- Dockerfile: python:3.11-slim + uvicorn
- .dockerignore excludes frontend, contracts, node_modules

### Vercel (Frontend)
- URL: https://stakehumansignal.vercel.app
- Domain: stakehumansignal.vercel.app
- Env: NEXT_PUBLIC_API_URL → Railway URL

## Hackathon

### Synthesis
- Deadline: March 22, 2026 11:59 PM PT
- Team ID: baacd78ca8d44b7b97e48ed8bdc1b9db
- Submission API: https://synthesis.devfolio.co
- Track UUIDs: see docs/aim-tracks.md
