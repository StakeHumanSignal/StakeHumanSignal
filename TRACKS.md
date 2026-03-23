# StakeHumanSignal — Track Submission Guide

> For judges and AI agents evaluating this project across multiple hackathon tracks.
> Each track links to the relevant code, docs, proof, and skill files.

## Quick Navigation

| # | Track | Sponsor | Folder | Skill File | Proof |
|---|-------|---------|--------|-----------|-------|
| 1 | ERC-8183 Open Build | Virtuals | [`contracts/`](contracts/) | [`contracts.skill.md`](contracts/contracts.skill.md) | [createJob TX](https://sepolia.basescan.org/tx/0x3dee4cc14ef330eb2318114ea4c221e04092c99856faca2984dad3c9e405f6da) |
| 2 | Agents With Receipts (ERC-8004) | Protocol Labs | [`contracts/`](contracts/) | [`contracts.skill.md`](contracts/contracts.skill.md) | [mintReceipt TX](https://sepolia.basescan.org/tx/0x3740a500ca742f0edd47265270942fdae2d5f14566ba53e0500af1e91e7e03e8) |
| 3 | stETH Agent Treasury | Lido | [`contracts/`](contracts/) + [`lido-mcp/`](lido-mcp/) | [`lido.skill.md`](lido-mcp/lido.skill.md) | [distributeYield TX](https://sepolia.basescan.org/tx/0x30ad2db8d5047f9296abdf589b8e8108dbdddbaeba529b387b79c010136550ce) |
| 4 | Lido MCP Server | Lido | [`lido-mcp/`](lido-mcp/) | [`lido.skill.md`](lido-mcp/lido.skill.md) | [11/11 live test](lido-mcp/live-test.js) |
| 5 | Mechanism Design | Octant | [`api/`](api/) | [`octant.skill.md`](agent/skills/octant.skill.md) | [`scorer.py`](api/services/scorer.py) sqrt staking |
| 6 | Data Collection | Octant | [`api/`](api/) | [`octant.skill.md`](agent/skills/octant.skill.md) | [agent_log.json](agent_log.json) 264+ entries |
| 7 | Agentic Storage | Filecoin | [`filecoin-bridge/`](filecoin-bridge/) | [`filecoin.skill.md`](filecoin-bridge/filecoin.skill.md) | [FOC deposit TX](https://filecoin-testnet.blockscout.com/tx/0x244c2a1df2dc9aea6a3b9648cd9a2b3a206017d4f511f1871627f9a72a9a3d2d) |
| 8 | Hire an Agent | Olas | [`olas-mech/`](olas-mech/) | [`olas.skill.md`](olas-mech/olas.skill.md) | [12 on-chain TXs](deployments/olas-mech-proof.json) |
| 9 | Agent Services on Base | Base | [`api/`](api/) | [`x402.skill.md`](agent/skills/x402.skill.md) | x402 SDK middleware in [`main.py`](api/main.py) |
| 10 | Ship Something Real | OpenServ | [`openserv/`](openserv/) | [`openserv.skill.md`](agent/skills/openserv.skill.md) | [openserv-proof.json](deployments/openserv-proof.json) |
| 11 | Open Track | Synthesis | Full repo | [`README.md`](README.md) | [Live demo](https://stakehumansignal.vercel.app) |

## How Each Track Fits the System

```
HUMAN submits review + stakes USDC
  │
  ├─ [ERC-8183] StakeHumanSignalJob.sol — job lifecycle
  ├─ [Filecoin] filecoin-bridge/ — permanent storage on FOC
  │
  ▼
BUYER AGENT scores review
  │
  ├─ [Olas] api/services/olas.py — hires mech for external scoring
  ├─ [Base x402] api/main.py — agent pays 0.001 USDC to access reviews
  │
  ▼
VALIDATION
  │
  ├─ [ERC-8004] ReceiptRegistry.sol — mint receipt NFT (3 registries)
  ├─ [Octant Mechanism] scorer.py — sqrt-weighted conviction staking
  ├─ [Octant Collection] buyer_agent.py — autonomous data collection
  │
  ▼
YIELD DISTRIBUTION
  │
  ├─ [Lido Treasury] LidoTreasury.sol — wstETH principal locked, yield-only
  ├─ [Lido MCP] lido-mcp/ — 11 tools for agents to manage staking
  │
  ▼
FRONTEND
  │
  └─ [Open Track] frontend/ — 7-page dashboard at stakehumansignal.vercel.app
```

## For Each Track: What to Check

### Track 1: ERC-8183 Open Build (Virtuals)
- **Contract:** [`contracts/StakeHumanSignalJob.sol`](contracts/StakeHumanSignalJob.sol)
- **Tests:** `npx hardhat test` — 91 passing
- **Deployed:** [`0xE99027DD...`](https://sepolia.basescan.org/address/0xE99027DDdF153Ac6305950cD3D58C25D17E39902) on Base Sepolia
- **Key:** Full ERC-8183 lifecycle: createJob → fund → submit → complete → reject

### Track 2: Agents With Receipts — ERC-8004 (Protocol Labs)
- **Contract:** [`contracts/ReceiptRegistry.sol`](contracts/ReceiptRegistry.sol)
- **3 registries:** identity (`agentToOwner`), reputation (`getHumanReputationScore`), validation (receipt NFTs)
- **Independence check:** `getIndependenceScore()` prevents self-review on-chain
- **Deployed:** [`0xa39c7b47...`](https://sepolia.basescan.org/address/0xa39c7b475b0708a9854052Fb3Fbc93ccBf656332)

### Track 3: stETH Agent Treasury (Lido)
- **Contract:** [`contracts/LidoTreasury.sol`](contracts/LidoTreasury.sol)
- **Principal locked forever** — no withdraw function
- **distributeYield TX:** [`0x30ad2db8...`](https://sepolia.basescan.org/tx/0x30ad2db8d5047f9296abdf589b8e8108dbdddbaeba529b387b79c010136550ce)
- **Proof file:** [`deployments/treasury-yield-proof.json`](deployments/treasury-yield-proof.json)

### Track 4: Lido MCP Server (Lido)
- **Server:** [`lido-mcp/index.js`](lido-mcp/index.js) — 11 tools
- **Dual-provider:** Ethereum mainnet + Base Sepolia (no cross-network bugs)
- **Skill file:** [`lido-mcp/lido.skill.md`](lido-mcp/lido.skill.md) — rebasing explainer, safe patterns
- **Live test:** `cd lido-mcp && node live-test.js` — 11/11 tools verified against real RPCs
- **Verified:** 1 stETH = 0.813 wstETH (live Ethereum mainnet)

### Track 5: Mechanism Design (Octant)
- **Scorer:** [`api/services/scorer.py`](api/services/scorer.py) — `sqrt(stake) * reputation`
- **Two-layer model:** passive 0.3x + active 0.7x
- **Independence check:** on-chain `getIndependenceScore()` in ReceiptRegistry

### Track 6: Data Collection (Octant)
- **Agent:** [`api/agent/buyer_agent.py`](api/agent/buyer_agent.py) — autonomous collection loop
- **5-dimension rubric:** correctness, relevance, completeness, efficiency, reasoning
- **Storage:** Filecoin (Lighthouse CIDs + FOC PieceCIDs)
- **Log:** [`agent_log.json`](agent_log.json) — 264+ structured entries

### Track 7: Agentic Storage (Filecoin)
- **Bridge:** [`filecoin-bridge/index.js`](filecoin-bridge/index.js) — `@filoz/synapse-sdk` v0.40.0
- **Real FOC:** PieceCID `bafkzcibcduch6lsgmz3rpfq6uhjibwca2lofa6r43ppgul6gqy7vlut7mxsj4ny`
- **USDFC payment:** Borrowed via CDP on Secured Finance (160 tFIL → 204 USDFC)
- **Proof:** [`deployments/olas-mech-proof.json`](deployments/olas-mech-proof.json) (USDFC deposit TX)

### Track 8: Hire an Agent (Olas)
- **Integration:** [`api/services/olas.py`](api/services/olas.py) — real `MarketplaceService`
- **12 on-chain TXs** on Base mainnet: [`deployments/olas-mech-proof.json`](deployments/olas-mech-proof.json)
- **Basescan:** [TX #1](https://basescan.org/tx/0x6cd2887e250790eaf98b206947e480e6f9f331c3df12e6dda3c4e2211cee5770), [TX #12](https://basescan.org/tx/0xc33e784f10c89cca161fbe2ecaac65eccded9ac5704c70be7c7395960a6d5f72)
- **Mech:** #112 at `0xe535d7ac...` (9,845+ deliveries)

### Track 9: Agent Services on Base
- **x402 SDK:** `x402[fastapi]` v2.5.0 with `PaymentMiddlewareASGI`
- **Gate:** `GET /reviews/top` requires 0.001 USDC via EIP-3009
- **Agent:** buyer_agent uses `EthAccountSigner` + `ExactEvmClientScheme` + `x402Client`
- **Facilitator:** `https://x402.org/facilitator` (public testnet)
- **Discoverable:** [`agent.json`](agent.json), [`AGENTS.md`](AGENTS.md), MCP servers

### Track 10: Ship Something Real (OpenServ)
- **Folder:** [`openserv/`](openserv/) — TypeScript agents with `@openserv-labs/sdk` v2
- **Scorer Agent** (ID: 4045): scores reviews with 5-dimension rubric via webhook
- **Coordinator Agent** (ID: 4046): orchestrates evaluation pipeline via x402
- **x402 endpoint:** `https://api.openserv.ai/webhooks/x402/trigger/2dbe17c9...`
- **Paywall:** `https://platform.openserv.ai/workspace/paywall/2dbe17c9...`
- **Proof:** [`deployments/openserv-proof.json`](deployments/openserv-proof.json) (agent IDs, workspace IDs, webhooks)
- **Bonus:** x402-native + ERC-8004 (track gives bonus for both)

### Track 11: Open Track (Synthesis)
- **Live demo:** [stakehumansignal.vercel.app](https://stakehumansignal.vercel.app)
- **API:** [stakesignal-api-production.up.railway.app](https://stakesignal-api-production.up.railway.app/health)
- **Tests:** 91 Solidity + 71 Python + 5 frontend + 12 Lido MCP + 6 StakeSignal MCP + 6 FOC

## Internal References (for our team)

| File | Purpose |
|------|---------|
| [`agent/CLAUDE.md`](agent/CLAUDE.md) | Security rules, sprint state, architecture |
| [`agent/memory.md`](agent/memory.md) | Full project decision log |
| [`agent/tools.md`](agent/tools.md) | External tools and services reference |
| [`agent/files.md`](agent/files.md) | File map of entire codebase |
| [`agent/commands.md`](agent/commands.md) | All commands to run, test, deploy |
| [`agent/skills/`](agent/skills/) | Track-specific skill docs for each integration |
