"""
Risk Scoring Engine
Calculates a transparent heuristic risk score (0–100) for a function change.

Formula:
    score = min(100, (
        (direct_caller_count * 10) +
        (total_affected_count * 3) +
        (max_depth * 5) +
        (cycle_bonus)
    ))

Risk thresholds:
    0-24:   Low
    25-49:  Medium
    50-74:  High
    75-100: Critical

The score is a review-priority heuristic — not a probability of software failure.
"""
from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from app.analyzer.impact_analyzer import ImpactResult


@dataclass
class RiskScore:
    score: float
    category: str  # low | medium | high | critical
    contributing_factors: List[Dict[str, Any]]
    formula_description: str
    review_priority: str

    DISCLAIMER = (
        "This score is a review-priority heuristic based on static "
        "call-graph structure. It does not represent a probability of "
        "software failure or a guarantee of runtime impact."
    )


THRESHOLDS = [
    (75, "critical", "Critical — Requires immediate and thorough review"),
    (50, "high", "High — Detailed review recommended before shipping"),
    (25, "medium", "Medium — Standard review is appropriate"),
    (0, "low", "Low — Minimal visible call-graph exposure"),
]


def calculate_risk_score(impact: ImpactResult) -> RiskScore:
    """
    Calculate a heuristic risk score from impact analysis data.

    Args:
        impact: ImpactResult from ImpactAnalyzer.analyze()

    Returns:
        RiskScore with score, category, and contributing factors
    """
    factors = []
    raw_score = 0.0

    # Factor 1: Number of direct callers
    direct_count = len(impact.direct_callers)
    direct_contribution = direct_count * 10
    raw_score += direct_contribution
    factors.append({
        "name": "Direct callers",
        "value": direct_count,
        "contribution": direct_contribution,
        "description": f"{direct_count} function(s) directly call this function",
    })

    # Factor 2: Total affected (transitive) callers
    total_affected = impact.affected_count
    transitive_only = max(0, total_affected - direct_count)
    transitive_contribution = transitive_only * 3
    raw_score += transitive_contribution
    factors.append({
        "name": "Transitive callers",
        "value": transitive_only,
        "contribution": transitive_contribution,
        "description": f"{transitive_only} additional function(s) may be indirectly affected",
    })

    # Factor 3: Maximum propagation depth
    max_depth = max((a.depth for a in impact.all_affected), default=0)
    depth_contribution = max_depth * 5
    raw_score += depth_contribution
    factors.append({
        "name": "Propagation depth",
        "value": max_depth,
        "contribution": depth_contribution,
        "description": f"Impact propagates up to {max_depth} level(s) in the call chain",
    })

    # Factor 4: Presence of dependency paths (indicates structural coupling)
    path_bonus = len(impact.sample_paths) * 2
    raw_score += path_bonus
    factors.append({
        "name": "Dependency paths",
        "value": len(impact.sample_paths),
        "contribution": path_bonus,
        "description": f"{len(impact.sample_paths)} dependency path(s) identified",
    })

    # Cap at 100
    final_score = min(100.0, raw_score)

    # Determine category
    category = "low"
    review_priority = "Low — Minimal visible call-graph exposure"
    for threshold, cat, priority in THRESHOLDS:
        if final_score >= threshold:
            category = cat
            review_priority = priority
            break

    formula_desc = (
        "score = min(100, "
        "(direct_callers × 10) + "
        "(transitive_callers × 3) + "
        "(max_depth × 5) + "
        "(dependency_paths × 2))"
    )

    return RiskScore(
        score=round(final_score, 1),
        category=category,
        contributing_factors=factors,
        formula_description=formula_desc,
        review_priority=review_priority,
    )


def risk_score_to_dict(score: RiskScore) -> dict:
    return {
        "score": score.score,
        "category": score.category,
        "contributing_factors": score.contributing_factors,
        "formula_description": score.formula_description,
        "review_priority": score.review_priority,
        "disclaimer": RiskScore.DISCLAIMER,
    }
