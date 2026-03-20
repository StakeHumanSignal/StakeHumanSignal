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


class OutcomeResponse(BaseModel):
    job_id: int
    winner_address: str
    score: float
    complete_tx: Optional[str] = None
    receipt_token_id: Optional[int] = None
    filecoin_cid: Optional[str] = None


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
    from api.services.venice import score_review_privately
    from api.routes.reviews import reviews_db

    web3_svc = get_web3_service()

    # Update review score
    if outcome.review_id in reviews_db:
        reviews_db[outcome.review_id]["score"] = outcome.score

    # 1. Complete job on-chain (ERC-8183)
    complete_result = await web3_svc.complete_job(outcome.job_id)

    # 2. Mint ERC-8004 receipt
    receipt_result = await web3_svc.mint_receipt(
        job_id=outcome.job_id,
        winner=outcome.winner_address,
        api_url=reviews_db.get(outcome.review_id, {}).get("api_url", ""),
        outcome=f"score:{outcome.score},reason:{outcome.reasoning}",
    )

    return OutcomeResponse(
        job_id=outcome.job_id,
        winner_address=outcome.winner_address,
        score=outcome.score,
        complete_tx=complete_result.get("tx_hash"),
        receipt_token_id=receipt_result.get("token_id"),
        filecoin_cid=receipt_result.get("filecoin_cid"),
    )
