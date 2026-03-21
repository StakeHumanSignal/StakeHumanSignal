"""Integration tests for the full StakeHumanSignal stack."""
import pytest
import json
from pathlib import Path

RAILWAY_URL = "https://stakesignal-api-production.up.railway.app"


class TestScorerIntegration:
    """Scorer correctly validates reviews with rubric scores."""

    def test_scorer_validates_good_review(self):
        from api.services.scorer_local import score_output
        claim = {
            'reasoning': 'Policy A produced better error handling',
            'rubric_scores': {
                'correctness': 0.88, 'efficiency': 0.75,
                'relevance': 0.92, 'completeness': 0.85,
                'reasoning_quality': 0.90
            }
        }
        result = score_output(claim, 'test output', 'test')
        assert result['verdict'] == 'validated', f"Good review rejected: {result}"
        assert result['confidence'] > 0.6

    def test_scorer_rejects_bad_review(self):
        from api.services.scorer_local import score_output
        claim = {
            'reasoning': 'Policy A was slightly better',
            'rubric_scores': {
                'correctness': 0.3, 'efficiency': 0.2,
                'relevance': 0.4, 'completeness': 0.1,
                'reasoning_quality': 0.2
            }
        }
        result = score_output(claim, 'test', 'test')
        assert result['verdict'] == 'rejected'

    def test_scorer_fallback_without_rubric(self):
        from api.services.scorer_local import score_output
        claim = {'reasoning': 'good error handling with retry logic'}
        result = score_output(claim, 'error handling retry logic works well here', 'test')
        assert 'verdict' in result
        assert 'confidence' in result

    def test_retrieval_score_task_match(self):
        from api.services.scorer import compute_retrieval_score
        import time
        right = {'task_intent': 'Python error handling', 'stake_amount': 0.1, 'created_at': time.time()}
        wrong = {'task_intent': 'image generation', 'stake_amount': 100.0, 'created_at': time.time()}
        assert compute_retrieval_score(right, 'Python error') > compute_retrieval_score(wrong, 'Python error')

    def test_payout_score(self):
        from api.services.scorer import compute_payout_score
        assert compute_payout_score(4.0, 1.0) == 2.0
        assert compute_payout_score(0.0, 1.0) == 0.0


class TestContractDeployments:
    """Contract addresses are valid in deployment files."""

    def test_sepolia_json_exists(self):
        p = Path('deployments/sepolia.json')
        assert p.exists()

    def test_sepolia_has_three_contracts(self):
        d = json.loads(Path('deployments/sepolia.json').read_text())
        contracts = d.get('contracts', {})
        assert 'stakeHumanSignalJob' in contracts
        assert 'lidoTreasury' in contracts
        assert 'receiptRegistry' in contracts

    def test_addresses_are_valid(self):
        d = json.loads(Path('deployments/sepolia.json').read_text())
        for name, addr in d.get('contracts', {}).items():
            assert addr.startswith('0x'), f"{name} invalid"
            assert len(addr) == 42, f"{name} wrong length"
