"""Filecoin FOC storage via Synapse SDK (Node.js bridge)."""

import json
import httpx
import os


async def store_on_filecoin(data: dict) -> str | None:
    """Store data on Filecoin FOC via the Node.js Synapse bridge.

    Returns the CID or None on failure.
    """
    bridge_url = os.getenv("FILECOIN_BRIDGE_URL", "http://localhost:3001")

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{bridge_url}/store",
                json=data,
            )
            if response.status_code == 200:
                return response.json().get("cid")
    except Exception as e:
        print(f"[Filecoin] Storage failed: {e}")

    return None


async def retrieve_from_filecoin(cid: str) -> dict | None:
    """Retrieve data from Filecoin FOC by CID."""
    bridge_url = os.getenv("FILECOIN_BRIDGE_URL", "http://localhost:3001")

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(f"{bridge_url}/retrieve/{cid}")
            if response.status_code == 200:
                return response.json()
    except Exception as e:
        print(f"[Filecoin] Retrieval failed: {e}")

    return None
