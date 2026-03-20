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

## Not Started

- [ ] .env setup with real keys (PRIVATE_KEY, VENICE_API_KEY, CDP keys, FILECOIN_PRIVATE_KEY)
- [ ] Deploy contracts to Base Mainnet (needs funded wallet ~0.01 ETH on Base)
- [ ] Fill addresses in agent.json and AGENTS.md after deploy
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
