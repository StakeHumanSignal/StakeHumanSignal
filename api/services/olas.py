"""Olas mech-client — hire agents on Olas Marketplace for external intelligence."""

import os
import json
import time

OLAS_MECH_ADDRESS = os.getenv("OLAS_MECH_ADDRESS", "")
OLAS_PRIVATE_KEY = os.getenv("PRIVATE_KEY", "") or os.getenv("BASE_SEPOLIA_PRIVATE_KEY", "")


async def query_olas_mech(prompt: str, tool: str = "prediction-online") -> dict:
    """Query an Olas mech agent for external intelligence.

    Returns: {"response": "...", "mode": "live"|"demo", "tool": "..."}
    """
    if not OLAS_MECH_ADDRESS or not OLAS_PRIVATE_KEY:
        # Demo mode — log the request without on-chain tx
        return {
            "response": f"[Olas demo] Would query mech {OLAS_MECH_ADDRESS or 'NOT_SET'} with tool={tool}: {prompt[:100]}",
            "mode": "demo",
            "tool": tool,
            "prompt": prompt[:200],
            "timestamp": time.time(),
        }

    try:
        from mech_client.services import MarketplaceService, PaymentType

        service = MarketplaceService(
            chain_config="base",
            private_key=OLAS_PRIVATE_KEY,
            mode="request",
        )

        result = service.send_request(
            priority_mech=OLAS_MECH_ADDRESS,
            tools=[tool],
            prompts=[prompt],
            payment_type=PaymentType.NATIVE,
        )

        return {
            "response": str(result),
            "mode": "live",
            "tool": tool,
            "prompt": prompt[:200],
            "timestamp": time.time(),
        }
    except Exception as e:
        return {
            "response": f"[Olas error] {str(e)}",
            "mode": "error",
            "tool": tool,
            "prompt": prompt[:200],
            "timestamp": time.time(),
        }


async def batch_query_olas(prompts: list[str], tool: str = "prediction-online") -> list[dict]:
    """Send batch of prompts to Olas mech. For 10+ request requirement."""
    results = []
    for prompt in prompts:
        result = await query_olas_mech(prompt, tool)
        results.append(result)
    return results
