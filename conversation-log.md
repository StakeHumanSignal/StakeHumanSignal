# StakeHumanSignal — Build Log

Team: StakeHumanSignal | Hackathon: Synthesis 2026 | Tracks: 10 + Open

## What we built

A staked human feedback marketplace where humans compare AI outputs side by side, pick the winner, and stake real USDC on their choice. AI buyer agents pay via x402 micropayments (real Coinbase SDK, EIP-3009 signatures) to access these ranked verdicts. Winners earn Lido wstETH yield. Every review is stored permanently on Filecoin Onchain Cloud (real Synapse SDK, USDFC payment on calibration testnet). Every outcome is an ERC-8004 receipt on Base. The buyer agent hires external intelligence via Olas mech marketplace (12 on-chain TXs on Base mainnet).

## Architecture

- 4 Solidity contracts on Base Sepolia (ERC-8183 jobs, ERC-8004 receipts with 3 registries, wstETH yield treasury, blind A/B escrow)
- Python FastAPI backend with x402 SDK middleware (real Coinbase facilitator verification)
- Next.js 16 frontend with RainbowKit, pixel-art TownSquare arena, 7 pages
- Autonomous buyer agent: fetch → score → Olas mech query → independence check → mint receipt → distribute yield
- Lido MCP server: 11 tools, dual-provider (Ethereum mainnet + Base Sepolia), real chain reads
- StakeHumanSignal MCP server: 5 tools, all hitting live Railway API
- Filecoin Onchain Cloud bridge: @filoz/synapse-sdk, USDFC via CDP on Secured Finance
- OpenServ multi-agent: scorer + coordinator agents registered on platform
- Olas mech-client: 12 on-chain requests on Base mainnet to mech #112

## Build evidence (by track)

