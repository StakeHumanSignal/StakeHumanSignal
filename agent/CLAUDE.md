## SECURITY — READ THIS FIRST, EVERY SESSION

### Hard rules — never violate these:
- NEVER hardcode private keys, API keys, mnemonics, or secrets anywhere in code. Always use `os.getenv()` in Python, `process.env` in JS. If a value looks like a key, it goes in `.env`.
- NEVER log private keys, seeds, or secrets to console, files, or `agent_log.json` — even in error handlers.
- NEVER commit `.env` files. Check `.gitignore` before every commit.
- NEVER use `tx.origin` for authorization in Solidity — use `msg.sender`.
- NEVER send ETH/tokens before updating state (checks-effects-interactions).
- ALWAYS validate inputs: check for `address(0)`, zero amounts, empty strings before processing.
- ALWAYS use OpenZeppelin `ReentrancyGuard` on any function that transfers tokens or ETH.
- BEFORE every git commit, run: `git diff --staged | grep -i "private\|secret\|key\|mnemonic\|0x[a-fA-F0-9]{64}"` and abort if anything matches.

### Git rules:
- Always push with: `git push org main`
- Local branch is `main` (renamed from org-main)
- Never use org-main as a branch name

---

## Project: StakeHumanSignal

Staked human feedback marketplace on Base Sepolia. ERC-8183 + ERC-8004 + x402.

### Current Sprint Goal
**FINAL: Demo video → Submit via Synthesis API**
- All critical bugs fixed — Lido MCP ratios use real RPC, FOC integrated, buyer agent runs clean
- distributeYield TX on-chain: `0x30ad2db8...` (block 39211827)
- FOC upload proven: PieceCID `bafkzcibcduch6lsgmz3rpfq6uhjibwca2lofa6r43ppgul6gqy7vlut7mxsj4ny`
- 3 validate sessions seeded, live on Railway
- Tests: 91 Solidity + 71 Python + 5 frontend + 13 MCP + 6 FOC = 186 total
- TODO: Record 2-min demo video, submit via Synthesis API

### Tracks (10 + Open + Student)
1. Virtuals ERC-8183 — $2,000 — STRONG
2. Protocol Labs ERC-8004 — $4,000 — GOOD (real receipt mint on-chain)
3. Protocol Labs Agent Cook — $4,000 — GOOD (131+ log entries, real decisions)
4. Lido stETH Treasury — $3,000 — FIXED (distributeYield TX proven)
5. Lido MCP Server — $5,000 — FIXED (9 tools, real RPC calls, no hardcoded ratios)
6. Base x402 — $5,000 — ACCEPTED (correct 402 format, verification theatrical)
7. Octant Mechanism Design — $1,000 — STRONG (sqrt staking, two-layer model)
8. Octant Data Collection — $1,000 — GOOD (5-dimension rubric, Lighthouse CIDs)
9. Filecoin Storage — $2,000 — REAL FOC (Synapse SDK, USDFC payment, PieceCID proven)
10. Open Track — $28,000+ — GOOD (full system)
11. Student Founder — $500 + travel — ELIGIBLE (student ID ready)

### Package Management
- Use `bun add` for JS packages, `pip install` for Python
- Use `npx hardhat` for compile/deploy/verify (NOT bun — Hardhat native module issue)

### Key Commands
- Compile: `npx hardhat compile`
- Test Solidity: `npx hardhat test` (91 passing)
- Test Python: `python -m pytest test/ -v` (71 passing, 52% coverage)
- Test Frontend: `cd frontend && bun run test` (5 passing)
- Test MCP: `cd lido-mcp && npm test` + `cd stakesignal-mcp && npm test` (13 passing)
- Test FOC: `cd filecoin-bridge && npm test` (6 passing)
- Test All: `npm run test:all`
- Deploy Sepolia: `npx hardhat run scripts/deploy-sepolia.js --network base-sepolia`
- API: `uvicorn api.main:app --reload --port 8000`
- Agent: `python -m api.agent.buyer_agent --once`
- Frontend: `cd frontend && bun dev`
- Filecoin bridge: `cd filecoin-bridge && node index.js`
- Lido MCP: `cd lido-mcp && node index.js`
- StakeSignal MCP: `cd stakesignal-mcp && node index.js`

### Architecture
- `contracts/` — 4 Solidity contracts (ERC-8183 Job, Lido Treasury, ERC-8004 Registry, SessionEscrow)
- `api/` — Python FastAPI backend (reviews, jobs, outcomes, sessions, agent, leaderboard)
- `api/services/` — scorer, scorer_local, filecoin (Lighthouse + FOC bridge), web3_client
- `api/agent/` — buyer_agent.py (autonomous loop with --once flag, loads dotenv)
- `frontend/` — Next.js 16 + Tailwind 4 + RainbowKit (7 pages, shared nav-routes.ts)
- `x402-server/` — Express x402 payment gateway (manual 402 gate)
- `filecoin-bridge/` — Filecoin Onchain Cloud bridge (@filoz/synapse-sdk, ESM)
- `lido-mcp/` — MCP server with 9 Lido tools + vault monitor (real RPC, no hardcoded ratios)
- `stakesignal-mcp/` — MCP server with 5 StakeHumanSignal tools
- `scripts/` — deploy, wire, e2e test, seed, check-treasury, distribute-yield
- `agent/` — project docs (CLAUDE.md, memory.md, files.md, tools.md, skills/)
- `docs/` — gitignored specs (honest-audit, aim-tracks, design, presubmission)
- `.github/workflows/ci.yml` — 4 CI jobs (solidity, python, frontend, security)

### Live URLs
- Frontend: https://stakehumansignal.vercel.app
- API: https://stakesignal-api-production.up.railway.app
- GitHub: https://github.com/StakeHumanSignal/StakeHumanSignal

### Contracts (Base Sepolia)
- StakeHumanSignalJob: 0xE99027DDdF153Ac6305950cD3D58C25D17E39902
- LidoTreasury (original): 0x8E29D161477D9BB00351eA2f69702451443d7bf5 (dummy wstETH — unusable)
- LidoTreasury (fresh + yield proof): 0x639bBbE3D9624b96a7b6aC9a0A95493642bf2b72
- ReceiptRegistry: 0xa39c7b475b0708a9854052Fb3Fbc93ccBf656332
- SessionEscrow: 0xe817C338aD7612184CFB59AeA7962905b920e2e9

### On-Chain Proof TXs
- createJob: 0x3dee4cc1... (block 39156980)
- receiptMinted: 0x3740a500... (block 39156981)
- depositPrincipal: 0x3a7bc31e... (block 39211824)
- distributeYield: 0x30ad2db8... (block 39211827)
- FOC deposit: 0x244c2a1d... (Filecoin calibration block 3562333)

### DO NOT touch
- contracts/ (deployed on Sepolia — any change requires redeploy)
- deployments/ (evidence for judges)
- frontend design/colors/fonts (Obsidian Architect theme finalized)
