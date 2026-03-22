# filecoin-bridge/ — Filecoin Storage Bridge

**Track:** Agentic Storage (Filecoin) | **Sponsor:** Filecoin | **Prize:** $2,000

## What This Does

Node.js Express service that stores and retrieves review data on Filecoin. The Python API calls this bridge to persist every submitted review as a content-addressable CID. When Synapse SDK is available with a Filecoin private key, data goes to Filecoin FOC mainnet. Otherwise, falls back to local deterministic CID generation for development.

## Architecture

```
Human submits review → Python API → POST /store → Filecoin bridge
                                                  ├── Synapse SDK → Filecoin FOC (mainnet)
                                                  └── Local fallback → bafylocal{sha256}
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/store` | Store JSON data, returns `{ cid, url, size, storage }` |
| `GET` | `/retrieve/:cid` | Retrieve stored data by CID |
| `GET` | `/health` | Health check with storage mode info |

## How to Run

```bash
cd filecoin-bridge
npm install   # or bun install
node index.js
# → Filecoin Bridge on port 3001
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FILECOIN_PRIVATE_KEY` | — | Filecoin key for Synapse SDK (enables real storage) |
| `FILECOIN_BRIDGE_PORT` | `3001` | Server port |

## How to Test

```bash
# Store data
curl -X POST http://localhost:3001/store \
  -H "Content-Type: application/json" \
  -d '{"review": "test", "score": 85}'

# Retrieve by CID
curl http://localhost:3001/retrieve/bafylocal...

# Health check
curl http://localhost:3001/health
```

## Key Files

- `index.js` — Express server with Synapse SDK integration and local fallback
- `x402-server.js` — Manual x402 payment verification (shared with x402-server/)
