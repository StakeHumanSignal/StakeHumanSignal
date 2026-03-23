"""OpenServ routes — real integration with OpenServ AI agent platform.

Exposes agent metadata, health checks, and triggers the coordinator
webhook to run a full staked-review evaluation pipeline on OpenServ.
"""

import os
import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

import httpx

router = APIRouter(prefix="/openserv", tags=["openserv"])

# ---------------------------------------------------------------------------
# Agent registry — mirrors the live OpenServ workspace configuration
# ---------------------------------------------------------------------------
OPENSERV_API_KEY = os.getenv("OPENSERV_API_KEY", "")

AGENTS = {
    "scorer": {
        "id": 4045,
        "name": "StakeHumanSignal Scorer",
        "workspace_id": 13064,
        "webhook": "https://api.openserv.ai/webhooks/trigger/d809ae3b4e1f4e85a933e66763f3313d",
        "capabilities": [
            "score_review",
            "score_batch",
        ],
    },
    "coordinator": {
        "id": 4046,
        "name": "StakeHumanSignal Buyer Coordinator",
        "workspace_id": 13065,
        "x402_endpoint": "https://api.openserv.ai/webhooks/x402/trigger/2dbe17c9cf984a748dabed434f8d72aa",
        "paywall_url": "https://platform.openserv.ai/workspace/paywall/2dbe17c9cf984a748dabed434f8d72aa",
        "webhook": "https://api.openserv.ai/webhooks/x402/trigger/2dbe17c9cf984a748dabed434f8d72aa",
        "capabilities": [
            "fetch_reviews",
            "signal_outcome",
            "evaluate_pipeline",
        ],
    },
}

OPENSERV_TIMEOUT = 15.0  # seconds


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------
class EvaluateRequest(BaseModel):
    job_id: str
    reviews: list[dict]
    stake_data: Optional[dict] = None


# ---------------------------------------------------------------------------
# GET /openserv/agents — agent metadata
# ---------------------------------------------------------------------------
@router.get("/agents")
async def list_agents():
    """Return OpenServ agent metadata (IDs, names, capabilities, webhooks)."""
    return {
        "platform": "OpenServ",
        "agents": AGENTS,
        "api_key_configured": bool(OPENSERV_API_KEY),
    }


# ---------------------------------------------------------------------------
# GET /openserv/status — ping each webhook to check reachability
# ---------------------------------------------------------------------------
@router.get("/status")
async def agent_status():
    """Ping each OpenServ agent webhook and report reachability."""
    results = {}
    async with httpx.AsyncClient(timeout=OPENSERV_TIMEOUT) as client:
        for role, agent in AGENTS.items():
            try:
                start = time.time()
                resp = await client.get(agent["webhook"])
                latency_ms = round((time.time() - start) * 1000)
                results[role] = {
                    "agent_id": agent["id"],
                    "workspace_id": agent["workspace_id"],
                    "reachable": resp.status_code < 500,
                    "status_code": resp.status_code,
                    "latency_ms": latency_ms,
                }
            except httpx.RequestError as exc:
                results[role] = {
                    "agent_id": agent["id"],
                    "workspace_id": agent["workspace_id"],
                    "reachable": False,
                    "error": str(exc),
                }

    all_up = all(r.get("reachable") for r in results.values())
    return {
        "overall": "healthy" if all_up else "degraded",
        "agents": results,
    }


# ---------------------------------------------------------------------------
# POST /openserv/evaluate — trigger coordinator pipeline via webhook
# ---------------------------------------------------------------------------
@router.post("/evaluate")
async def trigger_evaluation(payload: EvaluateRequest):
    """Fire the coordinator webhook to run a full evaluation pipeline.

    Sends review + stake data to the OpenServ coordinator agent, which
    orchestrates scoring, aggregation, winner selection, and payout.
    """
    coordinator = AGENTS["coordinator"]
    webhook_url = coordinator["webhook"]

    body = {
        "job_id": payload.job_id,
        "reviews": payload.reviews,
        "stake_data": payload.stake_data or {},
        "source": "StakeHumanSignal-API",
    }

    headers = {"Content-Type": "application/json"}
    if OPENSERV_API_KEY:
        headers["Authorization"] = f"Bearer {OPENSERV_API_KEY}"

    async with httpx.AsyncClient(timeout=OPENSERV_TIMEOUT) as client:
        try:
            resp = await client.post(webhook_url, json=body, headers=headers)
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"OpenServ coordinator unreachable: {exc}",
            )

    if resp.status_code >= 500:
        raise HTTPException(
            status_code=502,
            detail=f"OpenServ coordinator error: {resp.status_code}",
        )

    # Return whatever OpenServ sends back (execution ID, status, etc.)
    try:
        result = resp.json()
    except Exception:
        result = {"raw": resp.text}

    return {
        "status": "triggered",
        "coordinator_agent_id": coordinator["id"],
        "workspace_id": coordinator["workspace_id"],
        "webhook_response_code": resp.status_code,
        "result": result,
    }
