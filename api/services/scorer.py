"""Review scorer — ranks reviews by weighted rubric scores and stake."""

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
