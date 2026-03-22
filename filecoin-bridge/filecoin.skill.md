---
name: filecoin-bridge
description: Filecoin Onchain Cloud storage bridge using @filoz/synapse-sdk. Stores review data permanently on FOC calibration testnet with USDFC payments and PDP proofs. Express API on port 3001 for Python backend integration.
---

# Filecoin FOC Storage Bridge

## The Mental Model

Every review in StakeHumanSignal must be permanent. If reviews can be deleted or modified, the entire reputation and yield system collapses — you can't trust scores built on data that might disappear.

This bridge stores review data on Filecoin Onchain Cloud (FOC) using the official `@filoz/synapse-sdk`. Data is committed to storage providers who must periodically prove they still hold it (PDP — Proof of Data Possession). This is stronger than IPFS pinning (which can be unpinned) or database storage (which can be wiped).

### Storage Flow

```
Python API receives review
  → POST /store to this bridge
  → Synapse SDK uploads to FOC service provider
  → Provider commits on-chain (USDFC payment)
  → PieceCID returned (content-addressed, tamper-evident)
  → CID stored in review record + linked to ERC-8004 receipt
```

### Two Storage Paths

| Path | SDK | Speed | Proof Level | Used By |
|------|-----|-------|-------------|---------|
| FOC | `@filoz/synapse-sdk` (Node.js) | 1-3 min | PieceCID + PDP on-chain proof + USDFC payment | This bridge |
| Lighthouse | `lighthouseweb3` (Python) | Instant | IPFS CID + Filecoin deal | buyer_agent log pinning |

Both are live. FOC for maximum proof depth. Lighthouse for speed during agent scoring loops.

## API Endpoints

### POST /store

Store JSON data on Filecoin FOC.

```bash
curl -X POST http://localhost:3001/store \
  -H "Content-Type: application/json" \
  -d '{"type": "review", "data": {"reviewer": "0x...", "score": 85}}'
```

Returns:
```json
{
  "cid": "bafkzcib...",
  "size": 142,
  "storage": "filecoin-foc",
  "network": "calibration"
}
```

### GET /retrieve/:cid

Retrieve stored data by CID.

```bash
curl http://localhost:3001/retrieve/bafkzcib...
```

### GET /health

Check connection status.

```json
{
  "status": "ok",
  "network": "calibration",
  "synapse": "connected",
  "sdk": "@filoz/synapse-sdk@0.40.0"
}
```

## Setup

```bash
cd filecoin-bridge
npm install
node index.js
```

Requires in `.env`:
```
# Any ONE of these for signing (existing wallet works)
FILECOIN_PRIVATE_KEY=0x...
# OR
BASE_SEPOLIA_PRIVATE_KEY=0x...
# OR
PRIVATE_KEY=0x...

# Optional: switch to mainnet
FILECOIN_NETWORK=calibration  # or "mainnet"
```

### Getting USDFC (Required for FOC Storage)

USDFC is NOT a faucet token. It's a CDP stablecoin:

1. Get tFIL from https://faucet.calibnet.chainsafe-fil.io
2. Go to https://stg.usdfc.net — switch to Calibration
3. Open a Trove: deposit 160 tFIL → borrow 200 USDFC
4. Minimum borrow: 200 USDFC, minimum collateral ratio: 150%

## On-Chain Proof

| Item | Value |
|------|-------|
| PieceCID | `bafkzcibcduch6lsgmz3rpfq6uhjibwca2lofa6r43ppgul6gqy7vlut7mxsj4ny` |
| USDFC deposit TX | `0x244c2a1df2dc9aea6a3b9648cd9a2b3a206017d4f511f1871627f9a72a9a3d2d` |
| Network | Filecoin Calibration (chain 314159) |
| USDFC contract | `0xb3042734b608a1B16e9e86B374A3f3e389B4cDf0` |

## For Agents

If you're an agent that wants to store data permanently:

```javascript
// Via the bridge HTTP API
const response = await fetch("http://localhost:3001/store", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ type: "agent_data", content: "..." }),
});
const { cid } = await response.json();
// cid is a real FOC PieceCID with PDP proofs
```

If the FOC path fails (no USDFC, network issues), the bridge falls back to local CID generation. Check the `storage` field in the response — `"filecoin-foc"` means real, `"local-fallback"` means degraded.
