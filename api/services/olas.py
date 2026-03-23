"""Olas mech-client — hire agents on Olas Marketplace for external intelligence.

Uses the real mech-client SDK to query AI mechs on Base mainnet.
Track: Hire an Agent on Olas Marketplace ($1,000)
Requires: pip install mech-client, ethereum_private_key.txt, ETH on Base for gas.
"""

import os
import time
import asyncio
import json

OLAS_MECH_ADDRESS = os.getenv("OLAS_MECH_ADDRESS") or "0xe535d7acdeed905dddcb5443f41980436833ca2b"


def _get_service():
    """Create MarketplaceService with real credentials."""
    from mech_client import MarketplaceService, get_mech_config
    from aea_ledger_ethereum import EthereumApi, EthereumCrypto

    # Search for key file in multiple locations
    candidates = [
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "ethereum_private_key.txt"),
        os.path.join(os.getcwd(), "ethereum_private_key.txt"),
        "ethereum_private_key.txt",
    ]
    key_file = None
    for c in candidates:
        if os.path.exists(c):
            key_file = c
            break
    if not key_file:
        return None, None

    crypto = EthereumCrypto(key_file)
    config = get_mech_config("base")
    config.ledger_config.address = "https://mainnet.base.org"
    ledger_api = EthereumApi(**config.ledger_config.__dict__)

    service = MarketplaceService(
        chain_config="base",
        agent_mode=False,
        crypto=crypto,
        ethereum_client=ledger_api,
    )
    return service, crypto


async def query_olas_mech(prompt: str, tool: str = "short_maker") -> dict:
    """Query an Olas mech agent for external intelligence on Base mainnet.

    Returns: {"response": ..., "mode": "live"|"demo", "request_id": ..., ...}
    """
    if not OLAS_MECH_ADDRESS:
        return {
            "response": "OLAS_MECH_ADDRESS not set",
            "mode": "demo",
            "tool": tool,
            "timestamp": time.time(),
        }

    try:
        service, crypto = _get_service()
        if not service:
            return {
                "response": "ethereum_private_key.txt not found — mech-client not configured",
                "mode": "demo",
                "tool": tool,
                "timestamp": time.time(),
            }

        result = await service.send_request(
            prompts=[prompt],
            tools=[tool],
            priority_mech=OLAS_MECH_ADDRESS,
            use_offchain=True,
            timeout=120,
        )

        # Extract delivery results — handle both completed and timed-out requests
        deliveries = result.get("delivery_results", {})
        first_delivery = next(iter(deliveries.values()), {}) if deliveries else {}
        request_ids = result.get("request_ids", [])

        return {
            "response": first_delivery.get("task_result", str(result)[:500]),
            "mode": "live",
            "tool": tool,
            "prompt": prompt[:200],
            "request_id": first_delivery.get("request_id") or (request_ids[0] if request_ids else ""),
            "request_ids": request_ids,
            "mech_address": first_delivery.get("mech_address", OLAS_MECH_ADDRESS),
            "sender": first_delivery.get("sender", crypto.address if crypto else ""),
            "is_offchain": first_delivery.get("is_offchain", True),
            "delivered": bool(first_delivery.get("task_result")),
            "timestamp": time.time(),
        }
    except Exception as e:
        return {
            "response": f"[Olas error] {str(e)[:200]}",
            "mode": "error",
            "tool": tool,
            "prompt": prompt[:200],
            "timestamp": time.time(),
        }


async def batch_query_olas(prompts: list[str], tool: str = "short_maker") -> list[dict]:
    """Send batch of prompts to Olas mech. For 10+ request requirement."""
    results = []
    for prompt in prompts:
        result = await query_olas_mech(prompt, tool)
        results.append(result)
    return results
