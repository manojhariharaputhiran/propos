"""
Compliance Agent: checks answers for regulatory and contractual compliance flags.
"""
import re
from typing import Dict, Any, List

from app.core.config import settings


COMPLIANCE_KEYWORDS = {
    "hipaa": "HIPAA compliance language present",
    "gdpr": "GDPR data handling addressed",
    "soc 2": "SOC 2 certification referenced",
    "iso 27001": "ISO 27001 compliance noted",
    "indemnification": "Indemnification clause addressed",
    "liability": "Liability terms referenced",
    "insurance": "Insurance requirements noted",
    "nda": "NDA / confidentiality addressed",
    "sla": "SLA commitments defined",
    "data residency": "Data residency requirements addressed",
}

MOCK_COMPLIANCE_REPORT = {
    "passed": ["HIPAA compliance language present", "SOC 2 certification referenced"],
    "warnings": ["Indemnification clause not explicitly addressed in responses"],
    "critical": [],
    "score": 87,
}


async def check_compliance(
    questions: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Run compliance checks on all draft answers."""
    if settings.use_real_llm:
        return await _check_with_claude(questions)
    return _mock_compliance_check(questions)


def _mock_compliance_check(questions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Simple keyword-based compliance check."""
    full_text = " ".join(
        (q.get("draft") or "") for q in questions
    ).lower()

    passed = []
    missing = []

    for keyword, description in COMPLIANCE_KEYWORDS.items():
        if keyword in full_text:
            passed.append(description)
        else:
            missing.append(f"No mention of: {keyword.upper()}")

    score = int((len(passed) / max(len(COMPLIANCE_KEYWORDS), 1)) * 100)

    return {
        "passed": passed,
        "warnings": missing[:3],
        "critical": [],
        "score": score,
    }


async def _check_with_claude(questions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Use Claude for compliance review."""
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    answers_text = "\n".join(q.get("draft") or "" for q in questions)

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        system=(
            "You are a compliance officer. Review these proposal answers for "
            "regulatory and contractual compliance gaps. Return JSON: "
            '{"passed": [...], "warnings": [...], "critical": [...], "score": <int>}'
        ),
        messages=[{"role": "user", "content": answers_text[:4000]}],
    )

    import json
    text = response.content[0].text.strip()
    text = re.sub(r"^```(?:json)?\n?", "", text)
    text = re.sub(r"\n?```$", "", text)
    try:
        return json.loads(text)
    except Exception:
        return _mock_compliance_check(questions)
