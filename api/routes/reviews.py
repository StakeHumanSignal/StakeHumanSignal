"""Review routes — submit, list, and ranked access (x402-gated)."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from typing import Literal, Optional
import time
import uuid

router = APIRouter()

# In-memory store (replace with DB for production)
reviews_db: dict[str, dict] = {}

# Valid enums for structured claims
VALID_TASK_TYPES = {"code_review", "analysis", "creative", "data_extraction", "customer_support", "other"}
VALID_WINNERS = {"policy_a", "policy_b", "tie"}
VALID_CONFIDENCE_LEVELS = {"low", "medium", "high"}
RUBRIC_DIMENSIONS = {"correctness", "efficiency", "relevance", "completeness", "reasoning_quality"}


class ReviewSubmission(BaseModel):
    # Legacy fields (always required for backward compat)
    api_url: str
    review_text: str
    reviewer_address: str
    stake_amount: float
    stake_tx_hash: str
    job_id: Optional[int] = None

    # Task intent (required) — what the human was trying to accomplish
    task_intent: str

    # Structured claim fields (optional during transition)
    task_type: Optional[str] = None
    context_description: Optional[str] = None
    policy_a: Optional[dict] = None
    policy_b: Optional[dict] = None
    winner: Optional[str] = None
    rubric_scores: Optional[dict] = None
    confidence_level: Optional[dict] = None
    reviewer_segment: Optional[str] = None
    reasoning: Optional[str] = None
    downstream_outcome: Optional[str] = None

    @field_validator("task_intent")
    @classmethod
    def validate_task_intent(cls, v):
        if not v or not v.strip():
            raise ValueError("task_intent cannot be empty")
        if len(v) > 200:
            raise ValueError(f"task_intent must be at most 200 characters, got {len(v)}")
        return v

    @field_validator("task_type")
    @classmethod
    def validate_task_type(cls, v):
        if v is not None and v not in VALID_TASK_TYPES:
            raise ValueError(f"task_type must be one of {VALID_TASK_TYPES}, got '{v}'")
        return v

    @field_validator("winner")
    @classmethod
    def validate_winner(cls, v):
        if v is not None and v not in VALID_WINNERS:
            raise ValueError(f"winner must be one of {VALID_WINNERS}, got '{v}'")
        return v

    @field_validator("rubric_scores")
    @classmethod
    def validate_rubric_scores(cls, v):
        if v is None:
            return v
        for dim in RUBRIC_DIMENSIONS:
            if dim in v:
                val = v[dim]
                if not isinstance(val, (int, float)) or val < 0.0 or val > 1.0:
                    raise ValueError(f"rubric_scores.{dim} must be between 0.0 and 1.0, got {val}")
        return v

    @field_validator("confidence_level")
    @classmethod
    def validate_confidence_level(cls, v):
        if v is None:
            return v
        level = v.get("level")
        numeric = v.get("numeric")
        if level is not None and level not in VALID_CONFIDENCE_LEVELS:
            raise ValueError(f"confidence_level.level must be one of {VALID_CONFIDENCE_LEVELS}, got '{level}'")
        if numeric is not None and (not isinstance(numeric, (int, float)) or numeric < 0.0 or numeric > 1.0):
            raise ValueError(f"confidence_level.numeric must be between 0.0 and 1.0, got {numeric}")
        return v


class ReviewResponse(BaseModel):
    id: str
    api_url: str
    review_text: str
    reviewer_address: str
    stake_amount: float
    stake_tx_hash: str
    score: Optional[float] = None
    win_rate: Optional[float] = None
    filecoin_cid: Optional[str] = None
    created_at: float
    task_intent: Optional[str] = None
    # Structured claim fields
    task_type: Optional[str] = None
    rubric_scores: Optional[dict] = None
    confidence_level: Optional[dict] = None
    winner: Optional[str] = None


@router.post("", response_model=ReviewResponse)
async def submit_review(review: ReviewSubmission):
    """Submit a new review with stake proof."""
    review_id = str(uuid.uuid4())[:8]
    entry = {
        "id": review_id,
        "api_url": review.api_url,
        "review_text": review.review_text,
        "reviewer_address": review.reviewer_address,
        "stake_amount": review.stake_amount,
        "stake_tx_hash": review.stake_tx_hash,
        "job_id": review.job_id,
        "score": None,
        "win_rate": None,
        "filecoin_cid": None,
        "created_at": time.time(),
        "task_intent": review.task_intent,
        # Structured claim fields
        "task_type": review.task_type,
        "context_description": review.context_description,
        "policy_a": review.policy_a,
        "policy_b": review.policy_b,
        "winner": review.winner,
        "rubric_scores": review.rubric_scores,
        "confidence_level": review.confidence_level,
        "reviewer_segment": review.reviewer_segment,
        "reasoning": review.reasoning,
        "downstream_outcome": review.downstream_outcome,
    }
    # Store review on Filecoin for permanent evidence
    try:
        from api.services.filecoin import store_review
        cid = await store_review(entry)
        if cid:
            entry["filecoin_cid"] = cid
    except Exception:
        pass  # Filecoin storage is best-effort

    reviews_db[review_id] = entry
    return ReviewResponse(**entry)


@router.get("")
async def list_reviews():
    """Public review list (free)."""
    return {
        "reviews": list(reviews_db.values()),
        "count": len(reviews_db),
    }


@router.get("/top")
async def get_top_reviews():
    """Ranked reviews — x402-gated (0.001 USDC on Base).

    This endpoint is protected by x402 payment middleware on the Node.js proxy.
    Direct access returns ranked reviews sorted by stake * win_rate.
    """
    scored = [r for r in reviews_db.values() if r.get("score") is not None]
    scored.sort(key=lambda r: (r.get("score", 0) * r.get("stake_amount", 0)), reverse=True)

    if not scored:
        # Return all reviews sorted by stake if none scored yet
        all_reviews = sorted(reviews_db.values(), key=lambda r: r.get("stake_amount", 0), reverse=True)
        return {"reviews": all_reviews[:10], "count": len(all_reviews), "ranked": False}

    return {"reviews": scored[:10], "count": len(scored), "ranked": True}


@router.get("/{review_id}")
async def get_review(review_id: str):
    """Get a specific review by ID."""
    if review_id not in reviews_db:
        raise HTTPException(status_code=404, detail="Review not found")
    return reviews_db[review_id]
