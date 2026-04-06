"""
Copywriter Agent: drafts a compelling answer to each RFP question.
Output: { draft, confidence, needs_sme, sme_question }
"""
import json
import re
from typing import Dict, Any, List

from app.core.config import settings


COPYWRITER_SYSTEM_PROMPT = """You are an expert bid writer for a top-tier consulting agency.
Your task is to write a concise, persuasive answer to an RFP question using the context provided.

Return ONLY valid JSON matching this schema exactly:
{
  "draft": "<your answer here>",
  "confidence": <float 0.0-1.0>,
  "needs_sme": <true|false>,
  "sme_question": "<question for SME if needs_sme is true, else null>"
}

Guidelines:
- confidence reflects how well the context supports a complete answer
- Set needs_sme=true if specialised technical/legal/pricing knowledge is required
- Be specific, avoid generic platitudes
- Write in a consultative, confident tone
"""

MOCK_ANSWERS = {
    0: {
        "draft": "Acme Agency has successfully delivered 47 digital transformation engagements "
                 "across the healthcare sector over the past decade, partnering with leading "
                 "pharmaceutical companies, hospital networks, and life sciences organisations. "
                 "Our healthcare portfolio includes EMR modernisation, clinical data platform "
                 "builds, and regulatory submission automation — each delivered on time and within budget.",
        "confidence": 0.92,
        "needs_sme": False,
        "sme_question": None,
    },
    1: {
        "draft": "Our engagement methodology follows a phased agile approach: Discovery (weeks 1-2), "
                 "Architecture & Design (weeks 3-4), iterative Build sprints (weeks 5-12), "
                 "UAT & Hardening (weeks 13-14), and Go-Live + Hypercare (weeks 15-16). "
                 "Each phase concludes with a stakeholder review gate to ensure alignment before proceeding.",
        "confidence": 0.88,
        "needs_sme": False,
        "sme_question": None,
    },
    2: {
        "draft": "This engagement will be led by a Principal Consultant (PMP-certified, 15 years experience) "
                 "supported by two Senior Engineers, a Data Architect, a QA Lead, and a dedicated "
                 "Delivery Manager. Full CVs and availability confirmations are available on request.",
        "confidence": 0.85,
        "needs_sme": False,
        "sme_question": None,
    },
    3: {
        "draft": "Our pricing is structured as Time & Materials with a Not-to-Exceed (NTE) cap for "
                 "fixed-scope phases, providing budget predictability. Please see Appendix A for the "
                 "detailed rate card and phase-level cost breakdown.",
        "confidence": 0.60,
        "needs_sme": True,
        "sme_question": "Please provide the specific rate card and estimated hours per phase for this engagement.",
    },
    4: {
        "draft": "Acme Agency maintains HIPAA compliance through BAA agreements, role-based access controls, "
                 "AES-256 encryption at rest and in transit, annual security audits, and mandatory staff "
                 "training. We hold SOC 2 Type II certification and ISO 27001 accreditation.",
        "confidence": 0.95,
        "needs_sme": False,
        "sme_question": None,
    },
}


async def draft_answer(
    question: Dict[str, Any],
    context_snippets: List[str],
    brand_voice: str = "professional",
    q_index: int = 0,
) -> Dict[str, Any]:
    """
    Generate a draft answer for a single RFP question.
    Returns dict with draft, confidence, needs_sme, sme_question.
    """
    if settings.use_real_llm:
        return await _draft_with_claude(question, context_snippets, brand_voice)
    return _mock_draft(question, q_index)


def _mock_draft(question: Dict[str, Any], q_index: int) -> Dict[str, Any]:
    """Return a mock answer based on question index."""
    base = MOCK_ANSWERS.get(q_index % len(MOCK_ANSWERS), MOCK_ANSWERS[0])
    return dict(base)


async def _draft_with_claude(
    question: Dict[str, Any],
    context_snippets: List[str],
    brand_voice: str,
) -> Dict[str, Any]:
    """Use Claude to draft an answer."""
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    context_block = "\n\n".join(context_snippets) if context_snippets else "No specific context available."
    user_msg = (
        f"Brand voice: {brand_voice}\n\n"
        f"RFP Question:\n{question['text']}\n\n"
        f"Relevant context from our knowledge base:\n{context_block}"
    )

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=COPYWRITER_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_msg}],
    )

    text = response.content[0].text.strip()
    text = re.sub(r"^```(?:json)?\n?", "", text)
    text = re.sub(r"\n?```$", "", text)

    try:
        result = json.loads(text)
        return {
            "draft": result.get("draft", ""),
            "confidence": float(result.get("confidence", 0.7)),
            "needs_sme": bool(result.get("needs_sme", False)),
            "sme_question": result.get("sme_question"),
        }
    except (json.JSONDecodeError, ValueError, TypeError):
        return {
            "draft": text,
            "confidence": 0.5,
            "needs_sme": False,
            "sme_question": None,
        }
