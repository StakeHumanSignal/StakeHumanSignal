# Skill: Olas — Hire an Agent on Marketplace
## Track: Hire an Agent on Olas Marketplace — $1,000 (1st $500 / 2nd $300 / 3rd $200)

## Status: LIVE ON BASE MAINNET

- [x] mech-client installed (`pip install mech-client`)
- [x] MarketplaceService connected to Base mainnet (chain 8453)
- [x] Real mech query completed: request ID `76227960...` from `0xe535d7ac...`
- [x] Offchain delivery confirmed (no gas spent, instant response)
- [x] 10+ requests sent via batch script
- [x] Proof saved to `deployments/olas-mech-proof.json`

## How It Fits Our Project

The buyer agent uses Olas mech as **external intelligence** during the review scoring loop:

```
buyer_agent fetches reviews
  → scores with local heuristic (5-dimension rubric)
  → queries Olas mech for supplementary AI scoring (NEW)
  → blends scores: 70% heuristic + 30% Olas mech
  → validates or rejects based on combined score
```

This is NOT bolted on — the mech provides a second opinion that makes the scoring more robust. Like asking a colleague to review your work before submitting.

## What Olas Mech Does For Us

| Purpose | How |
|---------|-----|
| Review quality assessment | "Rate this AI review quality 1-10: [review text]" |
| A/B comparison validation | "Which output is better for [task]: A or B?" |
| Claim credibility check | "Assess review credibility: reviewer staked X USDC claiming..." |
| Meta-review scoring | "Score this evaluation signal for calibration quality" |

## Implementation

### Real API (verified working)

```python
from mech_client import MarketplaceService, get_mech_config
from aea_ledger_ethereum import EthereumApi, EthereumCrypto

crypto = EthereumCrypto("ethereum_private_key.txt")
config = get_mech_config("base")
config.ledger_config.address = "https://mainnet.base.org"
ledger_api = EthereumApi(**config.ledger_config.__dict__)

service = MarketplaceService(
    chain_config="base",
    agent_mode=False,
    crypto=crypto,
    ethereum_client=ledger_api,
)

result = await service.send_request(
    prompts=["Rate this AI review quality..."],
    tools=["short_maker"],
    priority_mech="0xe535d7acdeed905dddcb5443f41980436833ca2b",
    use_offchain=True,
    timeout=90,
)
```

### Key Gotchas
- `send_request` is **async** — must `await` it
- Needs `ethereum_private_key.txt` (64-char hex, no 0x prefix) — NOT in code, NOT committed
- `use_offchain=True` avoids gas costs (instant delivery via mech's offchain URL)
- Base mainnet RPC override needed: `config.ledger_config.address = "https://mainnet.base.org"` (default llamarpc has issues)
- `mechx setup --chain-config base` requires interactive password — skip it, use client mode directly

### Available Mechs on Base

| Mech ID | Address | Deliveries | Payment |
|---------|---------|-----------|---------|
| 112 | `0xe535d7acdeed905dddcb5443f41980436833ca2b` | 9,845 | Fixed Price Native |
| 165 | `0x8c083dfe9bee719a05ba3c75a9b16be4ba52c299` | 2,835 | Fixed Price Native |
| 182 | `0xb55fadf1f0bb1de99c13301397c7b67fde44f6b1` | 1,322 | Fixed Price Native |

We use mech 112 (most popular, most reliable).

## Track Requirements

| Requirement | Status |
|-------------|--------|
| Integrate mech-client | Done — `api/services/olas.py` |
| 10+ completed requests on supported chain | Done — 12 requests via `scripts/olas_batch_requests.py` |
| Show integration in product logic | Done — buyer_agent queries mech for supplementary scoring |
| Proof | `deployments/olas-mech-proof.json` |

## Key Files
- `api/services/olas.py` — real MarketplaceService integration (async, Base mainnet)
- `scripts/olas_batch_requests.py` — batch 12 requests for track requirement
- `deployments/olas-mech-proof.json` — all request IDs and results
- `ethereum_private_key.txt` — wallet key (gitignored, never committed)

## Verify
```bash
# Single request
python -c "import asyncio; from api.services.olas import query_olas_mech; print(asyncio.run(query_olas_mech('test')))"

# Batch (10+ for track)
python scripts/olas_batch_requests.py

# Check proof
cat deployments/olas-mech-proof.json | python -m json.tool | head -20
```

## Resources
- mech-client docs: https://stack.olas.network/mech-client/
- Hire an agent: https://build.olas.network/hire
- Olas marketplace: https://marketplace.olas.network/
- GitHub: https://github.com/valory-xyz/mech-client
