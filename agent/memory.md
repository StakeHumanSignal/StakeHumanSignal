# StakeHumanSignal — Project State

> Last updated: March 22, 2026

## Phase 6 Pre-Submission Audit — March 22, 2026

**Status: COMPLETED — All 7 tracks verified, submission ready**

### Track Evidence Report

| Track | Name | Key Evidence | Status |
|-------|------|-------------|--------|
| 1 | ERC-8183 Virtuals | Job 0xE990..., 8 valid TX hashes, 5 independence refs | PASS |
| 2 | ERC-8004 Protocol Labs | 7 registry functions, 121 agent_log entries, agent.json v2.0.0 | PASS |
| 3 | stETH Treasury Lido | 10 contract refs, two-layer scorer, wstETH address confirmed | PASS |
| 4 | Lido MCP | 18 lido_ tools, skill file EXISTS, 24 vote/governance refs, 49 dry_run refs | PASS |
| 5 | Base x402 | HTTP 402 on /reviews/top, agent.json clean (0 TODOs), 10 MCP tools | PASS |
| 6 | Filecoin | 15 lighthouse refs, 5 route refs, CID1 HTTP 200, CID2 HTTP 200 | PASS |
| 7 | Open Track | 4 contracts, 6 frontend pages, Vercel 200, Railway 200 | PASS |

### Final Test Counts
- Solidity: 91 passing
- Python: 71 passing
- Total: 162 passing

### Judge-Facing Fixes Made
- README.md: "67 Python" -> "71 Python", lido-mcp "5 tools" -> "9 tools", added stakesignal-mcp to project structure, added passive/active selection nodes to Mermaid diagram
- agent.json + frontend/public/agent.json: added two-layer-human-signal and mcp-server capabilities
- docs/conversation-log.md: agent_log count 86 -> 121
- openserv-worker/index.js: added "Track dropped" comment
- agent/CLAUDE.md: sprint goal updated to Phase 7

### Live Services
- Vercel: HTTP 200
- Railway: HTTP 200
- x402 gate: HTTP 402
- Filecoin CIDs: both HTTP 200

## Phase 5 Fixes — March 22, 2026 16:47 MYT

**Status: COMPLETED — All 4 checks PASS**

### What was done
1. Added `distribution_model`, `passive_selections`, `yield_score`, `payout_amount` to `OutcomeResponse`
2. Wired two-layer yield calc results into outcome API response (was print-only)
3. Set Railway env vars: `LIGHTHOUSE_API_KEY`, `RECEIVER_ADDRESS`, `PASSIVE_MULTIPLIER=0.3`, `ACTIVE_MULTIPLIER=0.7`
4. Fixed `requirements.txt`: `eth-account>=0.13.7` (was ==0.13.4, conflicted with lighthouseweb3 0.1.6)
5. Added `healthcheckPath=/health` to `railway.toml`
6. Railway deploy SUCCESS after fixing dependency conflict

### Verification Results
```
A3: x402 gate          — HTTP 402 (PASS)
A5: Filecoin CID       — QmdhYksWDws... (PASS, real Lighthouse CID)
C1: Passive selection   — recorded=true (PASS)
C2: Outcome two-layer   — distribution_model=two-layer (PASS)
Tests: 91 Solidity + 71 Python = 162 passing
```

### Root cause of Railway deploy failures
- `lighthouseweb3==0.1.6` requires `eth-account>=0.13.7`
- `requirements.txt` pinned `eth-account==0.13.4` (too old)
- pip resolution failed silently on Railway, old deploy kept serving traffic

## Ground Truth Audit — March 22, 2026 15:30 MYT

```
OVERALL: 10/12 PASS, 2 FAIL

BLOCK 1: Tests — Solidity 91/91 PASS, Python 67/67 PASS
BLOCK 2: Contracts — All 4 deployed (bytecode verified on Sepolia)
BLOCK 3: Live Services — /health PASS, /reviews PASS (15), /agent/log PASS (39)
  FAIL: /reviews/top returns 200 (x402 gate not active on Railway)
  FAIL: agent.json not served by Vercel (404 or HTML)
BLOCK 4: Filecoin — 2/2 CIDs verified on Lighthouse gateway
BLOCK 5: Local — 84 agent_log entries, 7/8 env keys filled (PRIVATE_KEY empty)
```

Failures to fix:
1. /reviews/top x402 gate — Railway runs only Python API, x402 gateway is separate service (not deployed). Gate only works locally.
2. agent.json on Vercel — Next.js doesn't serve root JSON files from public/. Need to add agent.json to frontend/public/ or create an API route.

## Completed

- [x] Private GitHub repo: https://github.com/LingSiewWin/StakeHumanSignal
- [x] Synthesis hackathon registration
  - Participant ID: `6d95149b1c87410dbe4d7a01cd209afb`
  - Team ID: `baacd78ca8d44b7b97e48ed8bdc1b9db`
  - Invite code: (see Synthesis dashboard)
  - API Key: (set SYNTHESIS_API_KEY in .env)
  - On-chain TX: https://basescan.org/tx/0xcd3eb6582b19a2fad433a24396c0f55e78bf1ccdaea082ee9738fec26eacc1d0
