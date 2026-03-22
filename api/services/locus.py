"""Locus — agent payment infrastructure on Base (USDC)."""

import os
import httpx

LOCUS_URL = "https://beta-api.paywithlocus.com"
LOCUS_API_KEY = os.getenv("LOCUS_API_KEY", "")


async def register_agent(name: str, email: str) -> dict:
    """Register an agent with Locus. Returns apiKey + ownerPrivateKey."""
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(f"{LOCUS_URL}/api/register", json={"name": name, "email": email})
        return r.json() if r.status_code == 200 else {"error": r.text}


async def get_balance() -> dict:
    """Get Locus wallet USDC balance."""
    if not LOCUS_API_KEY:
        return {"balance": "0.00", "mode": "demo", "note": "LOCUS_API_KEY not set"}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(f"{LOCUS_URL}/api/pay/balance", headers={"x-api-key": LOCUS_API_KEY})
            if r.status_code == 200:
                return {**r.json(), "mode": "live"}
            return {"balance": "0.00", "mode": "error", "status": r.status_code}
    except Exception as e:
        return {"balance": "0.00", "mode": "error", "error": str(e)}


async def send_payment(to_address: str, amount_usdc: float, memo: str = "") -> dict:
    """Send USDC via Locus (Base chain, sponsored gas)."""
    if not LOCUS_API_KEY:
        return {"tx_hash": None, "mode": "demo", "note": "LOCUS_API_KEY not set"}
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                f"{LOCUS_URL}/api/pay/send",
                headers={"x-api-key": LOCUS_API_KEY},
                json={"to": to_address, "amount": str(amount_usdc), "memo": memo},
            )
            if r.status_code == 200:
                return {**r.json(), "mode": "live"}
            return {"tx_hash": None, "mode": "error", "status": r.status_code, "detail": r.text[:200]}
    except Exception as e:
        return {"tx_hash": None, "mode": "error", "error": str(e)}


async def get_status() -> dict:
    """Get Locus wallet status."""
    if not LOCUS_API_KEY:
        return {"status": "demo", "note": "LOCUS_API_KEY not set"}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(f"{LOCUS_URL}/api/status", headers={"x-api-key": LOCUS_API_KEY})
            return r.json() if r.status_code == 200 else {"status": "error", "code": r.status_code}
    except Exception as e:
        return {"status": "error", "error": str(e)}
