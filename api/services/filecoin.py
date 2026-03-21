"""Filecoin FOC storage via Synapse SDK (Node.js bridge).

Stores review data, agent logs, and outcomes permanently on Filecoin.
Bridge runs on FILECOIN_BRIDGE_URL (default http://localhost:3001).
Falls back gracefully if bridge is unavailable.
"""

import json
import os
import time

import httpx

FILECOIN_BRIDGE_URL = os.getenv("FILECOIN_BRIDGE_URL", "http://localhost:3001")


async def store_review(review_data: dict) -> str | None:
    """Store review JSON to Filecoin. Returns CID or None on failure."""
    content = json.dumps({
        "type": "review",
        "version": "1.0",
        "data": review_data,
        "timestamp": time.time(),
    })
    return await _store(content, "review.json")


async def store_outcome(outcome_data: dict) -> str | None:
    """Store outcome signal to Filecoin. Returns CID or None on failure."""
    content = json.dumps({
        "type": "outcome",
        "version": "1.0",
        "data": outcome_data,
        "timestamp": time.time(),
    })
    return await _store(content, "outcome.json")


async def store_agent_log(log_entries: list) -> str | None:
    """Store agent_log.json entries to Filecoin. Returns CID or None on failure."""
    content = json.dumps({
        "type": "agent_log",
        "version": "1.0",
        "entries": log_entries,
        "timestamp": time.time(),
    })
    return await _store(content, "agent_log.json")


async def retrieve(cid: str) -> dict | None:
    """Retrieve content from Filecoin by CID. Returns parsed dict or None."""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(f"{FILECOIN_BRIDGE_URL}/retrieve/{cid}")
            if response.status_code == 200:
                data = response.json()
                content = data.get("content", data)
                if isinstance(content, str):
                    return json.loads(content)
                return content
    except Exception as e:
        print(f"[Filecoin] Retrieval failed: {e}")
    return None


async def health() -> dict:
    """Check bridge health. Returns status dict or error."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(f"{FILECOIN_BRIDGE_URL}/health")
            if response.status_code == 200:
                return response.json()
    except Exception as e:
        print(f"[Filecoin] Health check failed: {e}")
    return {"status": "unavailable", "network": "offline"}


# --- Legacy API (backward compat) ---

async def store_on_filecoin(data: dict) -> str | None:
    """Legacy: store raw dict to Filecoin. Returns CID or None."""
    return await _store(json.dumps(data), "data.json")


async def retrieve_from_filecoin(cid: str) -> dict | None:
    """Legacy: retrieve data by CID."""
    return await retrieve(cid)


# --- Internal ---

async def _store(content: str, filename: str) -> str | None:
    """Internal: POST content to bridge /store endpoint."""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{FILECOIN_BRIDGE_URL}/store",
                json={"content": content, "filename": filename},
            )
            if response.status_code == 200:
                return response.json().get("cid")
    except Exception as e:
        print(f"[Filecoin] Storage failed: {e}")
    return None
