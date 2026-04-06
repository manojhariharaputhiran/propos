"""
Pricing Agent: validates and enriches pricing-related answers.
"""
from typing import Dict, Any, List

from app.core.config import settings


PRICING_KEYWORDS = ["price", "cost", "rate", "fee", "budget", "pricing", "payment", "billing"]

MOCK_PRICING_ANALYSIS = {
    "pricing_questions_found": 1,
    "has_rate_card": False,
    "has_breakdown": False,
    "recommendation": (
        "Add a formal rate card table with roles, daily rates, and estimated days per phase. "
        "Consider including a payment milestone schedule (30/30/30/10 is standard)."
    ),
    "flagged_for_sme": True,
}


async def analyse_pricing(
    questions: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Analyse pricing-related questions and flag gaps."""
    if settings.use_real_llm:
        return await _analyse_with_claude(questions)
    return _mock_pricing_analysis(questions)


def _mock_pricing_analysis(questions: List[Dict[str, Any]]) -> Dict[str, Any]:
    pricing_qs = [
        q for q in questions
        if any(kw in (q.get("text") or "").lower() for kw in PRICING_KEYWORDS)
    ]

    full_text = " ".join((q.get("draft") or "") for q in pricing_qs).lower()
    has_rate_card = "rate card" in full_text or "rate:" in full_text
    has_breakdown = "breakdown" in full_text or "phase" in full_text

    return {
        "pricing_questions_found": len(pricing_qs),
        "has_rate_card": has_rate_card,
        "has_breakdown": has_breakdown,
        "recommendation": MOCK_PRICING_ANALYSIS["recommendation"],
        "flagged_for_sme": not (has_rate_card and has_breakdown),
    }


async def _analyse_with_claude(questions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Use Claude for pricing analysis."""
    import anthropic, json, re

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    pricing_qs = [
        q for q in questions
        if any(kw in (q.get("text") or "").lower() for kw in PRICING_KEYWORDS)
    ]

    if not pricing_qs:
        return {"pricing_questions_found": 0, "recommendation": "No pricing questions found."}

    qa_text = "\n".join(
        f"Q: {q['text']}\nA: {q.get('draft') or '[unanswered]'}" for q in pricing_qs
    )

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        system=(
            "Analyse the pricing answers in this RFP response. Return JSON: "
            '{"pricing_questions_found": <int>, "has_rate_card": <bool>, '
            '"has_breakdown": <bool>, "recommendation": "<string>", "flagged_for_sme": <bool>}'
        ),
        messages=[{"role": "user", "content": qa_text}],
    )

    text = response.content[0].text.strip()
    text = re.sub(r"^```(?:json)?\n?", "", text)
    text = re.sub(r"\n?```$", "", text)
    try:
        return json.loads(text)
    except Exception:
        return _mock_pricing_analysis(questions)
