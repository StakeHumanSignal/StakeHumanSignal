"""Session routes — blind A/B compare for Human B validation."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import time
import uuid
import hashlib
import math

router = APIRouter(prefix="/sessions", tags=["sessions"])

sessions_db: dict = {}


class OpenSessionRequest(BaseModel):
    claim_id: str
    reviewer_address: str
    reward_usdc: float
    prompt: str
    buyer_address: str


class RecordOutputsRequest(BaseModel):
    output_a: str
    output_b: str
    model_a: str
    model_b: str
    shuffled: bool = False


class SettleRequest(BaseModel):
    human_picked: str  # "A" or "B"


@router.post("/open")
async def open_session(req: OpenSessionRequest):
    session_id = str(uuid.uuid4())[:8].upper()
    prompt_hash = hashlib.sha256(req.prompt.encode()).hexdigest()

    sessions_db[session_id] = {
        "id": session_id,
        "claim_id": req.claim_id,
        "reviewer_address": req.reviewer_address,
        "buyer_address": req.buyer_address,
        "reward_usdc": req.reward_usdc,
        "prompt": req.prompt,
        "prompt_hash": prompt_hash,
        "status": "open",
        "output_a": None,
        "output_b": None,
        "model_a": None,
        "model_b": None,
        "shuffled": False,
        "winner": None,
        "created_at": time.time(),
    }
    return {"session_id": session_id, "status": "open"}


@router.post("/{session_id}/outputs")
async def record_outputs(session_id: str, req: RecordOutputsRequest):
    if session_id not in sessions_db:
        raise HTTPException(404, "Session not found")
    s = sessions_db[session_id]
    if s["status"] != "open":
        raise HTTPException(400, "Session not open")
    s["output_a"] = req.output_a
    s["output_b"] = req.output_b
    s["model_a"] = req.model_a
    s["model_b"] = req.model_b
    s["shuffled"] = req.shuffled
    s["status"] = "generated"
    s["output_hash_a"] = hashlib.sha256(req.output_a.encode()).hexdigest()
    s["output_hash_b"] = hashlib.sha256(req.output_b.encode()).hexdigest()
    return {"status": "generated", "session_id": session_id}


@router.post("/{session_id}/settle")
async def settle_session(session_id: str, req: SettleRequest):
    if session_id not in sessions_db:
        raise HTTPException(404, "Session not found")
    s = sessions_db[session_id]
    if s["status"] != "generated":
        raise HTTPException(400, "Not ready to settle")

    s["winner"] = req.human_picked
    s["status"] = "settled"

    recommended_won = (req.human_picked == "A" and not s["shuffled"]) or (
        req.human_picked == "B" and s["shuffled"]
    )

    stake = s["reward_usdc"]
    settlement = math.sqrt(stake) * (1.0 if recommended_won else -0.25)

    return {
        "status": "settled",
        "recommended_won": recommended_won,
        "payout": round(settlement, 4),
        "reviewer": s["reviewer_address"],
    }


@router.get("/{session_id}")
async def get_session(session_id: str):
    if session_id not in sessions_db:
        raise HTTPException(404, "Session not found")
    s = sessions_db[session_id].copy()
    # For blind compare: hide model info, shuffle if needed
    if s["status"] == "generated":
        if s["shuffled"]:
            s["output_a"], s["output_b"] = s["output_b"], s["output_a"]
        s.pop("model_a", None)
        s.pop("model_b", None)
        s.pop("shuffled", None)
    return s


@router.get("")
async def list_sessions():
    return {"sessions": list(sessions_db.values()), "count": len(sessions_db)}
