# StakeHumanSignal — Project State

> Last updated: March 21, 2026 (session 1)

## Completed

- [x] Private GitHub repo: https://github.com/LingSiewWin/StakeHumanSignal
- [x] Synthesis hackathon registration
  - Participant ID: `6d95149b1c87410dbe4d7a01cd209afb`
  - Team ID: `baacd78ca8d44b7b97e48ed8bdc1b9db`
  - Invite code: `036c9a15cb67`
  - API Key: `sk-synth-14121259f1f07c38a5180aecf3786191821adf30b2be1303`
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

## Next Session Should Start At

**Deploy contracts to Base Mainnet.** Steps:
1. Set up .env with funded wallet private key
2. `npx hardhat run scripts/deploy.js --network base`
3. Update agent.json + AGENTS.md with real addresses
4. Verify contracts on Basescan
5. Build Filecoin Synapse bridge
6. Run end-to-end test

## Key Decisions Made

- **Solidity 0.8.28 + Cancun EVM** — required by OpenZeppelin 5.6.1 (mcopy opcode)
- **bun for packages, npx for Hardhat** — bun can't run Hardhat (native module issue)
- **In-memory stores** for reviews_db and jobs_db — sufficient for hackathon demo
- **x402 gateway as separate Express server** — proxies to FastAPI, keeps Python clean
- **Filecoin via Node.js bridge** — Synapse SDK is JS-only, Python calls bridge HTTP API

## Deadline

**March 23, 2026 at 1:00 AM MYT** (March 22 at 5:00 PM UTC)
~44 hours from session start.
