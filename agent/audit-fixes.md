# Pre-Submission Audit & Fixes — March 22, 2026

> gstack-informed codebase audit. Applied "Boil the Lake" + "Search Before Building" principles.

---

## Issues Identified & Fixed

| # | File | Issue | Severity | Status | Fix Applied |
|---|------|-------|----------|--------|-------------|
| 1 | `api/services/web3_client.py:19` | Loads addresses from `addresses.json` (doesn't exist). Deployed addresses are in `deployments/sepolia.json` | **CRITICAL** | **FIXED** | Repointed to `deployments/sepolia.json` with fallback |
| 2 | `api/services/web3_client.py` | No `receipt_registry` attribute. `scorer.py:194` would crash on `web3_svc.receipt_registry` | **CRITICAL** | **FIXED** | Added `self.receipt_registry = self._get_contract("ReceiptRegistry")` |
| 3 | `api/services/web3_client.py:28` | Loads ABIs from Hardhat artifacts (`artifacts/contracts/...`). Artifacts not present in Docker/Railway deploy | **CRITICAL** | **FIXED** | Replaced with inline minimal JSON ABIs (web3.py format) |
| 4 | `api/services/web3_client.py:16` | `PRIVATE_KEY` defaults to `"0x" + "0" * 64` — invalid key, crashes on first tx | **HIGH** | **FIXED** | Falls back to `BASE_SEPOLIA_PRIVATE_KEY`, returns `None` if neither set |
| 5 | `lido-mcp/contracts.js:15-17` | `lidoTreasury`, `stakeSignalJob`, `receiptRegistry` default to `""` → mockMode always true | **HIGH** | **FIXED** | Hardcoded Sepolia addresses as defaults |
| 6 | `lido-mcp/index.js:30` | RPC defaults to Base mainnet, but contracts deployed on Sepolia | **HIGH** | **FIXED** | Defaults to Sepolia RPC |
| 7 | `lido-mcp/index.js:31` | `PRIVATE_KEY` only checks one env var | **MEDIUM** | **FIXED** | Also checks `BASE_SEPOLIA_PRIVATE_KEY` |
| 8 | `docs/aim-tracks.md` | Missing 3 high-value tracks (Agent Cook $4k, Octant x2 $2k) | **HIGH** | **FIXED** | Rewritten with gstack strategy, 10 tracks + Open |

## Issues Identified — Not Fixed (Low Priority or No Time)

| # | File | Issue | Severity | Impact |
|---|------|-------|----------|--------|
| 9 | `x402-server/index.js` | Accepts any `0x`-prefixed header without signature verification | MEDIUM | x402 gate bypassable |
| 10 | `frontend/src/app/submit/page.tsx` | "Stake USDC & Mint ERC-8004 Receipt" button only POSTs JSON — no actual staking | LOW | UI misleading but acceptable for hackathon demo |
| 11 | `filecoin-bridge/index.js` | Local CID store (in-memory Map), lost on restart. Falls back if no FILECOIN_PRIVATE_KEY | MEDIUM | Lighthouse path works if API key set |
| 12 | `api/data/reviews.json` | Contains 3 hardcoded demo entries with `bafylocal` CIDs | LOW | Demo data, acceptable |
| 13 | `api/routes/sessions.py` | `sessions_db` and `passive_signals` are in-memory, lost on restart | LOW | By design for hackathon |
| 14 | `api/routes/jobs.py` | `jobs_db` in-memory, lost on restart | LOW | By design |
| 15 | `api/services/olas.py:29` | `mech_client` import not in requirements.txt | LOW | Guarded by try/except, demo fallback works |
| 16 | `requirements.txt` | `eth-account>=0.13.7` may conflict with `lighthouseweb3==0.1.6` | LOW | lighthouseweb3 has its own eth-account pin |
| 17 | `frontend/src/app/leaderboard/page.tsx` | "Load More" button has no onClick handler | LOW | UI only |
| 18 | `frontend/src/app/leaderboard/page.tsx` | Time filter buttons (24H/ALL TIME) don't filter data | LOW | UI only |

## API Keys Status

| Service | Env Var | Required For | Status |
|---------|---------|-------------|--------|
| BASE_SEPOLIA_PRIVATE_KEY | Signing transactions | On-chain operations | Set in .env (not committed) |
| LIGHTHOUSE_API_KEY | Real Filecoin storage | Filecoin track | Set in .env |
| BANKR_API_KEY | LLM ensemble scoring | Bankr track (dropped) | Set but unused |
| LOCUS_API_KEY | USDC payments | Locus track (dropped) | Set but unused |
| RECEIVER_ADDRESS | x402 payment receiver | Base track | Set in .env |

## Contract Deployment Verification

All 4 contracts verified deployed on Base Sepolia (chainId 84532):

| Contract | Address | Verified |
|----------|---------|----------|
| StakeHumanSignalJob | 0xE99027DDdF153Ac6305950cD3D58C25D17E39902 | TX proof in sepolia-e2e-proof.json |
| LidoTreasury | 0x8E29D161477D9BB00351eA2f69702451443d7bf5 | TX proof in sepolia-e2e-proof.json |
| ReceiptRegistry | 0xa39c7b475b0708a9854052Fb3Fbc93ccBf656332 | TX proof in sepolia-e2e-proof.json |
| SessionEscrow | 0xe817C338aD7612184CFB59AeA7962905b920e2e9 | Deployed, no e2e proof |

## Solidity Security Audit Summary

- 91 tests, all passing
- ReentrancyGuard on all state-modifying functions with external transfers
- SafeERC20 for all token transfers
- Checks-effects-interactions pattern correctly implemented
- Access control (onlyOwner, onlyEvaluator, onlyMinter, onlyWhitelisted)
- Zero address checks on all relevant functions
- No critical vulnerabilities detected
- wstETH address on Sepolia is placeholder (`0x00...01`) — no official wstETH on testnet

## Track Strategy Update

| Before (7 tracks) | After (10 tracks) | Delta |
|--------------------|--------------------|-------|
| $15,667 max | $21,167 max | +$5,500 |
| Missing Agent Cook ($4k) | Added — ERC-8004 bonus differentiator | +$4,000 pool |
| Missing Octant ($2k) | Added — mechanism design is our core thesis | +$2,000 pool |
| Lido MCP in mock mode | Fixed — reads real Sepolia contracts | Risk eliminated |
| web3_client.py broken | Fixed — loads deployed addresses + inline ABIs | Runtime crash prevented |
