"""Score Signal Agent output against ground truth.

Scoring is **scoped to the accounts the agent actually evaluated**. If you
ran 3 accounts and 10 of the 25 carry the pattern, scoring on the whole
dataset would unfairly count the 7 unevaluated true-positives as false
negatives. The scope-restricted metrics reflect what the agent can claim.
"""

from __future__ import annotations

from typing import Any

from eval.ground_truth_loader import account_level_pattern_accounts, organizational_pattern_accounts

# All account-level (Tier 1) and organizational (Tier 3) patterns share
# the same per-account ground-truth structure: a set of account_ids.
_ACCOUNT_LEVEL_PATTERNS = {
    "hidden_churn_risk",
    "expansion_ready",
    "executive_friction",
    "cross_functional_blind_spot",
}


def score_pattern(
    pattern_key: str,
    agent_results: list[dict[str, Any]],
) -> dict[str, Any]:
    """Compute precision/recall/F1 for any per-account pattern detector output.

    Works for Tier 1 account-level patterns (hidden_churn_risk, expansion_ready,
    executive_friction) and the Tier 3 organizational pattern
    (cross_functional_blind_spot), which share the same per-account ground-truth
    structure.

    Args:
        pattern_key: canonical key matching a ground_truth.json entry.
        agent_results: List of detector outputs. Each must have `account_id`.
            Records without `detected` (e.g. error rows) are treated as
            "not evaluated" and excluded from scoring entirely.

    Returns:
        A report dict with metrics + the TP/FP/FN account_id sets so the
        caller can inspect specific failures.
    """
    if pattern_key in _ACCOUNT_LEVEL_PATTERNS:
        gt_positives_all = account_level_pattern_accounts(pattern_key)
    else:
        gt_positives_all = organizational_pattern_accounts(pattern_key)

    evaluated: list[dict[str, Any]] = [
        r for r in agent_results if "detected" in r and "account_id" in r
    ]
    evaluated_ids = {r["account_id"] for r in evaluated}

    flagged_ids = {r["account_id"] for r in evaluated if r.get("detected")}
    gt_positives_in_scope = gt_positives_all & evaluated_ids

    true_positives = flagged_ids & gt_positives_in_scope
    false_positives = flagged_ids - gt_positives_in_scope
    false_negatives = gt_positives_in_scope - flagged_ids
    true_negatives = evaluated_ids - flagged_ids - gt_positives_in_scope

    tp, fp, fn = len(true_positives), len(false_positives), len(false_negatives)
    precision = tp / (tp + fp) if (tp + fp) else None
    recall = tp / (tp + fn) if (tp + fn) else None
    f1 = (
        2 * precision * recall / (precision + recall)
        if precision and recall
        else None
    )

    return {
        "pattern": pattern_key,
        "evaluated_account_count": len(evaluated_ids),
        "skipped_or_errored": [
            r["account_id"]
            for r in agent_results
            if r.get("account_id") and "detected" not in r
        ],
        "ground_truth_positives_total": len(gt_positives_all),
        "ground_truth_positives_in_scope": sorted(gt_positives_in_scope),
        "agent_flagged_in_scope": sorted(flagged_ids),
        "true_positives": sorted(true_positives),
        "false_positives": sorted(false_positives),
        "false_negatives": sorted(false_negatives),
        "true_negatives": sorted(true_negatives),
        "precision": round(precision, 3) if precision is not None else None,
        "recall": round(recall, 3) if recall is not None else None,
        "f1": round(f1, 3) if f1 is not None else None,
    }


# Backward-compatible alias for any existing callers.
def score_hidden_churn(agent_results: list[dict[str, Any]]) -> dict[str, Any]:
    return score_pattern("hidden_churn_risk", agent_results)


def score_portfolio_pattern(
    pattern_key: str,
    agent_results: list[dict[str, Any]],
) -> dict[str, Any]:
    """Score a Tier 2 portfolio-level detector result against ground truth.

    Portfolio patterns produce a single detection result (not per-account),
    so scoring has two dimensions:
      1. Did the agent detect the pattern at all? (binary)
      2. How well does the affected_accounts set match ground truth? (F1)

    Args:
        pattern_key: e.g. "systemic_product_signal"
        agent_results: list with one portfolio detection dict (as written by
            run_portfolio.py). Records without `detected` are treated as errors.
    """
    from eval.ground_truth_loader import portfolio_pattern

    gt_entry = portfolio_pattern(pattern_key)
    gt_detected = gt_entry is not None
    gt_accounts = set(gt_entry.get("account_ids", [])) if gt_entry else set()

    # Find the relevant result record
    result = next(
        (r for r in agent_results if r.get("pattern") == pattern_key and "detected" in r),
        None,
    )

    if result is None:
        return {
            "pattern": pattern_key,
            "status": "no_result",
            "ground_truth_detected": gt_detected,
            "ground_truth_account_count": len(gt_accounts),
        }

    agent_detected = bool(result.get("detected"))
    agent_accounts = set(result.get("affected_accounts", []))

    detection_correct = agent_detected == gt_detected

    # Member-set F1 (only meaningful when both agree pattern exists)
    if gt_accounts and agent_accounts:
        tp = len(agent_accounts & gt_accounts)
        fp = len(agent_accounts - gt_accounts)
        fn = len(gt_accounts - agent_accounts)
        precision = tp / (tp + fp) if (tp + fp) else None
        recall = tp / (tp + fn) if (tp + fn) else None
        f1 = (
            2 * precision * recall / (precision + recall)
            if precision and recall
            else None
        )
    else:
        tp = fp = fn = 0
        precision = recall = f1 = None

    return {
        "pattern": pattern_key,
        "ground_truth_detected": gt_detected,
        "ground_truth_accounts": sorted(gt_accounts),
        "agent_detected": agent_detected,
        "agent_accounts": sorted(agent_accounts),
        "detection_correct": detection_correct,
        "member_set_true_positives": sorted(agent_accounts & gt_accounts),
        "member_set_false_positives": sorted(agent_accounts - gt_accounts),
        "member_set_false_negatives": sorted(gt_accounts - agent_accounts),
        "member_set_precision": round(precision, 3) if precision is not None else None,
        "member_set_recall": round(recall, 3) if recall is not None else None,
        "member_set_f1": round(f1, 3) if f1 is not None else None,
        "agent_confidence": result.get("confidence"),
    }