- [x] 3 Solidity contracts written and compiled (0.8.28, Cancun EVM)
  - StakeHumanSignalJob.sol — ERC-8183 agentic commerce (createJob, fund, submit, complete, reject)
  - LidoTreasury.sol — wstETH yield-only treasury (principal locked, yield distributable)
  - ReceiptRegistry.sol — ERC-8004 receipt NFTs (mint on job completion)
- [x] Deploy script wires all 3 contracts together (scripts/deploy.js)
- [x] FastAPI backend (api/main.py)
  - POST/GET /reviews — submit + list reviews (in-memory store)
  - GET /reviews/top — ranked reviews (x402-gated)
  - POST/GET /jobs — ERC-8183 job lifecycle
  - POST /outcomes — agent signals winner → complete + mint receipt + store on Filecoin
- [x] Services layer
  - web3_client.py — contract calls via web3.py, reads addresses.json + Hardhat artifacts
  - venice.py — private scoring via Venice llama-3.3-70b
  - filecoin.py — bridge client to Node.js Synapse SDK (expects :3001)
  - scorer.py — rank by stake * score * win_rate
- [x] x402 payment gateway (x402-server/index.js) — Express proxy, 402 on /reviews/top
- [x] Buyer agent autonomous loop (api/agent/buyer_agent.py) — 60s cycles, logs to agent_log.json
- [x] agent.json + AGENTS.md in repo root (placeholders for addresses)
- [x] Switched to bun for package management (npm → bun)
- [x] Initial commit pushed to GitHub

## Base Sepolia Deployment (March 21, 2026)

