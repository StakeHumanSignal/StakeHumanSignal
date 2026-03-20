"""Review routes — submit, list, and ranked access (x402-gated)."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import time
import uuid

router = APIRouter()

# In-memory store (replace with DB for production)
reviews_db: dict[str, dict] = {}


class ReviewSubmission(BaseModel):
    api_url: str
    review_text: str
    reviewer_address: str
    stake_amount: float
    stake_tx_hash: str
    job_id: Optional[int] = None


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
    }
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
