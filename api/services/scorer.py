"""Review scorer — ranks reviews by stake * win_rate * Venice score."""


def rank_reviews(reviews: list[dict]) -> list[dict]:
    """Rank reviews by composite score: stake_weight * venice_score * win_rate.

    Reviews without scores get a default ranking by stake amount.
    """
    scored = []
    unscored = []

    for r in reviews:
        if r.get("score") is not None:
            stake = r.get("stake_amount", 0)
            score = r.get("score", 0)
            win_rate = r.get("win_rate", 0.5)
            r["composite_score"] = stake * (score / 100) * win_rate
            scored.append(r)
        else:
            unscored.append(r)

    scored.sort(key=lambda r: r["composite_score"], reverse=True)
    unscored.sort(key=lambda r: r.get("stake_amount", 0), reverse=True)

    return scored + unscored
