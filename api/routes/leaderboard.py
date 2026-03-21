"""Leaderboard routes — aggregate reviewer reputation."""

from fastapi import APIRouter
from collections import defaultdict
from api.routes.reviews import reviews_db

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("")
async def get_leaderboard():
    """Return top reviewers ranked by composite score."""
    stats = defaultdict(lambda: {"wins": 0, "jobs": 0, "total_stake": 0.0})

    for review in reviews_db.values():
        addr = review.get("reviewer_address")
        if not addr:
            continue
        stats[addr]["jobs"] += 1
        stats[addr]["total_stake"] += review.get("stake_amount", 0)
        if review.get("score") is not None and review.get("score", 0) > 60:
            stats[addr]["wins"] += 1

    leaderboard = []
    for addr, s in stats.items():
        win_rate = s["wins"] / s["jobs"] if s["jobs"] > 0 else 0
        leaderboard.append({
            "reviewer_address": addr,
            "wins": s["wins"],
            "total_jobs": s["jobs"],
            "win_rate": round(win_rate, 3),
            "score": round(win_rate * 100, 1),
            "total_stake": round(s["total_stake"], 2),
        })

    return sorted(leaderboard, key=lambda x: x["score"], reverse=True)[:20]
