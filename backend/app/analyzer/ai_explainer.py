"""
AI Explainer Module
Generates natural-language explanations for impact analysis results.

Tries OpenAI GPT if API key is configured; falls back to rule-based explanations.
Uploaded source code is never sent to external services unless explicitly enabled.
"""
import logging
from typing import Optional
from app.core.config import settings
from app.analyzer.impact_analyzer import ImpactResult
from app.analyzer.risk_scoring import RiskScore

logger = logging.getLogger(__name__)


def generate_explanation(
    impact: ImpactResult,
    risk: RiskScore,
    use_ai: bool = False,
) -> str:
    """
    Generate a plain-language explanation for an impact analysis result.

    Args:
        impact: Impact analysis result
        risk: Risk score
        use_ai: Whether to attempt AI-powered explanation (requires OPENAI_API_KEY)

    Returns:
        Human-readable explanation string
    """
    if use_ai and settings.OPENAI_API_KEY:
        try:
            return _generate_ai_explanation(impact, risk)
        except Exception as e:
            logger.warning(f"AI explanation failed: {e}. Using rule-based fallback.")

    return _generate_rule_based_explanation(impact, risk)


def _generate_rule_based_explanation(impact: ImpactResult, risk: RiskScore) -> str:
    """Generate a structured rule-based explanation."""
    func_name = impact.selected_function
    direct_count = len(impact.direct_callers)
    total_affected = impact.affected_count

    lines = [
        f"**Function Under Review: `{func_name}`**",
        "",
        f"Located in `{impact.source_file}`"
        + (f" at line {impact.line_start}" if impact.line_start else ""),
        "",
    ]

    # Caller summary
    if direct_count == 0:
        lines.append(
            f"`{func_name}` has no recognized direct callers in this project. "
            "It may be an entry point, called externally, or its callers use "
            "dynamic patterns not detectable by static analysis."
        )
    elif direct_count == 1:
        lines.append(
            f"`{func_name}` is directly called by 1 function. "
            "Changes to this function could affect that caller."
        )
    else:
        lines.append(
            f"`{func_name}` is directly called by {direct_count} functions. "
            f"Changes could propagate to all {total_affected} identified function(s) "
            "in the call chain."
        )

    lines.append("")

    # Risk summary
    category_text = {
        "low": "The estimated review priority is **Low**. This function has limited call-graph exposure.",
        "medium": "The estimated review priority is **Medium**. Standard review before shipping is appropriate.",
        "high": "The estimated review priority is **High**. A detailed review is recommended before shipping.",
        "critical": "The estimated review priority is **Critical**. Thorough review and regression testing are strongly recommended.",
    }
    lines.append(
        category_text.get(risk.category, f"Risk score: {risk.score}/100.")
    )
    lines.append(f"Risk score: **{risk.score}/100** ({risk.category.upper()})")
    lines.append("")

    # What to do
    lines.append("**Suggested review actions:**")
    if direct_count > 0:
        direct_caller_names = [c.split(".")[-1] for c in impact.direct_callers[:3]]
        names_str = ", ".join(f"`{n}`" for n in direct_caller_names)
        lines.append(
            f"- Review the following direct callers for behavioral assumptions about `{func_name}`: {names_str}"
            + (" and others." if direct_count > 3 else ".")
        )
    lines.append(
        f"- Verify that the function signature, return values, and side effects of `{func_name}` remain compatible."
    )
    lines.append("- Run recommended candidate tests identified by the test recommender.")
    lines.append("")

    # Limitations
    lines.append("**Known analysis limitations:**")
    for limitation in impact.limitations[:3]:
        lines.append(f"- {limitation}")

    lines.append("")
    lines.append(
        f"*{RiskScore.DISCLAIMER}*"
    )

    return "\n".join(lines)


def _generate_ai_explanation(impact: ImpactResult, risk: RiskScore) -> str:
    """Generate AI-powered explanation using OpenAI (optional)."""
    try:
        import openai

        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

        system_prompt = (
            "You are a senior software engineer explaining code impact analysis results "
            "to a developer. Be concise, technical, and helpful. Do not fabricate information."
        )

        # Build a safe summary prompt — do NOT send source code
        user_prompt = f"""
Explain this change-impact analysis result in 3-4 paragraphs:

Function: {impact.selected_function}
File: {impact.source_file}
Direct callers: {len(impact.direct_callers)}
Total affected functions: {impact.affected_count}
Risk score: {risk.score}/100 ({risk.category})
Risk factors: {[f["name"] + " = " + str(f["value"]) for f in risk.contributing_factors]}

Include: what the developer should review, what the risk score means, and key limitations.
Remind the developer this is static analysis only.
"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=500,
            timeout=10,
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        raise RuntimeError(f"OpenAI API error: {e}") from e
