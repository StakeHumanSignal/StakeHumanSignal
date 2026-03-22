"""Review scorer — ranks reviews by retrieval score and payout score.

Retrieval score: task_match primary, stake is tie-breaker only.
Payout score: sqrt(stake) × settlement_result (prevents stake farming).
"""

import math
import os
import time

# Rubric dimension weights (must sum to 1.0)
RUBRIC_WEIGHTS = {
    "correctness": 0.30,
    "relevance": 0.25,
    "completeness": 0.20,
    "efficiency": 0.15,
    "reasoning_quality": 0.10,
}

ZERO_ADDRESS = "0x" + "0" * 40


def compute_weighted_rubric_score(rubric_scores: dict) -> float:
    """Compute weighted average of rubric dimension scores.

    Each dimension is 0.0-1.0. Returns weighted average 0.0-1.0.
    Missing dimensions are treated as 0.0.
    """
    total = 0.0
    for dim, weight in RUBRIC_WEIGHTS.items():
        total += rubric_scores.get(dim, 0.0) * weight
    return total


def compute_retrieval_score(claim: dict, query_task_intent: str = "") -> float:
    """Rank claims for buyer agents. task_match is primary, stake is tie-breaker."""
    stop = {"the", "a", "an", "is", "to", "and", "or", "of", "in", "for", "on", "at", "by", "with"}

    # Task match
    if query_task_intent:
        claim_terms = set(claim.get("task_intent", "").lower().split()) - stop
        query_terms = set(query_task_intent.lower().split()) - stop
        if claim_terms and query_terms:
            task_match = len(claim_terms & query_terms) / len(claim_terms | query_terms)
        else:
            task_match = 0.5
    else:
        task_match = 0.5

    # Freshness: decay over 7 days
    age_days = (time.time() - claim.get("created_at", time.time())) / 86400
    freshness = max(0.1, 1.0 - (age_days / 7))

    # Observed success from downstream validation
    wins = claim.get("downstream_wins", 0)
    losses = claim.get("downstream_losses", 0)
    total = wins + losses
    observed_success = (wins / total) if total > 0 else 0.5

    # Evidence quality
    evidence_quality = 1.0 if claim.get("filecoin_cid") else 0.5

    # Stake as minor tie-breaker (log scale, capped at 0.1)
    stake = float(claim.get("stake_amount", 0))
    stake_signal = min(math.log1p(stake) / 10, 0.1)

    score = (
        task_match * 0.40
        + observed_success * 0.30
        + freshness * 0.20
        + evidence_quality * 0.10
    ) + stake_signal

    return round(min(score, 1.0), 4)


def compute_payout_score(stake: float, settlement_result: float) -> float:
    """Payout score for yield distribution. sqrt(stake) prevents stake farming."""
    return round(math.sqrt(max(stake, 0)) * settlement_result, 4)


def rank_reviews(reviews: list[dict]) -> list[dict]:
    """Rank reviews by composite score.

    If rubric_scores are available, uses weighted rubric average.
    Otherwise falls back to flat score / 100.
    Composite = stake_weight * score_factor * win_rate.
    """
    scored = []
    unscored = []

    for r in reviews:
        if r.get("score") is not None:
            stake = r.get("stake_amount", 0)
            win_rate = r.get("win_rate", 0.5)

            # Prefer rubric scores if available
            rubric = r.get("rubric_scores")
            if rubric:
                score_factor = compute_weighted_rubric_score(rubric)
            else:
                score_factor = r.get("score", 0) / 100

            r["composite_score"] = stake * score_factor * win_rate
            scored.append(r)
        else:
            unscored.append(r)

    scored.sort(key=lambda r: r["composite_score"], reverse=True)
    unscored.sort(key=lambda r: r.get("stake_amount", 0), reverse=True)

    return scored + unscored


def update_claim_score(source_claim_id: str, outcome_validated: bool, rubric_scores: dict) -> None:
    """Update claim win/loss record based on downstream outcome.

    If outcome_validated=True: increment wins, recalculate accuracy.
    If outcome_validated=False: increment losses, recalculate accuracy.
    downstream_accuracy = wins / (wins + losses)
    """
    from api.routes.reviews import reviews_db

    claim = reviews_db.get(source_claim_id)
    if not claim:
        return

    # Ensure counters exist
    claim.setdefault("wins", 0)
    claim.setdefault("losses", 0)

    if outcome_validated:
        claim["wins"] += 1
    else:
        claim["losses"] += 1

    total = claim["wins"] + claim["losses"]
    claim["downstream_accuracy"] = claim["wins"] / total if total > 0 else 0.0


def compute_two_layer_payout(available_yield: float, candidates: list[dict]) -> list[dict]:
    """Two-layer yield distribution: passive selections + active stakes.

    Each candidate has: review_id, stake_amount, passive_selection_count, active_stake_amount.
    Yield distributed proportionally by: passive_weight + active_weight.
    """
    PASSIVE_MULT = float(os.getenv("PASSIVE_MULTIPLIER", "0.3"))
    ACTIVE_MULT = float(os.getenv("ACTIVE_MULTIPLIER", "0.7"))

    for c in candidates:
        passive_w = c.get("passive_selection_count", 0) * PASSIVE_MULT
        active_w = math.sqrt(c.get("active_stake_amount", 0)) * ACTIVE_MULT
        c["yield_score"] = passive_w + active_w

    total_score = sum(c["yield_score"] for c in candidates)

    for c in candidates:
        if total_score > 0:
            c["payout_amount"] = round(available_yield * (c["yield_score"] / total_score), 6)
        else:
            c["payout_amount"] = 0.0

    return sorted(candidates, key=lambda x: x["payout_amount"], reverse=True)


def get_independence_score(reviewer_address: str, agent_owner_address: str) -> float:
    """Score how independent a reviewer is from the agent owner.

    Returns:
        0.0 — same wallet, zero address, or on-chain relationship detected
        1.0 — completely unrelated wallets

    Phase 2: checks on-chain ReceiptRegistry ownership mapping.
    Falls back to wallet comparison if contract unavailable.
    """
    if not reviewer_address or not agent_owner_address:
        return 0.0

    reviewer_lower = reviewer_address.lower()
    owner_lower = agent_owner_address.lower()

    # Zero address is not independent
    if reviewer_lower == ZERO_ADDRESS or owner_lower == ZERO_ADDRESS:
        return 0.0

    # Same wallet = not independent
    if reviewer_lower == owner_lower:
        return 0.0

    # Try on-chain independence check via ReceiptRegistry
    try:
        from api.services.web3_client import get_web3_service
        web3_svc = get_web3_service()
        if web3_svc and web3_svc.receipt_registry:
            on_chain_score = web3_svc.receipt_registry.functions.getIndependenceScore(
                reviewer_address,
                agent_owner_address,
            ).call()
            return on_chain_score / 100.0
    except Exception:
        pass  # Fall back to off-chain check

    return 1.0