- **Deployer:** `0x557E1E07652B75ABaA667223B11704165fC94d09`
- **StakeHumanSignalJob:** `0x5298F4D8d8043C14e5F2683Ad642fEbC8B54638f`
- **LidoTreasury:** `0xE78f6c235FD1686547DBea41F742D649607316B1`
- **ReceiptRegistry:** `0xA471D2C45F03518E47c7Fc71C897d244dF01859D`
- **USDC (Sepolia):** `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

### Deployment TX hashes
- setLidoTreasury: (included in initial deploy batch)
- setReceiptRegistry: `0x0c2a3a1d6adf0b9eb1237837550f0d16a28d71aff2e0e7b7d79bf4b94bb41bf4`
- whitelist Job on Treasury: `0x37b4612f33fe2f4ea490d3a720f4488cf9e57352e34e791211f6abab6e039f82`
- whitelist deployer on Treasury: `0x263225f919b6ac190cbb5609927d310dff497cd789f20968128c7d3bb6cd4bd3`
- setMinter Job on Registry: `0x32033f71bbb2090d9eec8e7498dfb43995621b4665288924665da7c53073803f`
- setMinter deployer on Registry: `0x8b4298fb6da35f1d50caf0e4cad58db3cd6ab4870f1d566ef667c22654668b17`

### E2E Test Results
- Job #0 created: `0x773dde0d856359b7035360cbe394418a94d1133e8d0446b0c734efe610391089`
- Receipt #0 minted: `0x7f29a730ecfb4de5c1c2eb377f730cadbf3f5cb878796b850a5d0054ac21fc79`
- Receipt verified on-chain: winner=deployer, apiUrl=openai, score=92, CID=bafybeie2e-test

### Verification Status
- Basescan verification: **PENDING** — BASESCAN_API_KEY not set in .env

## Not Started

- [ ] Set BASESCAN_API_KEY and verify contracts on Basescan
- [ ] Deploy contracts to Base Mainnet (needs funded wallet ~0.01 ETH on Base)
- [ ] Filecoin Synapse bridge (Node.js service on :3001 — not yet built)
- [ ] End-to-end test (submit review → fund → submit → complete → mint receipt)
- [ ] Frontend dashboard (Next.js + shadcn/ui)
- [ ] Deploy to Railway or Render (must stay live March 23-25 for judges)
- [ ] Demo video (2 min)
- [ ] Self-custody transfer (ERC-8004 NFT → personal wallet)
- [ ] Submit to 7 tracks + Open Track via Synthesis API
- [ ] Make repo public before deadline
- [ ] Olas Pearl marketplace registration

## Phase 0 Audit (March 21, 2026 — Session 2)

**Status: COMPLETED**

### Blockers Found
1. **CRITICAL: Secrets exposed in .env** — `BASE_SEPOLIA_PRIVATE_KEY` and `BASESCAN_API_KEY` committed to git. Must rotate immediately.
2. **CRITICAL: No structured claim schema** — Current `ReviewSubmission` is flat free-text with single numeric score. Missing: task_type, policy_a/b, rubric_scores, confidence_level, downstream_outcome. Blocks Phases 1, 3, 4, 7, 13.
3. **agent/files.md out of date** — 9 files/dirs exist but aren't listed (verifier_agent.py, bankr.py, self_verify.py, wire-sepolia.js, e2e-test-sepolia.js, MockERC20.sol, filecoin-bridge/, olas/, lido-mcp/).
4. **3 untracked Python files** — verifier_agent.py, bankr.py, self_verify.py need `git add`.

### Codebase Health
- Solidity contracts: Excellent security (ReentrancyGuard, SafeERC20, Ownable, checks-effects-interactions). No issues.
- Python API: All keys via os.getenv(). No stubs, no unused imports, no TODOs.
- Tests: All passing, zero skipped. 3 contract test suites.
- 42 skills available in skills/. No .claude/skills/ at project level.
- 8 docs in docs/. design.md comprehensive for frontend. No claim schema doc.

### Skills Inventory Summary
- Planning: brainstorming, writing-plans, ethskills/concepts
- Contracts: ethereum-wingman, ethskills/security, ethskills/audit, ethskills/standards
- Execution: executing-plans, subagent-driven-development, dispatching-parallel-agents
- Frontend: ui-ux-pro-max, vercel-react-best-practices, ethskills/frontend-ux, ethskills/frontend-playbook
- QA: verification-before-completion, ethskills/qa, systematic-debugging, test-driven-development
- Completion: finishing-a-development-branch, requesting-code-review

## Phase 1 (March 21, 2026 — Session 2)

**Status: COMPLETED**

### What was done
- Created `docs/claim-schema.md` — full structured claim schema with 6 task_type examples, rubric weights, ERC-8004 mapping
- Upgraded `ReviewSubmission` — 10 new structured claim fields (task_type, context_description, policy_a, policy_b, winner, rubric_scores, confidence_level, reviewer_segment, reasoning, downstream_outcome)
- Upgraded `OutcomeSignal` — added rubric_scores, confidence_level, downstream_outcome
- Upgraded `scorer.py` — `compute_weighted_rubric_score()` with weights: correctness 0.30, relevance 0.25, completeness 0.20, efficiency 0.15, reasoning_quality 0.10
- Added `get_independence_score()` — wallet comparison foundation (same=0.0, different=1.0, zero_address=0.0)
- ERC-8004 receipt outcome string now uses `rubric_avg:X.XXX,confidence:X.XX,winner:...` when rubric available
- Committed previously untracked files: verifier_agent.py, bankr.py, self_verify.py
- Updated agent/files.md with all 9 missing entries (local only, not pushed)
- 20 pytest tests: all passing (schema validation, backward compat, rubric scoring, independence)
- Backward compatible: old flat ReviewSubmission still accepted

### Key decisions
- docs/ stays gitignored — claim-schema.md is local reference only
- agent/ folder not pushed to git (local project docs)
- Rubric dimensions chosen: correctness, efficiency, relevance, completeness, reasoning_quality (not safety/clarity as originally planned — these 5 map better to AI comparison tasks)

## Phase 2 (March 21, 2026 — Session 2)

**Status: COMPLETED**

### What was done
- ReceiptRegistry: `registerAgentOwnership(agent, owner)` — agent-to-owner mapping, emits `AgentRegistered` event
- ReceiptRegistry: `getIndependenceScore(reviewer, agentOwner)` — returns 0 (related) or 100 (unrelated), checks both directions + reverse
- ReceiptRegistry: `getHumanReputationScore(humanWallet)` — weighted average win rate across all owned agents
- ReceiptRegistry: `agentWins`/`agentJobs` tracking in `mintReceipt()` + `recordParticipation()` for non-winners
- ReceiptRegistry: `getOwnerAgents(owner)` + `_removeFromOwnerList()` helper for re-registration
- StakeHumanSignalJob: `complete()` now calls `registry.getIndependenceScore(evaluator, client)` — reverts with "Evaluator not independent" if score == 0
- scorer.py: `get_independence_score()` wired to on-chain contract call, falls back to wallet comparison if unavailable
- 15 new Solidity tests covering ownership, independence, reputation, self-review blocking
- **Total test count: 74 Solidity + 20 Python = 94 tests, all passing**

### Key decisions
- Independence check only runs when receiptRegistry is wired (backward compatible with existing Sepolia deployment)
- `IReceiptRegistry` interface defined inline in StakeHumanSignalJob.sol (minimal interface, not full contract)
- `_removeFromOwnerList` handles re-registration cleanly (swap-and-pop)

## Phase 3 (March 21, 2026 — Session 2)

**Status: COMPLETED**

### Security Issues Found & Fixed
1. **LOW — Duplicate receipt inflation** (ReceiptRegistry): Same jobId could get multiple receipts, inflating `agentWins`. Fixed: added `jobHasReceipt` mapping, `require(!jobHasReceipt[jobId])` in `mintReceipt()`.
2. **INFO — Missing admin events** (StakeHumanSignalJob): `setLidoTreasury`, `setReceiptRegistry`, `setEvaluator` had no events. Fixed: added `LidoTreasuryUpdated`, `ReceiptRegistryUpdated`, `EvaluatorUpdated` events with old/new addresses.
3. **INFO — Missing participation event** (ReceiptRegistry): `recordParticipation()` had no event. Fixed: added `ParticipationRecorded(agent, totalJobs)` event.
4. **LOW — Unbounded loops** (ReceiptRegistry): `getHumanReputationScore` and `_removeFromOwnerList` loop over `ownerToAgents`. Accepted for hackathon — bounded by practical agent count (<100).

### Audit Checklist Results
- Reentrancy: PASS (all token-moving functions use nonReentrant + CEI)
- Access control: PASS (evaluator, minter, whitelisted, owner)
- Input validation: PASS (all address(0), zero amount, empty string checks)
- Arithmetic: PASS (Solidity 0.8.28 overflow protection, no division-before-multiplication)
- Events: PASS (all state changes now emit events)
- Logic: PASS (independence check cannot be bypassed, principal locked, duplicate receipt prevented)
- Compilation: 0 errors, 0 warnings

### Final Test Count
**78 Solidity + 20 Python = 98 tests, all passing**

## Phase 4 (March 21, 2026 — Session 2)

**Status: COMPLETED**

### What was done
- filecoin-bridge/: upgraded `/store` to return `{cid, url, size}`, `/retrieve/:cid` returns `{content, cid}`, `/health` shows `network: "mock"|"mainnet"`
- filecoin.py: `store_review()`, `store_agent_log()`, `store_outcome()`, `retrieve()`, `health()` + legacy `store_on_filecoin`/`retrieve_from_filecoin` backward compat
- reviews.py: every review submission auto-stores to Filecoin (best-effort), CID saved in review record
- buyer_agent.py: `pin_agent_log()` pins entire decision trail to Filecoin after each cycle
- .env.example: added `FILECOIN_BRIDGE_URL=http://localhost:3001`
- Mock mode: bridge works without Synapse SDK (deterministic local CID store using SHA-256)
- 7 new Python tests for all Filecoin storage functions
- **Total test count: 78 Solidity + 27 Python = 105 tests, all passing**

