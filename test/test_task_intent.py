"""Tests for task_intent field and heuristic scorer."""

import pytest
from pydantic import ValidationError


# --- task_intent field tests ---


class TestTaskIntent:
    """task_intent is required, max 200 chars, non-empty."""

    def test_task_intent_required(self):
        from api.routes.reviews import ReviewSubmission

        # task_intent is now required — omitting it should fail
        with pytest.raises(ValidationError, match="task_intent"):
            ReviewSubmission(
                api_url="https://api.openai.com",
                review_text="test",
                reviewer_address="0x557E1E07652B75ABaA667223B11704165fC94d09",
                stake_amount=10.0,
                stake_tx_hash="0xabc",
            )

    def test_task_intent_max_200_chars(self):
        from api.routes.reviews import ReviewSubmission

        with pytest.raises(ValidationError, match="task_intent"):
            ReviewSubmission(
                api_url="https://api.openai.com",
                review_text="test",
                reviewer_address="0x557E1E07652B75ABaA667223B11704165fC94d09",
                stake_amount=10.0,
                stake_tx_hash="0xabc",
                task_intent="x" * 201,
            )

    def test_task_intent_empty_rejected(self):
        from api.routes.reviews import ReviewSubmission

        with pytest.raises(ValidationError, match="task_intent"):
            ReviewSubmission(
                api_url="https://api.openai.com",
                review_text="test",
                reviewer_address="0x557E1E07652B75ABaA667223B11704165fC94d09",
                stake_amount=10.0,
                stake_tx_hash="0xabc",
                task_intent="",
            )

    def test_valid_claim_with_task_intent(self):
        from api.routes.reviews import ReviewSubmission

        review = ReviewSubmission(
            api_url="https://api.openai.com",
            review_text="Policy B found edge cases A missed",
            reviewer_address="0x557E1E07652B75ABaA667223B11704165fC94d09",
            stake_amount=10.0,
            stake_tx_hash="0xabc",
            task_intent="compare trading strategies for BTC/USD volatility",
            task_type="analysis",
            winner="policy_b",
        )
        assert review.task_intent == "compare trading strategies for BTC/USD volatility"
        assert len(review.task_intent) <= 200


# --- Heuristic scorer tests ---


class TestHeuristicScorer:
    """score_output() returns rubric scores without external API."""

    def test_returns_all_rubric_dimensions(self):
        from api.services.scorer_local import score_output

        claim = {"reasoning": "found edge cases in error handling"}
        result = score_output(claim, "The error handling covers edge cases well", "evaluate code review")
        assert "correctness" in result
        assert "efficiency" in result
        assert "relevance" in result
        assert "completeness" in result
        assert "reasoning_quality" in result
        assert "verdict" in result
        assert "confidence" in result

    def test_high_relevance_when_terms_match(self):
        from api.services.scorer_local import score_output

        claim = {"reasoning": "excellent error handling with retry logic"}
        output = "The code uses error handling and retry logic effectively"
        result = score_output(claim, output, "review error handling")
        assert result["relevance"] > 0.5

    def test_low_relevance_when_terms_mismatch(self):
        from api.services.scorer_local import score_output

        claim = {"reasoning": "excellent error handling with retry logic"}
        output = "The weather today is sunny and warm"
        result = score_output(claim, output, "review error handling")
        assert result["relevance"] < 0.5

    def test_validated_verdict_above_threshold(self):
        from api.services.scorer_local import score_output

        claim = {"reasoning": "good analysis of trading patterns and volatility metrics"}
        output = "The analysis covers trading patterns and volatility metrics comprehensively " * 20
        result = score_output(claim, output, "analyze trading")
        assert result["verdict"] == "validated"
        assert result["confidence"] > 0.6

    def test_rejected_verdict_below_threshold(self):
        from api.services.scorer_local import score_output

        claim = {"reasoning": "deep analysis of quantum computing algorithms"}
        output = "hi"
        result = score_output(claim, output, "analyze quantum computing")
        assert result["verdict"] == "rejected"
        assert result["confidence"] <= 0.6

    def test_empty_reasoning_uses_default(self):
        from api.services.scorer_local import score_output

        claim = {"reasoning": ""}
        result = score_output(claim, "some output text here", "general task")
        assert result["relevance"] == 0.5  # default when no reasoning terms

    def test_scores_bounded_zero_to_one(self):
        from api.services.scorer_local import score_output

        claim = {"reasoning": "test analysis of complex systems"}
        output = "test " * 1000  # very long output
        result = score_output(claim, output, "test task")
        for dim in ["correctness", "efficiency", "relevance", "completeness", "reasoning_quality"]:
            assert 0.0 <= result[dim] <= 1.0


# --- Downstream validation tests ---


class TestDownstreamValidation:
    """OutcomeSignal accepts source_claim_id and outcome_validated."""

    def test_outcome_accepts_source_claim_id(self):
        from api.routes.outcomes import OutcomeSignal

        outcome = OutcomeSignal(
            job_id=1,
            winner_address="0x557E1E07652B75ABaA667223B11704165fC94d09",
            review_id="abc123",
            score=85.0,
            reasoning="Best review",
            source_claim_id="review-xyz",
        )
        assert outcome.source_claim_id == "review-xyz"

    def test_outcome_accepts_outcome_validated(self):
        from api.routes.outcomes import OutcomeSignal

        outcome = OutcomeSignal(
            job_id=1,
            winner_address="0x557E1E07652B75ABaA667223B11704165fC94d09",
            review_id="abc123",
            score=85.0,
            reasoning="Best review",
            outcome_validated=True,
        )
        assert outcome.outcome_validated is True

    def test_missing_source_claim_id_allowed(self):
        from api.routes.outcomes import OutcomeSignal

        outcome = OutcomeSignal(
            job_id=1,
            winner_address="0x557E1E07652B75ABaA667223B11704165fC94d09",
            review_id="abc123",
            score=85.0,
            reasoning="Best review",
        )
        assert outcome.source_claim_id is None
        assert outcome.outcome_validated is None

    def test_update_claim_score_increments_wins(self):
        from api.services.scorer import update_claim_score
        from api.routes.reviews import reviews_db

        # Setup a claim in the store
        reviews_db["test-claim"] = {
            "id": "test-claim",
            "wins": 0,
            "losses": 0,
            "downstream_accuracy": 0.0,
            "score": 80,
        }

        update_claim_score("test-claim", outcome_validated=True, rubric_scores={})
        assert reviews_db["test-claim"]["wins"] == 1
        assert reviews_db["test-claim"]["downstream_accuracy"] == 1.0

        # Clean up
        del reviews_db["test-claim"]

    def test_update_claim_score_increments_losses(self):
        from api.services.scorer import update_claim_score
        from api.routes.reviews import reviews_db

        reviews_db["test-claim2"] = {
            "id": "test-claim2",
            "wins": 2,
            "losses": 0,
            "downstream_accuracy": 1.0,
            "score": 80,
        }

        update_claim_score("test-claim2", outcome_validated=False, rubric_scores={})
        assert reviews_db["test-claim2"]["losses"] == 1
        assert reviews_db["test-claim2"]["downstream_accuracy"] == pytest.approx(2.0 / 3.0, abs=0.01)

        del reviews_db["test-claim2"]
