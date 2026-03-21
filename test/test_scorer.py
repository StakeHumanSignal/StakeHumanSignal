"""Tests for retrieval score and payout score (Phase 13 fix)."""

import time
import pytest


class TestComputeRetrievalScore:
    """compute_retrieval_score: task_match primary, stake is tie-breaker."""

    def test_task_match_is_primary_signal(self):
        from api.services.scorer import compute_retrieval_score

        claim = {"task_intent": "compare trading strategies for BTC volatility", "created_at": time.time()}
        score = compute_retrieval_score(claim, "trading strategies BTC")
        assert score > 0.5

    def test_high_stake_wrong_task_loses_to_low_stake_right_task(self):
        from api.services.scorer import compute_retrieval_score

        rich_wrong = {
            "task_intent": "evaluate customer support tone",
            "stake_amount": 1000.0,
            "created_at": time.time(),
        }
        poor_right = {
            "task_intent": "compare trading strategies for BTC volatility",
            "stake_amount": 0.1,
            "created_at": time.time(),
        }
        query = "trading strategies BTC volatility"
        assert compute_retrieval_score(poor_right, query) > compute_retrieval_score(rich_wrong, query)

    def test_stake_alone_cannot_dominate(self):
        from api.services.scorer import compute_retrieval_score

        high_stake = {"task_intent": "unrelated topic", "stake_amount": 10000.0, "created_at": time.time()}
        low_stake = {"task_intent": "unrelated topic", "stake_amount": 0.01, "created_at": time.time()}
        query = "something else entirely"
        diff = compute_retrieval_score(high_stake, query) - compute_retrieval_score(low_stake, query)
        assert diff < 0.15  # stake contributes at most ~0.1

    def test_freshness_decay(self):
        from api.services.scorer import compute_retrieval_score

        fresh = {"task_intent": "test", "created_at": time.time()}
        old = {"task_intent": "test", "created_at": time.time() - 7 * 86400}
        assert compute_retrieval_score(fresh, "test") > compute_retrieval_score(old, "test")

    def test_filecoin_cid_boosts_evidence(self):
        from api.services.scorer import compute_retrieval_score

        with_cid = {"task_intent": "test", "filecoin_cid": "bafyabc", "created_at": time.time()}
        without_cid = {"task_intent": "test", "created_at": time.time()}
        assert compute_retrieval_score(with_cid, "test") > compute_retrieval_score(without_cid, "test")


class TestComputePayoutScore:
    """compute_payout_score: sqrt(stake) × settlement_result."""

    def test_win_positive(self):
        from api.services.scorer import compute_payout_score

        result = compute_payout_score(100.0, 1.0)
        assert result == 10.0  # sqrt(100) * 1.0

    def test_loss_mild_slash(self):
        from api.services.scorer import compute_payout_score

        result = compute_payout_score(100.0, -0.25)
        assert result == -2.5  # sqrt(100) * -0.25

    def test_zero_stake_returns_zero(self):
        from api.services.scorer import compute_payout_score

        assert compute_payout_score(0.0, 1.0) == 0.0
        assert compute_payout_score(0.0, -0.25) == 0.0

    def test_sqrt_prevents_stake_farming(self):
        from api.services.scorer import compute_payout_score

        small = compute_payout_score(1.0, 1.0)   # sqrt(1) = 1
        big = compute_payout_score(100.0, 1.0)    # sqrt(100) = 10
        # 100x more stake only gives 10x more payout
        assert big / small == 10.0
