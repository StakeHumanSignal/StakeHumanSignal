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
**FINAL: Demo video → OpenServ → x402 CDP → Submit via Synthesis API**
- Olas: 12 on-chain TXs on Base mainnet (deposit + 12 mech requests, all on Basescan)
- Lido MCP: 11 tools, real Ethereum mainnet reads, 11/11 live test
- FOC: real PieceCID on Filecoin calibration with USDFC payment
- distributeYield TX proven on-chain
- Tests: 91 Solidity + 71 Python + 5 frontend + 12 Lido MCP + 6 MCP + 6 FOC
- TODO: OpenServ rebuild, x402 CDP real verification, demo video, submit

### Tracks (10 + Open)
1. Virtuals ERC-8183 — $2,000 — STRONG
2. Protocol Labs ERC-8004 — $4,000 — GOOD (3 registries, real receipt mint)
3. Lido stETH Treasury — $3,000 — PROVEN (distributeYield TX on Basescan)
4. Lido MCP Server — $5,000 — 11 tools, real Ethereum mainnet reads
5. Octant Mechanism Design — $1,000 — STRONG (sqrt staking, two-layer model)
6. Octant Data Collection — $1,000 — GOOD (agent + FOC + Lighthouse)
7. Filecoin Storage — $2,000 — REAL FOC (Synapse SDK, USDFC, PieceCID)
8. Olas Hire Agent — $1,000 — 12 ON-CHAIN TXs on Base mainnet
9. OpenServ Ship — $4,500 — TODO (1h rebuild)
10. Base x402 — $5,000 — TODO (CDP keys obtained, need real verification)
11. Open Track — $28,000+

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
- `api/services/` — scorer, scorer_local, filecoin, olas, web3_client
- `api/agent/` — buyer_agent.py (autonomous loop, loads dotenv, queries Olas mech)
- `frontend/` — Next.js 16 + Tailwind 4 + RainbowKit (7 pages, shared nav-routes.ts)
- `filecoin-bridge/` — Filecoin Onchain Cloud bridge (@filoz/synapse-sdk, ESM)
- `lido-mcp/` — MCP server with 11 Lido tools, dual-provider (Ethereum mainnet + Base Sepolia)
- `stakesignal-mcp/` — MCP server with 5 StakeHumanSignal tools (all hit live API)
- `olas-mech/` — Olas track docs (code in api/services/olas.py, proof in deployments/)
- `scripts/` — deploy, wire, e2e test, seed, check-treasury, distribute-yield, olas-batch
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
- createJob: 0x3dee4cc1... (Base Sepolia block 39156980)
- receiptMinted: 0x3740a500... (Base Sepolia block 39156981)
- depositPrincipal: 0x3a7bc31e... (Base Sepolia block 39211824)
- distributeYield: 0x30ad2db8... (Base Sepolia block 39211827)
- FOC deposit: 0x244c2a1d... (Filecoin calibration block 3562333)
- Olas deposit: 0x16da2190... (Base mainnet)
- Olas mech requests: 12 TXs on Base mainnet (see deployments/olas-mech-proof.json)

### On-chain TX logging rule
When any script or command produces a successful on-chain transaction:
1. Add the TX hash + description + block number to the "Proof-of-Work Transactions" table in `README.md`
2. Add the TX hash to the "On-Chain Proof TXs" list in this file (`agent/CLAUDE.md`)
3. If it produces a CID, add it to the Filecoin evidence section in `README.md`
4. Update `deployments/sepolia-e2e-proof.json` or `deployments/treasury-yield-proof.json` as appropriate

### DO NOT touch
- contracts/ (deployed on Sepolia — any change requires redeploy)
- deployments/ (evidence for judges)
- frontend design/colors/fonts (Obsidian Architect theme finalized)
