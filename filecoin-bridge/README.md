# filecoin-bridge/ — Filecoin Onchain Cloud Storage

**Track:** Agentic Storage (Filecoin) | **Sponsor:** Filecoin | **Prize:** $2,000

## What This Does

Express.js bridge that stores review data on **Filecoin Onchain Cloud (FOC)** using the official `@filoz/synapse-sdk` v0.40.0. Every review submitted through the marketplace is permanently stored with PDP (Proof of Data Possession) proofs. Paid with USDFC on Filecoin calibration testnet.

This is NOT Lighthouse, NOT IPFS pinning, NOT local hashing. This is real Filecoin Onchain Cloud with on-chain payment rails and cryptographic storage proofs.

## Proven on Filecoin Calibration

| Item | Value |
|------|-------|
| PieceCID | `bafkzcibcduch6lsgmz3rpfq6uhjibwca2lofa6r43ppgul6gqy7vlut7mxsj4ny` |
| USDFC deposit TX | `0x244c2a1df2dc9aea...` (block 3562333) |
| Network | Filecoin Calibration (chain 314159) |
| SDK | `@filoz/synapse-sdk` v0.40.0 |
| Payment | USDFC via CDP on Secured Finance (160 tFIL → 204 USDFC) |

## How to Run

```bash
cd filecoin-bridge
npm install
node index.js                    # Start FOC bridge on port 3001
```

## How to Test

```bash
npm test                         # 6 FOC integration tests

# Store data
curl -X POST http://localhost:3001/store \
  -H "Content-Type: application/json" \
  -d '{"type": "review", "data": {"score": 85}}'

# Health check
curl http://localhost:3001/health
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/store` | Store JSON on FOC → returns `{ cid, storage: "filecoin-foc" }` |
| `GET` | `/retrieve/:cid` | Retrieve stored data by PieceCID |
| `GET` | `/health` | Connection status + SDK version |

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `PRIVATE_KEY` | — | Signing key (same wallet as Base Sepolia) |
| `FILECOIN_NETWORK` | `calibration` | `calibration` or `mainnet` |
| `FILECOIN_BRIDGE_PORT` | `3001` | Server port |

### Getting USDFC (Required for Storage)

USDFC is a CDP stablecoin — you borrow it by locking tFIL:

1. Get tFIL: https://faucet.calibnet.chainsafe-fil.io
2. Open Trove: https://stg.usdfc.net — deposit 160 tFIL → borrow 200 USDFC
3. Minimum: 200 USDFC borrow, 150% collateral ratio in Recovery Mode

## Key Files

| File | Purpose |
|------|---------|
| `index.js` | Express server + Synapse SDK integration (ESM) |
| `filecoin.skill.md` | Agent skill — FOC setup, USDFC guide, dual storage strategy |
| `filecoin-bridge.test.js` | 6 integration tests (SDK connect, balances, costs, proof CID) |
| `package.json` | `@filoz/synapse-sdk` v0.40.0 + `viem` |
