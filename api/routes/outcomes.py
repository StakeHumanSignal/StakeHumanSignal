"""Outcome routes — agent signals winner, triggers yield + receipt."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class OutcomeSignal(BaseModel):
    job_id: int
    winner_address: str
    review_id: str
    score: float
    reasoning: str
    # Structured claim fields (optional during transition)
    rubric_scores: Optional[dict] = None
    confidence_level: Optional[float] = None
    downstream_outcome: Optional[str] = None
    # Downstream validation loop
    source_claim_id: Optional[str] = None
    outcome_validated: Optional[bool] = None


class OutcomeResponse(BaseModel):
    job_id: int
    winner_address: str
    score: float
    complete_tx: Optional[str] = None
    receipt_token_id: Optional[int] = None
    filecoin_cid: Optional[str] = None
    rubric_weighted_score: Optional[float] = None


@router.post("", response_model=OutcomeResponse)
async def signal_outcome(outcome: OutcomeSignal):
    """Agent signals the winning reviewer.

    Triggers:
    1. ERC-8183 job completion on-chain
    2. Lido wstETH yield distribution
    3. ERC-8004 receipt minting
    4. Filecoin FOC permanent storage
    """
    from api.services.web3_client import get_web3_service
    from api.routes.reviews import reviews_db, _save_reviews
    from api.services.scorer import compute_weighted_rubric_score, update_claim_score

    web3_svc = get_web3_service()

    # Compute weighted rubric score if available
    rubric_weighted = None
    if outcome.rubric_scores:
        rubric_weighted = compute_weighted_rubric_score(outcome.rubric_scores)

    # Update review score and rubric data (persist to disk so scores survive restarts)
    if outcome.review_id in reviews_db:
        reviews_db[outcome.review_id]["score"] = outcome.score
        if outcome.rubric_scores:
            reviews_db[outcome.review_id]["rubric_scores"] = outcome.rubric_scores
        _save_reviews()

    # 1. Complete job on-chain (ERC-8183)
    complete_result = await web3_svc.complete_job(outcome.job_id)

    # 2. Build outcome string for ERC-8004 receipt
    if rubric_weighted is not None:
        confidence = outcome.confidence_level if outcome.confidence_level else 0.0
        outcome_str = f"rubric_avg:{rubric_weighted:.3f},confidence:{confidence:.2f},winner:{outcome.winner_address[:10]}"
    else:
        outcome_str = f"score:{outcome.score},reason:{outcome.reasoning}"

    # 3. Mint ERC-8004 receipt
    receipt_result = await web3_svc.mint_receipt(
        job_id=outcome.job_id,
        winner=outcome.winner_address,
        api_url=reviews_db.get(outcome.review_id, {}).get("api_url", ""),
        outcome=outcome_str,
    )

    # 4. Distribute Lido yield to winner (best-effort)
    try:
        yield_result = await web3_svc.distribute_yield(
            winner=outcome.winner_address,
            amount=0  # distribute available yield
        )
        if yield_result:
            print(f"[Yield] Distributed to {outcome.winner_address}: {yield_result}")
    except Exception as e:
        print(f"[Yield] Distribution skipped: {e}")

    # Downstream validation: update source claim if referenced
    if outcome.source_claim_id and outcome.outcome_validated is not None:
        update_claim_score(
            outcome.source_claim_id,
            outcome.outcome_validated,
            outcome.rubric_scores or {},
        )

    return OutcomeResponse(
        job_id=outcome.job_id,
        winner_address=outcome.winner_address,
        score=outcome.score,
        complete_tx=complete_result.get("tx_hash"),
        receipt_token_id=receipt_result.get("token_id"),
        filecoin_cid=receipt_result.get("filecoin_cid"),
        rubric_weighted_score=rubric_weighted,
    )
