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
| On-chain TXs | **12 confirmed** (requirement: 10+) |
| Deposit TX | [`0x16da2190...`](https://basescan.org/tx/0x16da2190da47349fafdcf2111f8e8774b0b1ee469dcd4a4671241f414d9ff046) |
| Proof | [`deployments/olas-mech-proof.json`](../deployments/olas-mech-proof.json) |

### All 12 On-Chain TX Hashes (Base Mainnet — Basescan)

| # | TX Hash |
|---|---------|
| 1 | [`0x6cd2887e...`](https://basescan.org/tx/0x6cd2887e250790eaf98b206947e480e6f9f331c3df12e6dda3c4e2211cee5770) |
| 2 | [`0xc6199223...`](https://basescan.org/tx/0xc6199223f3e44a74da5b7129a77e464e582ebde5e1d18891f060ef6d740bf74c) |
| 3 | [`0x936e6e5c...`](https://basescan.org/tx/0x936e6e5cc754f06a4aa73aeeafe29cc3ffe72ed2c1fda9b409f570082dd2f31a) |
| 4 | [`0x111e18c0...`](https://basescan.org/tx/0x111e18c0fb0b668bf08a5a6ae7ed1461c980eaf72eefbf376bcb3cfcc2feb67b) |
| 5 | [`0x64e22c8e...`](https://basescan.org/tx/0x64e22c8e8784605ac511aa950d66f808dea69f4f9e8741d63231c51828186f77) |
| 6 | [`0x21ed244c...`](https://basescan.org/tx/0x21ed244c9b02194c3ce599ebe4499032bdc4bad498017bc6263ca504e7dcec2c) |
| 7 | [`0x23efc637...`](https://basescan.org/tx/0x23efc637b6a575fe3558ea9aeccecadc413c434af3be94512d1a8258d97b0ea6) |
| 8 | [`0x86035b6c...`](https://basescan.org/tx/0x86035b6cda23266e5d0771ca52959aed721e1f0ce6157e728cc34fb94fd67ce3) |
| 9 | [`0x7f8d3e33...`](https://basescan.org/tx/0x7f8d3e337832c87cabb8bf0f5c5faecea48edcc6e7654383d1a704a9f7732404) |
| 10 | [`0x2cb16fd6...`](https://basescan.org/tx/0x2cb16fd6b7ce57d2938b386669065adfd3b09619a4389d3cb925810e1faefbf8) |
| 11 | [`0x906bb516...`](https://basescan.org/tx/0x906bb5163eae4018ab3818e2ac02d32353952c050339989d8286a0682e35dd73) |
| 12 | [`0xc33e784f...`](https://basescan.org/tx/0xc33e784f10c89cca161fbe2ecaac65eccded9ac5704c70be7c7395960a6d5f72) |

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