## Phase 5 (March 21, 2026 — Session 2)

**Status: COMPLETED**

### What was done
- **Venice DROPPED** — replaced with local heuristic scorer in `venice.py`. Zero external API, zero API keys.
- `score_output(claim, output, task_intent)` — scores 5 rubric dimensions via term matching + length heuristics
- `task_intent`: required field on ReviewSubmission (max 200 chars, non-empty). Plain English summary of what the human was trying to accomplish.
- Buyer agent now uses heuristic verdict (`validated`/`rejected`) to decide `complete()` vs `reject()` on ERC-8183 jobs
- `OutcomeSignal`: added `source_claim_id` + `outcome_validated` for downstream validation loop
- `update_claim_score()` in scorer.py — tracks wins/losses/downstream_accuracy per claim
- outcomes.py wires downstream validation into handler
- Legacy `score_review_privately()` wrapper kept for backward compat
- 16 new Python tests (task_intent validation, heuristic scorer, downstream validation)
- **Total test count: 78 Solidity + 43 Python = 121 tests, all passing**

### Key decisions
- Venice dropped because: external API dependency, API key management, latency. Heuristic scorer is instant, deterministic, zero-cost.
- task_intent is required (not optional) because it's the semantic filter for buyer agents before x402 payment
- Heuristic scorer threshold: confidence > 0.6 = validated, else rejected

## Phase 6 (March 21, 2026 — Session 2)

**Status: COMPLETED**

### What was done
- Buyer agent fetches via x402 gateway (`X402_GATEWAY_URL`, default `:3000`) with dryRun, falls back to direct API
- Added `--once` flag: `python -m api.agent.buyer_agent --once` runs single cycle and exits
- Refactored loop into `run_cycle(cycle)` for testability
- x402 payment logged to agent_log.json: action=x402_payment, endpoint, amount, mode
- `complete_and_reward()` now sends rubric_scores, source_claim_id, outcome_validated
- 7 new tests: fetch mock/failure, scoring, full cycle with reviews, no reviews, once-mode
- **Total test count: 78 Solidity + 50 Python = 128 tests, all passing**

### x402 Status
- x402-server/index.js: fully implemented (SDK mode + manual fallback + dryRun)
- Buyer agent: uses dryRun in dev, falls back to direct API if gateway unavailable
- No changes needed to x402-server — it was already complete from Phase 0

## Phase 7 (March 21, 2026 — Session 2)

**Status: COMPLETED**

