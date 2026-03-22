# Skill: Locus Payment Controls
## Track: Best Use of Locus — $3,000 pool
## STATUS: VERIFIED — docs.paywithlocus.com/hackathon

## API (verified)
Base URL: https://beta-api.paywithlocus.com
Auth: x-api-key header (from /api/register)

## Endpoints
- POST /api/register — get apiKey
- GET /api/pay/balance — USDC balance
- POST /api/pay/send — transfer USDC (sponsored gas)
- GET /api/status — wallet status

## Integration points
- api/services/locus.py — Locus client
- buyer_agent.py — logs balance each cycle
- outcomes.py — sends reward payment via Locus

## Env var
LOCUS_API_KEY= (from registration)
