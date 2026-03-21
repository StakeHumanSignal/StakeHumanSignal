"""Tests for structured claim schema in ReviewSubmission and OutcomeSignal."""

import pytest
from pydantic import ValidationError


# --- ReviewSubmission Tests ---


class TestReviewSubmissionBackwardCompat:
    """Old flat schema still accepted."""

    def test_old_flat_schema_accepted(self):
        from api.routes.reviews import ReviewSubmission

        review = ReviewSubmission(
            api_url="https://api.openai.com/v1/chat/completions",
            review_text="Great API, fast responses",
            reviewer_address="0x557E1E07652B75ABaA667223B11704165fC94d09",
            stake_amount=10.0,
            stake_tx_hash="0xabc123",
        )
        assert review.api_url == "https://api.openai.com/v1/chat/completions"
        assert review.review_text == "Great API, fast responses"
        assert review.task_type is None  # new field defaults to None
        assert review.rubric_scores is None
        assert review.confidence_level is None

    def test_old_schema_with_job_id(self):
        from api.routes.reviews import ReviewSubmission

        review = ReviewSubmission(
            api_url="https://api.openai.com",
            review_text="Good",
            reviewer_address="0x557E1E07652B75ABaA667223B11704165fC94d09",
            stake_amount=5.0,
            stake_tx_hash="0xdef456",
            job_id=42,
        )
        assert review.job_id == 42


class TestReviewSubmissionStructuredClaim:
    """New structured claim fields."""

    def test_full_structured_claim(self):
        from api.routes.reviews import ReviewSubmission

        review = ReviewSubmission(
            api_url="https://api.openai.com",
            review_text="Policy B caught edge cases A missed",
            reviewer_address="0x557E1E07652B75ABaA667223B11704165fC94d09",
            stake_amount=10.0,
            stake_tx_hash="0xabc123",
            task_type="code_review",
            context_description="Review a CSV parser function",
            policy_a={"model": "gpt-4o", "system_prompt_hash": "abc123", "tool_config": "none"},
            policy_b={"model": "claude-sonnet-4-6", "system_prompt_hash": "def456", "tool_config": "none"},
            winner="policy_b",
            rubric_scores={
                "correctness": 0.9,
                "efficiency": 0.85,
                "relevance": 0.95,
                "completeness": 0.8,
                "reasoning_quality": 0.88,
            },
            confidence_level={"level": "high", "numeric": 0.92},
            reviewer_segment="backend_engineering",
            reasoning="B found the off-by-one error A missed",
            downstream_outcome="Deployed B's solution to production",
        )
        assert review.task_type == "code_review"
        assert review.winner == "policy_b"
        assert review.rubric_scores["correctness"] == 0.9
        assert review.confidence_level["level"] == "high"
        assert review.confidence_level["numeric"] == 0.92

    def test_invalid_task_type_rejected(self):
        from api.routes.reviews import ReviewSubmission

        with pytest.raises(ValidationError, match="task_type"):
            ReviewSubmission(
                api_url="https://api.openai.com",
                review_text="test",
                reviewer_address="0x557E1E07652B75ABaA667223B11704165fC94d09",
                stake_amount=10.0,
                stake_tx_hash="0xabc",
                task_type="invalid_type",
            )

    def test_invalid_winner_rejected(self):
        from api.routes.reviews import ReviewSubmission

        with pytest.raises(ValidationError, match="winner"):
            ReviewSubmission(
                api_url="https://api.openai.com",
                review_text="test",
                reviewer_address="0x557E1E07652B75ABaA667223B11704165fC94d09",
                stake_amount=10.0,
                stake_tx_hash="0xabc",
                winner="policy_c",
            )

    def test_rubric_score_below_zero_rejected(self):
        from api.routes.reviews import ReviewSubmission

        with pytest.raises(ValidationError, match="rubric_scores"):
            ReviewSubmission(
                api_url="https://api.openai.com",
                review_text="test",
                reviewer_address="0x557E1E07652B75ABaA667223B11704165fC94d09",
                stake_amount=10.0,
                stake_tx_hash="0xabc",
                rubric_scores={
                    "correctness": -0.1,
                    "efficiency": 0.5,
                    "relevance": 0.5,
                    "completeness": 0.5,
                    "reasoning_quality": 0.5,
                },
            )

    def test_rubric_score_above_one_rejected(self):
        from api.routes.reviews import ReviewSubmission

        with pytest.raises(ValidationError, match="rubric_scores"):
            ReviewSubmission(
                api_url="https://api.openai.com",
                review_text="test",
                reviewer_address="0x557E1E07652B75ABaA667223B11704165fC94d09",
                stake_amount=10.0,
                stake_tx_hash="0xabc",
                rubric_scores={
                    "correctness": 1.5,
                    "efficiency": 0.5,
                    "relevance": 0.5,
                    "completeness": 0.5,
                    "reasoning_quality": 0.5,
                },
            )

    def test_confidence_numeric_validated(self):
        from api.routes.reviews import ReviewSubmission

        with pytest.raises(ValidationError, match="confidence_level"):
            ReviewSubmission(
                api_url="https://api.openai.com",
                review_text="test",
                reviewer_address="0x557E1E07652B75ABaA667223B11704165fC94d09",
                stake_amount=10.0,
                stake_tx_hash="0xabc",
                confidence_level={"level": "high", "numeric": 1.5},
            )

    def test_confidence_level_enum_validated(self):
        from api.routes.reviews import ReviewSubmission

        with pytest.raises(ValidationError, match="confidence_level"):
            ReviewSubmission(
                api_url="https://api.openai.com",
                review_text="test",
                reviewer_address="0x557E1E07652B75ABaA667223B11704165fC94d09",
                stake_amount=10.0,
                stake_tx_hash="0xabc",
                confidence_level={"level": "very_high", "numeric": 0.9},
            )