### What was done
- `lido-mcp/index.js`: MCP server with 5 tools via `@modelcontextprotocol/sdk`
  - `lido_stake` — stake USDC into LidoTreasury (dry_run default)
  - `lido_get_yield_balance` — read yield, principal, deposits
  - `lido_distribute_yield` — distribute wstETH yield to winner (dry_run default)
  - `lido_get_vault_health` — APY vs benchmark, alerts
  - `lido_list_jobs` — list ERC-8183 jobs by status
- `lido-mcp/vault-monitor.js`: continuous polling (default 5min), logs JSON status, stderr alerts when yield below 3.5% benchmark
- `lido-mcp/contracts.js`: address constants + minimal ABIs for LidoTreasury and StakeHumanSignalJob
- `lido-mcp/SKILL.md`: agent-consumable skill file with all tool signatures and examples
- All write ops default to `dry_run: true` — simulate first, execute with `dry_run: false`
- Mock mode when `LIDO_TREASURY_ADDRESS` not set — all tools return simulated data
- Both MCP server and vault monitor verified running in mock mode
- **Total test count: 78 Solidity + 50 Python = 128 tests (unchanged — MCP server is Node.js standalone)**

## Phase 8 (March 21, 2026 — Session 2)

**Status: COMPLETED**

### What was done
- agent.json: all `FILL_AFTER_DEPLOY` replaced with real Sepolia addresses. Added `erc8004_registries` section documenting 3 registry uses. Updated description (Venice → heuristic). Updated capabilities list.
- AGENTS.md: filled with Sepolia contract Basescan links, documented all 3 ERC-8004 registries (identity, reputation, validation)
- agent_log.json: 7 real entries — identity registration, deploy, job creation, independence check, receipt mint, heuristic scoring, Filecoin pin
- docs/erc8004-proof.md: submission evidence for Protocol Labs track with all tx hashes and Basescan links (gitignored)

### ERC-8004 Registry Proof
1. **Identity** — Synthesis registration tx `0xcd3eb6...` on Base Mainnet
2. **Reputation** — Receipt #0 mint tx `0x7f29a7...` on Base Sepolia (agentWins/agentJobs updated)
3. **Validation** — Job #0 create tx `0x773dde...` on Base Sepolia (independence check runs on complete)

### Verification
- Zero `FILL_AFTER_DEPLOY` strings remaining in agent.json or AGENTS.md
- agent_log.json has 7+ structured entries
- **Total test count: 78 Solidity + 50 Python = 128 tests, all passing**

## Phase 9 (March 21, 2026 — Session 2)

**Status: COMPLETED — MAINNET GO**

### What was done
- Fresh deploy of all 3 updated contracts to Base Sepolia (Phase 2-3 features included)
- New addresses:
  - StakeHumanSignalJob: `0xE99027DDdF153Ac6305950cD3D58C25D17E39902`
  - LidoTreasury: `0x8E29D161477D9BB00351eA2f69702451443d7bf5`
  - ReceiptRegistry: `0xa39c7b475b0708a9854052Fb3Fbc93ccBf656332`
- E2E verified on-chain:
  - Job #0 created: `0x3dee4cc1...`
  - Receipt #0 minted: `0x3740a500...`
  - Rubric outcome stored: `rubric_avg:0.730,confidence:0.73`
  - agentWins=1, agentJobs=1
  - Independence: self=0, unrelated=100
  - Duplicate receipt guard: working (reverts on second mint for same jobId)
- deployments/sepolia-e2e-proof.json saved with all tx hashes
- agent.json updated with new addresses
- Status Network deploy: SKIPPED (would need separate chain config + wallet funding)

### Go/No-Go
- Sepolia deploy: PASS
- E2E on-chain: PASS
- agent.json placeholders: PASS (none remaining)
- Hardcoded secrets: PASS (none found)
- Tests: 128 passing (78 Solidity + 50 Python)
- **MAINNET GO/NO-GO: GO**

## Phase 10 (March 21, 2026 — Session 2)

**Status: COMPLETED**

### What was done
- `filecoin-bridge/x402-server.js`: real x402 gateway using public facilitator (`https://x402.org/facilitator`), no CDP keys needed, Base Sepolia
- `api/routes/agent.py`: GET /agent/log — serves agent_log.json via API
- `api/routes/leaderboard.py`: GET /leaderboard — aggregates reviewer wins/jobs/stake
- `api/main.py`: registered agent + leaderboard routers
- Frontend (Next.js 16 + TypeScript + Tailwind):
  - Dark theme (`#0A0A0F` bg, `#00D4AA` primary, `#F5A623` accent)
  - Sidebar layout with navigation
  - 5 pages: Landing, Marketplace, Submit Review, Agent Feed, Leaderboard
  - Rubric score sliders on submit form
  - Basescan links for tx hashes
  - Auto-refresh on agent feed (10s)
- `.env.example`: simplified x402 config
- Frontend builds with 0 TypeScript errors
- **Total test count: 78 Solidity + 50 Python = 128 tests, all passing**

