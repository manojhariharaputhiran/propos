"""
Parser Agent: extracts structured questions/requirements from raw RFP text.
Uses Claude if ANTHROPIC_API_KEY is set, otherwise returns mock data.
"""
import re
from typing import List, Dict, Any
import uuid

from app.core.config import settings


MOCK_QUESTIONS = [
    "Describe your company's background and relevant experience with similar engagements.",
    "What is your proposed approach and methodology for delivering this project?",
    "Provide details on your team structure, key personnel, and their qualifications.",
    "What is your pricing model and total cost breakdown for this engagement?",
    "How do you manage project risks and ensure delivery on time and within scope?",
    "Describe your quality assurance processes and how you measure success.",
    "What is your proposed project timeline and key milestones?",
    "How do you handle change requests and scope adjustments during delivery?",
    "Describe your approach to communication and stakeholder reporting.",
    "Provide three references from comparable engagements, including contact details.",
]

PARSER_SYSTEM_PROMPT = """You are an expert RFP analyst. Extract all questions, requirements,
and deliverables from the RFP text. Return a JSON array of question strings only — no preamble.
Example output:
["Question 1", "Question 2", ...]
"""


async def parse_rfp(raw_text: str) -> List[Dict[str, Any]]:
    """
    Parse RFP text and return list of question dicts with id, text, sort_order.
    """
    if settings.use_real_llm:
        questions_text = await _parse_with_claude(raw_text)
    else:
        questions_text = _mock_parse(raw_text)

    return [
        {
            "id": str(uuid.uuid4()),
            "text": q.strip(),
            "sort_order": i,
            "draft": None,
            "confidence": None,
            "needs_sme": False,
            "sme_answer": None,
            "final_answer": None,
        }
        for i, q in enumerate(questions_text)
        if q.strip()
    ]


def _mock_parse(raw_text: str) -> List[str]:
    """Return mock questions, using a subset based on text length."""
    count = min(len(MOCK_QUESTIONS), max(3, len(raw_text) // 500))
    return MOCK_QUESTIONS[:count]


async def _parse_with_claude(raw_text: str) -> List[str]:
    """Use Claude to extract questions from RFP text."""
    import anthropic
    import json

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    truncated = raw_text[:8000]  # Stay within context window for demo
    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=PARSER_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"Extract questions from this RFP:\n\n{truncated}"}],
    )

    text = response.content[0].text.strip()
    # Strip markdown fences if present
    text = re.sub(r"^```(?:json)?\n?", "", text)
    text = re.sub(r"\n?```$", "", text)

    try:
        questions = json.loads(text)
        if isinstance(questions, list):
            return [str(q) for q in questions]
    except (json.JSONDecodeError, ValueError):
        pass

    # Fallback: split by newlines
    return [line.strip("- •") for line in text.split("\n") if line.strip()]
