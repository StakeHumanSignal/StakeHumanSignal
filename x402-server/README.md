# x402-server/ — x402 Payment Gateway

**Track:** Agent Services on Base | **Sponsor:** Base | **Prize:** $5,000 (3 winners)

## What This Does

Express.js proxy that gates `/reviews/top` behind an x402 micropayment (0.001 USDC on Base Sepolia). When an autonomous agent requests ranked reviews, it receives a `402 Payment Required` response with payment instructions. After payment, the gateway proxies the request to the Python FastAPI backend. All other API routes pass through unmodified.

## How x402 Works

```
Agent → GET /reviews/top → x402-server
                           ├── No payment header → 402 response with payment challenge
                           ├── Valid payment → proxy to FastAPI backend
                           └── ?dryRun=true → bypass payment (testing)
```

The 402 response includes:
- `scheme: "exact"` — exact payment amount
- `maxAmountRequired: "1000"` — 0.001 USDC (6 decimals)
- `asset: 0x036CbD53842c5426634e7929541eC2318f3dCF7e` — USDC on Base Sepolia
- `network: "base-sepolia"`

## How to Run

```bash
cd x402-server
npm install   # or bun install
node index.js
# → x402 gateway on port 3000, proxying to localhost:8000
```

## How to Test

```bash
# Should return 402 with payment challenge
curl -i http://localhost:3000/reviews/top

# Bypass payment for testing
curl http://localhost:3000/reviews/top?dryRun=true

# Live API (payment bypassed server-side)
curl https://stakesignal-api-production.up.railway.app/reviews/top?dryRun=true
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `X402_PORT` | `3000` | Gateway port |
| `API_BACKEND` | `http://localhost:8000` | FastAPI backend URL |
| `RECEIVER_ADDRESS` | — | Wallet receiving payments |
| `X402_NETWORK` | `base-sepolia` | Network for payment |
| `FACILITATOR_PRIVATE_KEY` | — | Key for @x402/express SDK verification |

## Key Files

- `index.js` — Express proxy with x402 SDK + manual fallback verification