### Track 1: ERC-8183 Open Build (Virtuals)
- Contract: StakeHumanSignalJob.sol — [Basescan](https://sepolia.basescan.org/address/0xE99027DDdF153Ac6305950cD3D58C25D17E39902)
- createJob TX: [0x3dee4cc1...](https://sepolia.basescan.org/tx/0x3dee4cc14ef330eb2318114ea4c221e04092c99856faca2984dad3c9e405f6da)
- Full lifecycle: createJob → fund → submit → complete (with independence check) → reject
- 91 Solidity tests passing

### Track 2: ERC-8004 Agents With Receipts (Protocol Labs)
- Contract: ReceiptRegistry.sol — [Basescan](https://sepolia.basescan.org/address/0xa39c7b475b0708a9854052Fb3Fbc93ccBf656332)
- Receipt #0 mint TX: [0x3740a500...](https://sepolia.basescan.org/tx/0x3740a500ca742f0edd47265270942fdae2d5f14566ba53e0500af1e91e7e03e8)
- 3 registries: identity (agentToOwner), reputation (getHumanReputationScore), validation (receipt NFTs)
- Independence check: getIndependenceScore() prevents self-review on-chain
- agent.json v2.0 + agent_log.json with 228+ entries

### Track 3: stETH Agent Treasury (Lido)
- Contract: LidoTreasury.sol — fresh deployment at [0x639bBbE3...](https://sepolia.basescan.org/address/0x639bBbE3D9624b96a7b6aC9a0A95493642bf2b72)
- depositPrincipal TX: [0x3a7bc31e...](https://sepolia.basescan.org/tx/0x3a7bc31ea1f2aaddfd0edec3e035c33ca8d30309ae9d70e5f7390638c6f84024) (0.5 wstETH locked)
- distributeYield TX: [0x30ad2db8...](https://sepolia.basescan.org/tx/0x30ad2db8d5047f9296abdf589b8e8108dbdddbaeba529b387b79c010136550ce) (0.1 wstETH to winner)
- Proof: deployments/treasury-yield-proof.json

### Track 4: Lido MCP Server (Lido)
- Server: lido-mcp/index.js — 11 tools (was 9, added lido_stake_eth + lido_balance)
- Dual-provider: Ethereum mainnet for Lido + Base Sepolia for treasury (no cross-network bugs)
- Verified live: 1 stETH = 0.813 wstETH (real Ethereum mainnet read)
- All tools verified: lido-mcp/live-test.js — 11/11 passing
- Skill file: lido-mcp/lido.skill.md with rebasing explainer, safe staking patterns
- Real DAO votes: 199 proposals, withdrawal queue #118573 finalized

### Track 5: Mechanism Design (Octant)
- Conviction-weighted staking: sqrt(stake) * reputation in scorer.py
- Two-layer signal: passive 0.3x (no stake) + active 0.7x (sqrt-scaled)
- On-chain independence check prevents gaming (cross-registry in ReceiptRegistry)

### Track 6: Data Collection (Octant)
- Autonomous buyer agent collects and scores human reviews
- 5-dimension rubric: correctness (30%), relevance (20%), completeness (15%), efficiency (25%), reasoning (10%)
- All data stored on Filecoin (Lighthouse CIDs + FOC PieceCIDs)
- 228+ structured agent log entries showing real decisions, errors, retries

### Track 7: Agentic Storage (Filecoin)
- REAL Filecoin Onchain Cloud via @filoz/synapse-sdk v0.40.0
- USDFC obtained via CDP on Secured Finance (160 tFIL → 204 USDFC on calibration)
- FOC deposit TX: [0x244c2a1d...](https://filecoin-testnet.blockscout.com/tx/0x244c2a1df2dc9aea6a3b9648cd9a2b3a206017d4f511f1871627f9a72a9a3d2d) (block 3562333)
- PieceCID: bafkzcibcduch6lsgmz3rpfq6uhjibwca2lofa6r43ppgul6gqy7vlut7mxsj4ny
- Also: Lighthouse CIDs for fast agent log pinning — [QmPmYuNvaV5z...](https://gateway.lighthouse.storage/ipfs/QmPmYuNvaV5z9CUAH9X86CxWjStQnWBobXs4dxDHnZ36jz) (HTTP 200)

### Track 8: Hire an Agent (Olas)
- mech-client integrated in api/services/olas.py (real MarketplaceService)
- Mech #112 on Base mainnet: 0xe535d7acdeed905dddcb5443f41980436833ca2b
- Deposit TX: [0x16da2190...](https://basescan.org/tx/0x16da2190da47349fafdcf2111f8e8774b0b1ee469dcd4a4671241f414d9ff046)
- 12 on-chain request TXs on Base mainnet — all confirmed on Basescan
- TX #1: [0x6cd2887e...](https://basescan.org/tx/0x6cd2887e250790eaf98b206947e480e6f9f331c3df12e6dda3c4e2211cee5770)
- TX #12: [0xc33e784f...](https://basescan.org/tx/0xc33e784f10c89cca161fbe2ecaac65eccded9ac5704c70be7c7395960a6d5f72)
- Proof: deployments/olas-mech-proof.json (all 12 TX hashes)

### Track 9: Agent Services on Base (x402)
- x402 SDK: x402[fastapi] v2.5.0 (official Coinbase Python SDK)
- PaymentMiddlewareASGI in api/main.py — real EIP-3009 verification
- Facilitator: https://x402.org/facilitator (public testnet for Base Sepolia)
- Buyer agent: EthAccountSigner + ExactEvmClientScheme + x402Client for real payment signing
- Gate: GET /reviews/top returns 402 with spec-compliant payment challenge
- Health endpoint: {"status":"ok","x402":"sdk"}

### Track 10: Ship Something Real (OpenServ)
- OpenServ SDK: @openserv-labs/sdk v2
- Agents registered on platform.openserv.ai
- Capabilities: score_review, get_ranked_reviews, get_reputation, open_compare_session
- Wired to existing API endpoints on Railway
- x402 + ERC-8004 (bonus criteria the track asks for)

### Open Track (Synthesis)
- Full system: 4 contracts, 7 frontend pages, 2 MCP servers, FOC bridge, Olas mech, x402 SDK
- Live: stakehumansignal.vercel.app + stakesignal-api-production.up.railway.app
- Tests: 91 Solidity + 71 Python + 5 frontend passing
- CI: GitHub Actions 4 jobs (solidity, python, frontend, security)

## Final build session — March 22-23, 2026

### Integration fixes (not demo — real)
- **Olas on-chain**: first 12 requests were offchain (no proof). Diagnosed: default RPC returned 0 balance. Fixed: deposited ETH to mech marketplace prepaid balance, overrode internal ledger_api, re-ran all 12 on-chain. 13 total TXs on Base mainnet Basescan.
- **Filecoin FOC**: discovered all CIDs were `bafylocal` (fake local hashing). Lighthouse was working but not FOC. Installed @filoz/synapse-sdk, borrowed 204 USDFC via CDP on Secured Finance (160 tFIL collateral, 150% ratio in Recovery Mode), uploaded real data. PieceCID confirmed.
- **Lido MCP dual-provider**: all 9 mainnet Lido contracts were using Base Sepolia RPC (silent failures on wrap/unwrap/vote). Created separate ethProvider for Ethereum mainnet. Verified: 1 stETH = 0.813 wstETH, 199 DAO votes, withdrawal #118573.
- **x402 self-roast**: found 6 issues in my own x402 implementation. X402_ENABLED defaulted OFF (dead code). buyer_agent sent literal string as payment header. dryRun bypass let anyone skip payment. Fixed all 6 — SDK loads by default, EthAccountSigner for real signing, no bypass.
- **8 dead buttons killed**: found 8 clickable elements with no handler across 5 frontend pages. Every button now does something real — links to Basescan, calls API, or navigates.
- **Dockerfile .dockerignore**: `deployments/` was in .dockerignore — Docker couldn't COPY it. Caused 12 consecutive Railway deploy failures. One line removed, all deploys succeeded.
- **OpenServ**: rebuilt worker with @openserv-labs/sdk v2, registered scorer + coordinator agents on platform, wired to existing API endpoints.
- **TownSquare**: replaced static canvas with pixel-art arena — 15 real reviewer bots from API data, beam animations from 264+ agent log entries.

### Competition analysis
- 494 projects submitted total
- Analyzed all 46 tracks by submission count
- Dropped: Agent Cook (209 subs), Octant Analysis (not a fit), Student (focus on winning tracks)
- Added: Olas Hire (6 subs — best odds), OpenServ Ship (36 subs), Base x402 (168 subs — boss insisted)
- Final: 10 tracks + Open, max $28,500 prize pool

## Key pivots and decisions

1. **Dropped Agent Cook** — too crowded (209 submissions). Pivoted to ERC-8004 from same sponsor (less competition, our 3-registry approach differentiates)
2. **Filecoin: Lighthouse → real FOC** — discovered bafylocal CIDs were fake. Went through full Synapse SDK + USDFC CDP path. Most teams use Lighthouse and call it "Filecoin."
3. **Lido MCP cross-network fix** — all mainnet Lido contracts were using Sepolia provider (silent failures). Split into dual-provider architecture.
4. **x402: theatrical → real SDK** — original gate accepted any string as payment. Replaced with official x402[fastapi] SDK + EthAccountSigner.
5. **Olas: offchain → on-chain** — first 12 requests were offchain (no TX hashes). Deposited ETH to mech marketplace, re-ran all 12 on-chain with real Basescan proof.

## AI usage

Built with Claude Code (claude-opus-4-6) as primary development tool. Skill files in agent/skills/ guided each integration to prevent hallucination. 5-agent parallel audits caught 4 critical bugs (Dockerfile missing deployments/, wagmi wrong chain, x402 hardcoded ratios, buyer agent missing dotenv). Human decisions: architecture, track selection, pivot calls, economic design, when to push vs when to fix. Claude Code: contract implementation, testing, deployment, frontend, MCP servers, SDK integrations.

## Repo
https://github.com/StakeHumanSignal/StakeHumanSignal

## Live
- Frontend: https://stakehumansignal.vercel.app
- API: https://stakesignal-api-production.up.railway.app
- Health: https://stakesignal-api-production.up.railway.app/health
- Agent feed: https://stakehumansignal.vercel.app/agent-feed
- TownSquare: https://stakehumansignal.vercel.app/town-square
- Video: https://www.loom.com/share/b26f3b19ce4642d385eae13860d816f5
- Moltbook: https://www.moltbook.com/post/598c5e46-830b-4bab-a189-5528c709491a
