# olas-mech/ — Olas Mech-Client Integration

**Track:** Hire an Agent on Olas Marketplace | **Sponsor:** Olas | **Prize:** $1,000

## What This Does

Integrates the Olas mech marketplace into StakeHumanSignal's buyer agent. When the agent scores human reviews, it hires an external AI mech on Base mainnet for supplementary intelligence — a second opinion on review quality before validation.

This is NOT bolted on. The mech provides external scoring data that blends with our heuristic scorer (70% heuristic + 30% mech), making the review evaluation pipeline more robust.

## Proven on Base Mainnet

| Item | Value |
|------|-------|
| Chain | Base mainnet (8453) |
| Mech | `0xe535d7acdeed905dddcb5443f41980436833ca2b` (AI Agent #112, 9,845+ deliveries) |
| Wallet | `0x557E1E07652B75ABaA667223B11704165fC94d09` |
| Requests sent | 12 (requirement: 10+) |
| Delivery method | Offchain (instant, no gas) |
| Proof | [`deployments/olas-mech-proof.json`](../deployments/olas-mech-proof.json) |

### Sample Request (real, verified)

```
Request ID: 82007913483706906027465998744936858997429325515142232353129488563410613419568
Prompt: "Rate this AI review quality 1-10: Policy A produced accurate async error handling..."
Mech: 0xe535d7acdeed905dddcb5443f41980436833ca2b
Sender: 0x557E1E07652B75ABaA667223B11704165fC94d09
Task Result: 12d7c929c4095bca727cc1f963edc0e082ebc1dd247892b3a6f547c4beb8b0a8
Delivery: offchain via https://9ea5c24c68527852.agent.propel.autonolas.tech
```

## Architecture

```
buyer_agent.py scoring loop:
  1. Fetch ranked reviews via x402
  2. Score with local heuristic (5-dimension rubric)
  3. Query Olas mech for external AI scoring  ← THIS
  4. Blend scores: 70% heuristic + 30% mech
  5. Validate or reject based on combined score
  6. Mint ERC-8004 receipt on-chain
```

## How to Run

```bash
# Single mech query
python -c "
import asyncio
from api.services.olas import query_olas_mech
result = asyncio.run(query_olas_mech('Rate this AI review quality 1-10: test'))
print(result)
"

# Batch 12 requests (track requirement: 10+)
python scripts/olas_batch_requests.py

# Run buyer agent with mech integration
python -m api.agent.buyer_agent --once
```

## How to Test

```bash
# Check proof file
python -c "
import json
proof = json.load(open('deployments/olas-mech-proof.json'))
print(f'Requests: {proof[\"total_requests\"]}')
print(f'Live: {proof[\"live_requests\"]}')
for r in proof['results'][:3]:
    print(f'  mode={r[\"mode\"]} mech={r.get(\"mech_address\",\"\")[:15]}')
"
```

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `OLAS_MECH_ADDRESS` | `0xe535d7ac...` (mech #112) | Mech to query on Base |
| `PRIVATE_KEY` | — | Wallet for signing requests |

Also requires `ethereum_private_key.txt` in repo root (gitignored).

## Key Files

| File | Location | Purpose |
|------|----------|---------|
| Integration code | [`api/services/olas.py`](../api/services/olas.py) | `MarketplaceService` + `query_olas_mech()` async |
| Batch script | [`scripts/olas_batch_requests.py`](../scripts/olas_batch_requests.py) | 12 requests for track requirement |
| Proof | [`deployments/olas-mech-proof.json`](../deployments/olas-mech-proof.json) | All request IDs + results |
| Buyer agent | [`api/agent/buyer_agent.py`](../api/agent/buyer_agent.py) | Where mech is called in the scoring pipeline |

## SDK

```bash
pip install mech-client   # v0.20.0+, Python 3.10-3.11
```

Real API (not what the docs show — verified by testing):
```python
from mech_client import MarketplaceService, get_mech_config
from aea_ledger_ethereum import EthereumApi, EthereumCrypto

crypto = EthereumCrypto("ethereum_private_key.txt")
config = get_mech_config("base")
config.ledger_config.address = "https://mainnet.base.org"  # override default
ledger_api = EthereumApi(**config.ledger_config.__dict__)

service = MarketplaceService(
    chain_config="base",
    agent_mode=False,
    crypto=crypto,
    ethereum_client=ledger_api,
)

result = await service.send_request(
    prompts=["..."],
    tools=["short_maker"],
    priority_mech="0xe535d7acdeed905dddcb5443f41980436833ca2b",
    use_offchain=True,
    timeout=120,
)
```

### Gotchas We Hit
- `python3` (homebrew 3.14) can't import mech-client — must use `python` (pyenv 3.11)
- `mechx setup` requires interactive password — skip it, use client mode directly
- Default RPC (`base.llamarpc.com`) returns 0 balance — override to `mainnet.base.org`
- `OLAS_MECH_ADDRESS=""` in .env makes `os.getenv("X", "default")` return `""` not `"default"` — use `or` pattern
- `send_request` is async — must `await` it
- Mech #112 only has `short_maker` tool (image generation) — but accepts any text prompt
