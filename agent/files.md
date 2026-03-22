# StakeHumanSignal — File Map

## Root Config

| File | Purpose |
|------|---------|
| package.json | JS deps (Hardhat, OpenZeppelin, x402, ethers) |
| hardhat.config.js | Solidity 0.8.28, Cancun EVM, Base Sepolia + Mainnet |
| requirements.txt | Python deps (fastapi, uvicorn, httpx, web3, lighthouseweb3) |
| .env.example | All env vars template |
| .gitignore | Exclusions (docs/, .env, node_modules, api/data/*) |
| .dockerignore | Docker build exclusions (frontend, contracts, tests) |
| Dockerfile | python:3.11-slim for Railway deploy |
| railway.toml | Railway build config (dockerfile builder) |
| agent.json | Agent identity manifest (v2.0, real addresses) |
| agent_log.json | Agent decision log (131+ entries, real Lighthouse CIDs) |
| AGENTS.md | Agent interface docs (endpoints, contracts, safety) |
| README.md | Repo README with Mermaid diagrams |

## Smart Contracts (contracts/)

| File | Purpose |
|------|---------|
| StakeHumanSignalJob.sol | ERC-8183 job lifecycle + independence check |
| LidoTreasury.sol | wstETH yield-only treasury (principal locked forever) |
| ReceiptRegistry.sol | ERC-8004 receipts + ownership mapping + reputation + independence score |
| SessionEscrow.sol | Blind A/B compare escrow (USDC, 7-day expiry, 10% fee) |
| interfaces/IERC8183.sol | ERC-8183 interface |
| interfaces/IWstETH.sol | Lido wstETH interface |
| mocks/MockERC20.sol | Test mock token |

## Deploy Scripts (scripts/)

| File | Purpose |
|------|---------|
| deploy.js | Deploy 3 contracts to Base Mainnet |
| deploy-sepolia.js | Deploy 3 contracts to Base Sepolia |
| deploy-escrow-sepolia.js | Deploy SessionEscrow to Base Sepolia |
| deploy-and-e2e-sepolia.js | Fresh deploy + full E2E test |
| finish-e2e-sepolia.js | Finish E2E after partial deploy |
| wire-sepolia.js | Wire contracts on Sepolia |
| e2e-test-sepolia.js | End-to-end test |
| seed.py | POST 5 reviews to API for demo data |
| seed_file.py | Generate seed JSON file directly |
| verify_keys.py | Test API keys (Bankr, Locus, OpenServ, Lighthouse) |
| locus_register.py | Register agent with Locus |
| olas_batch.py | Send 12 Olas mech requests |

## Python API (api/)

| File | Purpose |
|------|---------|
| main.py | FastAPI app (6 routers: reviews, jobs, outcomes, sessions, agent, leaderboard) |
| routes/reviews.py | Review CRUD + structured claims + Filecoin storage + JSON persistence |
| routes/jobs.py | ERC-8183 job management |
| routes/outcomes.py | Winner signaling + yield distribution + two-layer calc + Locus payment |
| routes/sessions.py | Blind A/B compare sessions (open, outputs, settle) |
| routes/agent.py | GET /agent/log (serves agent_log.json) |
| routes/leaderboard.py | GET /leaderboard (aggregates reviewer stats) |
| services/web3_client.py | Base contract calls via web3.py |
| services/scorer.py | Retrieval score + payout score + two-layer yield + independence + rank |
| services/scorer_local.py | Heuristic 5-dim rubric scorer (replaced Venice) |
| services/filecoin.py | Lighthouse SDK (real CIDs) + bridge fallback |
| services/bankr.py | Bankr LLM Gateway ensemble scoring |
| services/locus.py | Locus payment infrastructure (balance, send) |
| services/olas.py | Olas mech-client wrapper (demo/live modes) |
| agent/buyer_agent.py | Autonomous loop: fetch → score → bankr → olas → complete/reject → pin |
| data/reviews.json | Persisted review data (survives restarts) |

## Frontend (frontend/)

| File | Purpose |
|------|---------|
| src/app/page.tsx | Landing — hero, stats, ticker, protocol architecture |
| src/app/marketplace/page.tsx | Review cards, confidence bars, filter, live feed |
| src/app/submit/page.tsx | Rubric sliders, wallet connect, structured reasoning |
| src/app/agent-feed/page.tsx | Terminal-style agent decision log |
| src/app/leaderboard/page.tsx | Validator table, holographic profile |
| src/app/validate/page.tsx | Blind A/B compare for Human B |
| src/app/town-square/page.tsx | Town square visualization |
| src/app/layout.tsx | Obsidian Architect layout (sidebar, topbar, terminal bar) |
| src/app/globals.css | Design system (colors, glass effects, animations) |
| src/lib/api.ts | API client (Railway URL fallback) |
| src/lib/wagmi.ts | RainbowKit + wagmi config (Base Sepolia) |
| src/components/Providers.tsx | WagmiProvider + RainbowKit wrapper |
| src/components/TopBar.tsx | Navbar with wallet connect |
| src/components/SideNav.tsx | Collapsible sidebar |
| src/components/WalletDisplay.tsx | Connect wallet button |

## Node Services

| File | Purpose |
|------|---------|
| x402-server/index.js | Express x402 gateway (SDK + manual fallback, port 3000) |
| filecoin-bridge/index.js | Filecoin FOC bridge (Synapse SDK, ESM, port 3001) |
| filecoin-bridge/filecoin-bridge.test.js | 6 FOC integration tests |
| lido-mcp/index.js | MCP server (11 Lido tools, dual-provider: Ethereum mainnet + Base Sepolia) |
| lido-mcp/contracts.js | ETH_MAINNET + ETH_HOLESKY + BASE addresses, verified from docs.lido.fi |
| lido-mcp/vault-monitor.js | Treasury health monitoring + alerts |
| lido-mcp/lido.skill.md | Agent skill file with Lido mental model (rebasing, wstETH vs stETH) |
| lido-mcp/live-test.js | Live integration test — calls all 11 tools with real RPCs |
| lido-mcp/lido-mcp.test.js | 12 tests including live Ethereum mainnet read |
| stakesignal-mcp/index.js | MCP server (5 StakeHumanSignal tools) |
| stakesignal-mcp/stakesignal.skill.md | Agent-consumable skill file |
| openserv-worker/index.js | OpenServ agent (DROPPED — code kept for reference) |

## Tests (test/)

| File | Tests |
|------|-------|
| StakeHumanSignalJob.test.js | 26 tests |
| LidoTreasury.test.js | 20 tests |
| ReceiptRegistry.test.js | 17 tests |
| ReceiptRegistry.independence.test.js | 15 tests |
| SessionEscrow.test.js | 13 tests |
| test_review_schema.py | 20 tests |
| test_task_intent.py | 16 tests |
| test_filecoin.py | 7 tests |
| test_buyer_agent.py | 7 tests |
| test_scorer.py | 13 tests |
| test_integration.py | 8 tests |
| **Total** | **162 tests (91 Solidity + 71 Python)** |

## Deployments (deployments/)

| File | Purpose |
|------|---------|
| sepolia.json | 4 contract addresses on Base Sepolia |
| sepolia-e2e-proof.json | E2E proof with 8 tx hashes |

## Agent Docs (agent/)

| File | Purpose |
|------|---------|
| CLAUDE.md | Project brief + sprint goal + architecture |
| memory.md | Decision log across all phases |
| files.md | This file — codebase map |
| tools.md | External tools + services reference |
| commands.md | Shell commands for every task |
| DESIGN.md | Obsidian Architect design system |
| skills/ | Track-specific skill files (8 files) |