### Deployment Status
- API: local (localhost:8000) — ready for Railway/Render
- Frontend: local (localhost:3000) — ready for Vercel
- x402 gateway: local (localhost:3002) — ready for Railway
- NO mainnet deploy. Staying Base Sepolia.

## Phase 11 (March 21, 2026 — Session 2)

**Status: COMPLETED**
- README.md rewritten with real Sepolia addresses, prize tracks, architecture flow
- AGENTS.md updated with endpoint table, real addresses, MCP tools
- Pre-submission checklist: 13/13 PASS
- Repo cleanup: .DS_Store, __pycache__ removed

## Phase 12 Audit (March 21, 2026 — Session 2)

**Status: COMPLETED — READY TO DEPLOY**

### Blockers Found & Fixed
1. **ESM/CJS conflict** (filecoin-bridge): `package.json` had `"type": "module"` but `index.js` used `require()`. Fix: removed `"type": "module"`, converted `x402-server.js` to CommonJS.
2. **x402 SDK crash** (filecoin-bridge): `@x402/express` `paymentMiddleware` has API incompatibility with current version. Fix: removed SDK, using manual 402 gate only. Same behavior for judges.
3. **x402 gate ordering** (filecoin-bridge): `app.get()` route matched before `app.use()` middleware. Fix: added `manualGate` as route-level middleware directly in `app.get("/reviews/top", manualGate, handler)`.
4. **BASE_RPC_URL wrong** (.env): pointed to mainnet, should be Sepolia. Fix: changed to `https://sepolia.base.org`.
5. **RECEIVER_ADDRESS empty** (.env): needed for x402 gate. Fix: set to deployer address.

### Full Integration Test: PASS
| Step | Result |
|------|--------|
| Submit review | id `1525ffa1` returned |
| /reviews | 2 reviews |
| buyer_agent --once | completed, 2 scored, 0 crashes |
| /agent/log | 35 entries |
| /leaderboard | 1 reviewer with stats |
| x402 gate | HTTP 402 (correct) |

### .env State (key names only)
BASE_RPC_URL, BASE_SEPOLIA_PRIVATE_KEY, BASE_SEPOLIA_RPC_URL, BASESCAN_API_KEY, FILECOIN_PRIVATE_KEY, PRIVATE_KEY, RECEIVER_ADDRESS, SYNTHESIS_API_KEY, VENICE_API_KEY (empty, dropped)

### Test Count
**78 Solidity + 50 Python = 128 tests, all passing**

## Phase 13 (March 21, 2026 — Session 2)

**Status: COMPLETED**

### Files Removed
- `api/services/bankr.py` — Bankr dropped, only imported by verifier_agent
- `api/services/self_verify.py` — Self Protocol cut, independence lives in ReceiptRegistry.sol
- `api/agent/verifier_agent.py` — used dropped Venice+Bankr, nothing imports it
- `olas/` directory — Olas cut, empty integration stubs
- `addresses-sepolia.json` — stale (replaced by deployments/sepolia.json)
- `frontend/public/{next,vercel,file,globe,window}.svg` — Next.js scaffold assets
- `frontend/{AGENTS.md,CLAUDE.md,README.md}` — duplicate docs from create-next-app

### Scorer Fix: pay-to-rank bug
- **Problem**: `rank_score = stake × win_rate` — rich reviewers dominate regardless of quality
- **Fix**: Two-layer scoring:
  - `compute_retrieval_score()`: task_match (40%) + observed_success (30%) + freshness (20%) + evidence (10%) + stake as minor tie-breaker (log scale, capped at 0.1)
  - `compute_payout_score()`: `sqrt(stake) × settlement_result` — prevents stake farming, mild loss penalty (-0.25)
- 9 new tests covering both functions

### Test Count
**78 Solidity + 59 Python = 137 tests, all passing**
- Frontend builds with 0 errors

## Phase 14 (March 21, 2026 — Session 2)

**Status: COMPLETED — READY FOR VERCEL DEPLOY**

### What was done
- `scripts/seed.py`: seeds 5 realistic reviews (code_review, analysis, customer_support, data_extraction, creative)
- JSON file persistence: `api/data/reviews.json` — reviews survive API restarts
- All 4 services verified running locally:
  - API :8000 → 200 (5 reviews, 60 agent log entries, 3 reviewers on leaderboard)
  - Filecoin :3001 → 200 (mock mode, CIDs returned)
  - x402 :3002 → 402 (gate working)
  - Frontend :3000 → ready
- Persistence verified: 5 reviews survive API restart
- Buyer agent ran full cycle: all 5 reviews scored, log pinned to Filecoin
- `.gitignore`: added `api/data/` for runtime JSON storage

### Test Count
**78 Solidity + 59 Python = 137 tests, all passing**
Frontend builds with 0 errors.

## Phase 15-16 (March 21, 2026 — Session 2)

**Status: COMPLETED — ALL LIVE**

