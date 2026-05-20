"""Score Signal Agent output against ground truth.

Scoring is **scoped to the accounts the agent actually evaluated**. If you
ran 3 accounts and 10 of the 25 carry the pattern, scoring on the whole
dataset would unfairly count the 7 unevaluated true-positives as false
negatives. The scope-restricted metrics reflect what the agent can claim.
"""

from __future__ import annotations

from typing import Any

from eval.ground_truth_loader import account_level_pattern_accounts


def score_hidden_churn(
    agent_results: list[dict[str, Any]],
) -> dict[str, Any]:
    """Compute precision/recall/F1 for Hidden Churn detector output.

    Args:
        agent_results: List of detector outputs. Each must have `account_id`.
            Records without `detected` (e.g. error rows) are treated as
            "not evaluated" and excluded from scoring entirely.

    Returns:
        A report dict with metrics + the TP/FP/FN account_id sets so the
        caller can inspect specific failures.
    """
    gt_positives_all = account_level_pattern_accounts("hidden_churn_risk")

    evaluated: list[dict[str, Any]] = [
        r for r in agent_results if "detected" in r and "account_id" in r
    ]
    evaluated_ids = {r["account_id"] for r in evaluated}

    flagged_ids = {r["account_id"] for r in evaluated if r.get("detected")}
    gt_positives_in_scope = gt_positives_all & evaluated_ids

    true_positives = flagged_ids & gt_positives_in_scope
    false_positives = flagged_ids - gt_positives_in_scope
    false_negatives = gt_positives_in_scope - flagged_ids
    true_negatives = (
        evaluated_ids - flagged_ids - gt_positives_in_scope
    )

    tp, fp, fn = len(true_positives), len(false_positives), len(false_negatives)
    precision = tp / (tp + fp) if (tp + fp) else None
    recall = tp / (tp + fn) if (tp + fn) else None
    f1 = (
        2 * precision * recall / (precision + recall)
        if precision and recall
        else None
    )

    return {
        "pattern": "hidden_churn_risk",
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
