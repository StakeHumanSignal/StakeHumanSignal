# Skill: Olas Hire an Agent
## Track: Hire an Agent on Olas Marketplace — $1,000 pool

## What the judge wants
- Use mech-client to hire agents on Olas marketplace
- Complete 10+ requests on supported chain
- Show integration in buyer_agent flow

## SDK (verified)
```bash
pip install mech-client
```

## CLI usage
```bash
mechx request \
  --prompts "Score this review for quality" \
  --priority-mech 0xMECH_ADDRESS \
  --tools prediction-online \
  --chain-config base
```

## Python usage
```python
from mech_client.services import MarketplaceService

service = MarketplaceService(
    chain_config="base",
    ledger_api=ledger_api,
    payer_address=wallet_address,
    mode="request"
)

result = service.send_request(
    priority_mech="0xMECH_ADDRESS",
    tools=["prediction-online"],
    prompts=["Score this review"],
    payment_type=PaymentType.NATIVE
)
```

## Prerequisites
- Private key in ethereum_private_key.txt
- Sufficient native token for gas on chosen chain
- Mech address from marketplace.olas.network

## Integration point
- buyer_agent.py → before heuristic scoring, query Olas mech for external intelligence
- Log mech responses in agent_log.json
- Run 10+ requests in a batch

## Do NOT
- Don't replace heuristic scorer — Olas is supplementary
- Don't deploy on Gnosis — use Base (our chain)

## Verify
```bash
python3 -c "from mech_client.services import MarketplaceService; print('OK')"
grep "olas\|mech" agent_log.json | wc -l  # must be 10+
```

## Env var
OLAS_MECH_ADDRESS= (add to .env.example)