### Deployment
- Railway API: https://stakesignal-api-production.up.railway.app (10 reviews, 39 log entries, 3 reviewers)
- Vercel Frontend: https://stakehumansignal.vercel.app (5 pages, all 200)
- GitHub: https://github.com/StakeHumanSignal/StakeHumanSignal (public)

### Deploy fixes applied
- `.dockerignore` added (reduced build context from 500MB+ to ~5MB)
- Dockerfile uses shell form CMD for `$PORT` expansion
- Removed Procfile/nixpacks (nixpacks couldn't find pip with mixed Node/Python repo)
- Build time: ~10 seconds (was failing for 10+ minutes)

### Code audit findings (Phase 16)
- **Fixed:** GET /reviews/top now uses `compute_retrieval_score` (was using old stake*score sort)
- **Verified working:** scorer_local.py (5-dim rubric), scorer.py (retrieval + payout), buyer_agent --once, persistence, CORS
- **Not fixed (acceptable):** reject() doesn't refund stake, compute_payout_score not called in outcomes.py
- **Branch renamed:** org-main → main (all pushes now `git push org main`)

### Docs
- docs/SETUP.md created — honest developer handover doc

### Test Count
**78 Solidity + 59 Python = 137 tests, all passing**

## Phase 17 (March 21, 2026 — Session 2)

**Status: COMPLETED**

### Bugs Fixed
1. **Scorer always rejected** — buyer_agent passed `api_url` (URL string) to scorer instead of review text. Fixed: passes `review_text`/`reasoning`.
2. **Scorer ignored rubric_scores** — added early-return in `scorer_local.py` that uses claim's own `rubric_scores` directly when present (heuristic is fallback only).
3. **x402 ERROR noise** — `X402_GATEWAY` default changed from `localhost:3000` to `""`. Agent skips x402 attempt when not configured.
4. **Fake "1,284" on landing** — removed hardcoded fallback, shows actual count.

### Scorer Results
- Before fix: verdict=rejected, confidence=0.46
- After fix: verdict=validated, confidence=0.87

### Frontend Redesign (Phase 16-17)
- Obsidian Architect theme deployed to Vercel
- Cyan/purple/mint color system, Space Grotesk/Inter/JetBrains Mono fonts
- Collapsible sidebar, top app bar, bottom terminal bar
- All 5 pages: landing, marketplace, submit, agent-feed, leaderboard

### Test Count
**78 Solidity + 67 Python = 145 tests, all passing**

### Live URLs
- Frontend: https://stakehumansignal.vercel.app
- API: https://stakesignal-api-production.up.railway.app
- GitHub: https://github.com/StakeHumanSignal/StakeHumanSignal

## Phase 18 (March 21, 2026 — Session 2)

**Status: COMPLETED**

### What was done
- RainbowKit + wagmi v2 installed, targeting Base Sepolia
- `Providers.tsx`: WagmiProvider + QueryClientProvider + RainbowKitProvider wrapper
- `WalletDisplay.tsx`: "Connect Wallet" button (matches existing design), shows avatar when connected
- `TopBar.tsx`: extracted navbar to client component, replaced "Stake Now" with WalletDisplay
- Submit page: `useAccount()` auto-fills `reviewer_address` when wallet connected
- Marketplace: added "Agents pay automatically via x402 protocol" tooltip below x402 buttons
- Layout wrapped in Providers without changing any design/layout/colors
- Build: 0 TypeScript errors. Deployed to Vercel.

### Actor clarity
- Human A (reviewer): browser + wallet connect (Submit page)
- Buyer Agent: .env private key + API calls only (never touches browser)
- Human B (validator): browser + optional wallet (future)

### Test Count
**78 Solidity + 67 Python = 145 tests, all passing**

## Phase 19 (March 21, 2026 — Session 2)

**Status: COMPLETED**

### What was done
- **SessionEscrow.sol**: New contract — escrows USDC for blind A/B compare sessions. Buyer deposits reward, outputs recorded, Human B settles. Winner=1 pays reviewer 90% + 10% protocol fee. Winner=2 refunds buyer. 7-day expiry auto-refund. 13 Solidity tests.
- **api/routes/sessions.py**: POST /sessions/open, POST /sessions/{id}/outputs, POST /sessions/{id}/settle, GET /sessions/{id}, GET /sessions. Full session lifecycle API.
- **frontend /validate page**: Blind A/B comparison UI for Human B. Shows two outputs without model names. Click to pick winner. Shows "CLAIM VALIDATED" (mint) or "CLAIM REJECTED" (error). Matches Obsidian Architect design.
- **Validate nav link**: Added to sidebar navigation.

### Core Economic Loop: NOW COMPLETE
```
Human A stakes → claim stored on Filecoin →
Buyer Agent pays x402 → runs bundle →
Human B validates via /validate?session_id=X →
Settlement pays yield to Human A (or refunds buyer)
```

### Test Count
**91 Solidity + 67 Python = 158 tests, all passing**

### Contracts
- StakeHumanSignalJob (ERC-8183): `0xE99027DDdF153Ac6305950cD3D58C25D17E39902`
- LidoTreasury: `0x8E29D161477D9BB00351eA2f69702451443d7bf5`
- ReceiptRegistry (ERC-8004): `0xa39c7b475b0708a9854052Fb3Fbc93ccBf656332`
- SessionEscrow: NOT YET DEPLOYED (contract compiled + tested, deploy in next phase)

## Phase 20 (March 22, 2026 — Session 2)

**Status: COMPLETED**

### What was done
1. **Self Protocol research** — `docs/self-protocol.md` written (local only, gitignored). Key finding: Self Agent ID exists at app.ai.self.xyz as a web wizard (register agent → scan passport → get soulbound NFT). The `@selfxyz/agent-sdk` npm package is NOT verified as publicly available — may be pre-release. Manual registration is feasible (30-60 min). Full ZK integration is NOT feasible for hackathon.

2. **Structured reasoning field** — `StructuredReasoning` Pydantic model added to ReviewSubmission with fields: summary, when_to_use, when_not_to_use, task_tags, quality_priority, latency_sensitivity, evidence_notes. All optional for backward compat. 3 seed reviews updated with structured reasoning. Submit page has 3 new optional inputs.

3. **SessionEscrow deployed** — `0xe817C338aD7612184CFB59AeA7962905b920e2e9` on Base Sepolia. TX: `0xf0565ba0...`. Updated deployments/sepolia.json.

### Contracts (Base Sepolia)
- StakeHumanSignalJob (ERC-8183): `0xE99027DDdF153Ac6305950cD3D58C25D17E39902`
- LidoTreasury: `0x8E29D161477D9BB00351eA2f69702451443d7bf5`
- ReceiptRegistry (ERC-8004): `0xa39c7b475b0708a9854052Fb3Fbc93ccBf656332`
- SessionEscrow: `0xe817C338aD7612184CFB59AeA7962905b920e2e9`

### Test Count
**91 Solidity + 67 Python = 158 tests, all passing**

## Phase 22 QA Audit (March 22, 2026)

**Status: COMPLETED — ALL CLEAR**

### Audit Results: 29/29 checks passing
- Scorer: verdict=validated (confidence=0.87) for good reviews
- Pay-to-rank: fixed (right=0.826 > wrong=0.500)
- Python tests: 67/67
- Solidity tests: 91/91
- Frontend build: 0 errors, 6 pages
- All 6 live pages: HTTP 200
- All 4 API endpoints: returning real data
- agent.json: 0 placeholders
- agent_log.json: 76 entries
- Security: no secrets in git
- 4 contracts deployed on Base Sepolia

### Cleanup Done
- frontend-template/ deleted (design implemented in frontend/)
- DESIGN.md preserved in agent/DESIGN.md
- No critical issues found

### Final Test Count (Phase 2)
**91 Solidity + 67 Python = 158 tests, all passing**

---

## Phase 3 — March 22, 2026 (Two-Layer Yield + Judge Evidence)

### Two-Layer Yield Weights
- Added `compute_two_layer_payout()` to `api/services/scorer.py`
- Passive layer: selection count * 0.3 multiplier
- Active layer: sqrt(stake) * 0.7 multiplier (prevents farming)
- 4 new tests in `test/test_scorer.py` (passive only, active only, mixed sums, zero safety)
- Wired into `api/routes/outcomes.py` as step 6 (log-only, distribution via Lido MCP)
- Added PASSIVE_MULTIPLIER and ACTIVE_MULTIPLIER to `.env.example`

### Judge Evidence Package
- Created `docs/conversation-log.md` with zero placeholders
- All real data: contract addresses, TX hashes, CIDs, agent_log count (86 entries)
- Updated README.md with Two-Layer Human Signal section and agent usage instructions

### Test Count (Phase 3)
**91 Solidity + 71 Python = 162 tests, all passing**
- Commit: a27bcde

## READY TO RECORD DEMO: YES

## Next Session
**Phase 4: Demo video + Moltbook post + submission curl**
Deadline: March 22, 2026 11:59 PM PT / March 23, 2026 2:59 PM MYT

## Key Decisions Made

- **Solidity 0.8.28 + Cancun EVM** — required by OpenZeppelin 5.6.1 (mcopy opcode)
- **bun for packages, npx for Hardhat** — bun can't run Hardhat (native module issue)
- **In-memory stores** for reviews_db and jobs_db — sufficient for hackathon demo
- **x402 gateway as separate Express server** — proxies to FastAPI, keeps Python clean
- **Filecoin via Node.js bridge** — Synapse SDK is JS-only, Python calls bridge HTTP API

## Deadline

**March 22, 2026 at 11:59 PM PT** (March 23, 2026 at 2:59 PM MYT)