# --- OutcomeSignal Tests ---


class TestOutcomeSignalBackwardCompat:
    """Old flat OutcomeSignal still works."""

    def test_old_outcome_accepted(self):
        from api.routes.outcomes import OutcomeSignal

        outcome = OutcomeSignal(
            job_id=1,
            winner_address="0x557E1E07652B75ABaA667223B11704165fC94d09",
            review_id="abc123",
            score=85.0,
            reasoning="Best review",
        )
        assert outcome.score == 85.0
        assert outcome.rubric_scores is None
        assert outcome.confidence_level is None

    def test_outcome_with_rubric_scores(self):
        from api.routes.outcomes import OutcomeSignal

        outcome = OutcomeSignal(
            job_id=1,
            winner_address="0x557E1E07652B75ABaA667223B11704165fC94d09",
            review_id="abc123",
            score=85.0,
            reasoning="Best review",
            rubric_scores={
                "correctness": 0.9,
                "efficiency": 0.8,
                "relevance": 0.85,
                "completeness": 0.9,
                "reasoning_quality": 0.75,
            },
            confidence_level=0.88,
            downstream_outcome="Deployed to production",
        )
        assert outcome.rubric_scores["correctness"] == 0.9
        assert outcome.confidence_level == 0.88
        assert outcome.downstream_outcome == "Deployed to production"


# --- Scorer Tests ---


class TestWeightedRubricScoring:
    """scorer.py uses weighted rubric average."""

    def test_weighted_rubric_average(self):
        from api.services.scorer import compute_weighted_rubric_score

        scores = {
            "correctness": 1.0,
            "efficiency": 1.0,
            "relevance": 1.0,
            "completeness": 1.0,
            "reasoning_quality": 1.0,
        }
        result = compute_weighted_rubric_score(scores)
        assert abs(result - 1.0) < 0.001

    def test_weighted_rubric_zeros(self):
        from api.services.scorer import compute_weighted_rubric_score

        scores = {
            "correctness": 0.0,
            "efficiency": 0.0,
            "relevance": 0.0,
            "completeness": 0.0,
            "reasoning_quality": 0.0,
        }
        result = compute_weighted_rubric_score(scores)
        assert result == 0.0

    def test_weighted_rubric_partial(self):
        from api.services.scorer import compute_weighted_rubric_score

        scores = {
            "correctness": 0.9,
            "efficiency": 0.85,
            "relevance": 0.95,
            "completeness": 0.8,
            "reasoning_quality": 0.88,
        }
        # 0.9*0.30 + 0.85*0.15 + 0.95*0.25 + 0.8*0.20 + 0.88*0.10
        # = 0.270 + 0.1275 + 0.2375 + 0.160 + 0.088 = 0.883
        result = compute_weighted_rubric_score(scores)
        assert abs(result - 0.883) < 0.001

    def test_rank_reviews_uses_rubric_when_available(self):
        from api.services.scorer import rank_reviews

        reviews = [
            {
                "stake_amount": 10.0,
                "score": 85,
                "win_rate": 0.5,
                "rubric_scores": {
                    "correctness": 0.95,
                    "efficiency": 0.95,
                    "relevance": 0.95,
                    "completeness": 0.95,
                    "reasoning_quality": 0.95,
                },
            },
            {
                "stake_amount": 10.0,
                "score": 90,
                "win_rate": 0.5,
                "rubric_scores": None,
            },
        ]
        ranked = rank_reviews(reviews)
        # Rubric review (0.95 * 10 * 0.5 = 4.75) > flat review (0.9 * 10 * 0.5 = 4.5)
        assert ranked[0].get("rubric_scores") is not None

    def test_rank_reviews_fallback_to_flat_score(self):
        from api.services.scorer import rank_reviews

        reviews = [
            {"stake_amount": 10.0, "score": 90, "win_rate": 0.5},
            {"stake_amount": 5.0, "score": 80, "win_rate": 0.5},
        ]
        ranked = rank_reviews(reviews)
        assert ranked[0]["score"] == 90


# --- Independence Score Tests ---


class TestIndependenceScore:
    """get_independence_score() wallet comparison logic."""

    def test_same_wallet_returns_zero(self):
        from api.services.scorer import get_independence_score

        score = get_independence_score(
            "0x557E1E07652B75ABaA667223B11704165fC94d09",
            "0x557E1E07652B75ABaA667223B11704165fC94d09",
        )
        assert score == 0.0

    def test_same_wallet_case_insensitive(self):
        from api.services.scorer import get_independence_score

        score = get_independence_score(
            "0x557e1e07652b75abaa667223b11704165fc94d09",
            "0x557E1E07652B75ABaA667223B11704165fC94d09",
        )
        assert score == 0.0

    def test_different_wallets_returns_one(self):
        from api.services.scorer import get_independence_score

        score = get_independence_score(
            "0x557E1E07652B75ABaA667223B11704165fC94d09",
            "0xABCDEF1234567890ABCDEF1234567890ABCDEF12",
        )
        assert score == 1.0

    def test_zero_address_returns_zero(self):
        from api.services.scorer import get_independence_score

        score = get_independence_score(
            "0x0000000000000000000000000000000000000000",
            "0x557E1E07652B75ABaA667223B11704165fC94d09",
        )
        assert score == 0.0
