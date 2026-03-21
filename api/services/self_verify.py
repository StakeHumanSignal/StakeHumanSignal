# DEFERRED - Self Protocol integration not active. Kept for future reference.
"""Self Protocol — human identity verification for reviewers.

Uses Self Agent ID to verify reviewers are real humans via ZK proofs.
Verified reviewers get a trust weight boost in scoring.
Docs: https://docs.self.xyz
"""

import os
import httpx

SELF_API_BASE = "https://app.ai.self.xyz/api"

# Trust multiplier for verified humans
VERIFIED_TRUST_MULTIPLIER = 1.5
UNVERIFIED_TRUST_MULTIPLIER = 1.0


async def check_self_verification(wallet_address: str) -> dict:
    """Check if a wallet address has a Self Agent ID verification.

    Returns: {"verified": bool, "trust_multiplier": float, "attributes": {...}}
    """
    if not wallet_address or wallet_address == "0x" + "0" * 40:
        return {"verified": False, "trust_multiplier": UNVERIFIED_TRUST_MULTIPLIER, "attributes": {}}

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # Query Self Agent ID registry for this address
            resp = await client.get(
                f"{SELF_API_BASE}/a2a",
                params={"address": wallet_address},
            )

            if resp.status_code == 200:
                data = resp.json()
                is_verified = data.get("verified", False)
                return {
                    "verified": is_verified,
                    "trust_multiplier": VERIFIED_TRUST_MULTIPLIER if is_verified else UNVERIFIED_TRUST_MULTIPLIER,
                    "attributes": {
                        "is_human": data.get("is_human", False),
                        "nationality": data.get("nationality"),
                        "age_verified": data.get("age_verified", False),
                    },
                }
    except Exception as e:
        print(f"[Self] Verification check failed: {e}")

    return {"verified": False, "trust_multiplier": UNVERIFIED_TRUST_MULTIPLIER, "attributes": {}}


def apply_trust_weight(score: float, trust_multiplier: float, stake_amount: float) -> float:
    """Apply Self verification trust weight to a review's composite score.

    Verified humans get a 1.5x multiplier on their composite score.
    """
    return score * trust_multiplier * stake_amount


async def get_agent_identity() -> dict:
    """Get our own agent's Self Agent ID info for agent.json."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{SELF_API_BASE}/a2a")
            if resp.status_code == 200:
                return resp.json()
    except Exception:
        pass
    return {}
