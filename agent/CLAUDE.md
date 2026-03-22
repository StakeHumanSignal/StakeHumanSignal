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
**Phase 5: Fix 3 integration failures**
1. Force Railway redeploy (x402 gate + /sessions/passive not live)
2. Set LIGHTHOUSE_API_KEY on Railway (Filecoin CIDs returning None)
3. Add distribution_model to OutcomeResponse
3. README updated with Two-Layer Human Signal section
4. 162 tests passing (91 Solidity + 71 Python)

### Tracks (7 + Open)
1. Virtuals ERC-8183 (90% weight — core product)
2. Protocol Labs ERC-8004 (85% — 3 registries)
3. Lido stETH Treasury (75% — principal locked, yield-only)
4. Lido MCP Server (45% — 9 tools, mock mode)
5. Base x402 (70% — payment gate)
6. Filecoin Storage (65% — real Lighthouse CIDs)
7. Open Track (100% — full system)

### Package Management
- Use `bun add` for JS packages, `pip install` for Python
- Use `npx hardhat` for compile/deploy/verify (NOT bun — Hardhat native module issue)

### Key Commands
- Compile: `npx hardhat compile`
- Test: `npx hardhat test` (91 passing) + `python -m pytest test/ -v` (71 passing)
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
- `api/services/` — scorer, scorer_local, filecoin (Lighthouse), bankr, locus, olas, web3_client
- `api/agent/` — buyer_agent.py (autonomous loop with --once flag)
- `frontend/` — Next.js 16 + Tailwind + RainbowKit (7 pages)
- `x402-server/` — Express x402 payment gateway (manual 402 gate)
- `filecoin-bridge/` — Filecoin storage bridge + x402 gateway
- `lido-mcp/` — MCP server with 9 Lido tools + vault monitor
- `stakesignal-mcp/` — MCP server with 5 StakeHumanSignal tools
- `openserv-worker/` — OpenServ agent worker (4 capabilities)
- `scripts/` — deploy, wire, e2e test, seed, verify
- `agent/` — project docs (CLAUDE.md, memory.md, files.md, tools.md, skills/)
- `docs/` — gitignored specs (hackathon.md, aim-tracks.md, design.md, etc.)

### Live URLs
- Frontend: https://stakehumansignal.vercel.app
- API: https://stakesignal-api-production.up.railway.app
- GitHub: https://github.com/StakeHumanSignal/StakeHumanSignal

### Contracts (Base Sepolia)
- StakeHumanSignalJob: 0xE99027DDdF153Ac6305950cD3D58C25D17E39902
- LidoTreasury: 0x8E29D161477D9BB00351eA2f69702451443d7bf5
- ReceiptRegistry: 0xa39c7b475b0708a9854052Fb3Fbc93ccBf656332
- SessionEscrow: 0xe817C338aD7612184CFB59AeA7962905b920e2e9

### DO NOT touch
- contracts/ (deployed on Sepolia — any change requires redeploy)
- deployments/ (evidence for judges)
- frontend design/colors/fonts (Obsidian Architect theme finalized)
- scorer.py — OK to modify (no redeploy needed, logic is off-chain)
