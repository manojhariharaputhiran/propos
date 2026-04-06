"""
Critic Agent: reviews the full set of drafted answers and produces a scorecard.
Output: { win_probability, completeness, persuasiveness, compliance, suggestions, critical_flags }
"""
import json
import re
from typing import Dict, Any, List

from app.core.config import settings


CRITIC_SYSTEM_PROMPT = """You are a seasoned proposal critic at a top-tier consulting firm.
Review the complete set of RFP questions and draft answers, then produce an objective evaluation.

Return ONLY valid JSON matching this schema:
{
  "win_probability": <integer 0-100>,
  "completeness": <integer 0-100>,
  "persuasiveness": <integer 0-100>,
  "compliance": <integer 0-100>,
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "critical_flags": ["flag 1", ...]
}

Scoring guidelines:
- win_probability: overall likelihood of winning based on strength of response
- completeness: percentage of questions fully answered
- persuasiveness: how compelling and differentiated the narrative is
- compliance: whether all mandatory requirements are addressed
- suggestions: top 3-5 actionable improvements
- critical_flags: mandatory items missing or answers scoring < 50
"""

MOCK_CRITIC_REPORT = {
    "win_probability": 78,
    "completeness": 85,
    "persuasiveness": 72,
    "compliance": 94,
    "suggestions": [
        "Strengthen the pricing section with a detailed cost breakdown table to increase transparency.",
        "Add specific quantified outcomes (e.g., '23% cost reduction') to boost persuasiveness.",
        "Include a risk matrix and mitigation plan — evaluators consistently reward this.",
        "Reference the client's specific stated objectives from Section 2 of the RFP more directly.",
        "Add an executive summary page that leads with business value, not methodology.",
    ],
    "critical_flags": [
        "Signature page and certifications section not yet completed.",
        "Pricing question flagged for SME review — do not submit without resolved pricing.",
    ],
}


async def critique_proposal(
    questions: List[Dict[str, Any]],
    brand_voice: str = "professional",
) -> Dict[str, Any]:
    """
    Review all drafted answers and return a critic report.
    """
    if settings.use_real_llm:
        return await _critique_with_claude(questions, brand_voice)
    return dict(MOCK_CRITIC_REPORT)


async def _critique_with_claude(
    questions: List[Dict[str, Any]],
    brand_voice: str,
) -> Dict[str, Any]:
    """Use Claude to critique the full proposal."""
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    # Build a summary of all Q&A pairs
    qa_pairs = []
    for i, q in enumerate(questions, 1):
        qa_pairs.append(
            f"Q{i}: {q['text']}\nA{i}: {q.get('draft') or '[NOT YET ANSWERED]'}"
        )

    proposal_text = "\n\n".join(qa_pairs)
    unanswered = sum(1 for q in questions if not q.get("draft"))

    user_msg = (
        f"Brand voice: {brand_voice}\n"
        f"Total questions: {len(questions)}, Unanswered: {unanswered}\n\n"
        f"Full proposal Q&A:\n{proposal_text[:6000]}"
    )

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=CRITIC_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_msg}],
    )

    text = response.content[0].text.strip()
    text = re.sub(r"^```(?:json)?\n?", "", text)
    text = re.sub(r"\n?```$", "", text)

    try:
        report = json.loads(text)
        return {
            "win_probability": int(report.get("win_probability", 70)),
            "completeness": int(report.get("completeness", 75)),
            "persuasiveness": int(report.get("persuasiveness", 70)),
            "compliance": int(report.get("compliance", 80)),
            "suggestions": report.get("suggestions", []),
            "critical_flags": report.get("critical_flags", []),
        }
    except (json.JSONDecodeError, ValueError, TypeError):
        return dict(MOCK_CRITIC_REPORT)
