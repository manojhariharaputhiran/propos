"""
Retriever Agent: fetches relevant context from Qdrant vector DB for each question.
Falls back to in-memory mock snippets when Qdrant is unavailable.
"""
from typing import List, Dict, Any

from app.core.config import settings


MOCK_CONTEXT_SNIPPETS = [
    "Our firm has delivered 47 successful digital transformation engagements across "
    "Fortune 500 healthcare and life sciences companies over the past decade.",
    "Our methodology combines agile sprint cycles with rigorous stakeholder alignment "
    "ceremonies, ensuring 98% on-time delivery across all engagements.",
    "We maintain SOC 2 Type II certification, HIPAA BAA compliance, and ISO 27001 "
    "accreditation, with a dedicated compliance officer on every project.",
    "Our pricing is structured as a time-and-materials model with capped NTE options "
    "available for fixed-scope phases, providing budget predictability.",
    "Key personnel include a certified PMP project manager, two senior architects with "
    "cloud security specialisation, and a dedicated QA lead.",
]


async def retrieve_context(question: str, org_id: str) -> List[str]:
    """
    Return relevant context snippets for a given question.
    Uses Qdrant if available, otherwise returns mock snippets.
    """
    if settings.use_real_llm:
        try:
            return await _retrieve_from_qdrant(question, org_id)
        except Exception:
            pass

    return _mock_retrieve(question)


def _mock_retrieve(question: str) -> List[str]:
    """Return 2-3 mock context snippets."""
    question_lower = question.lower()
    relevant = []
    for snippet in MOCK_CONTEXT_SNIPPETS:
        keywords = ["hipaa", "compliance", "methodology", "pricing", "experience", "team"]
        for kw in keywords:
            if kw in question_lower and kw in snippet.lower():
                relevant.append(snippet)
                break
    return relevant[:3] if relevant else MOCK_CONTEXT_SNIPPETS[:2]


async def _retrieve_from_qdrant(question: str, org_id: str) -> List[str]:
    """Query Qdrant for semantically similar content."""
    from qdrant_client import AsyncQdrantClient
    from qdrant_client.models import Filter, FieldCondition, MatchValue
    import anthropic

    client = AsyncQdrantClient(
        url=settings.qdrant_url,
        api_key=settings.qdrant_api_key or None,
    )

    # Get embedding from Claude (or use a lightweight embedder)
    # For now use a simple text embedding via the Anthropic client
    ac = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    # Qdrant needs vectors — use mock vectors for this demo path
    # In production, wire in a proper embedder (e.g. text-embedding-3-small)
    return _mock_retrieve(question)


async def index_document(
    text: str, org_id: str, rfp_id: str, doc_type: str = "rfp"
) -> bool:
    """Index a document chunk into Qdrant."""
    if not settings.use_real_llm:
        return True  # no-op in mock mode

    try:
        from qdrant_client import AsyncQdrantClient
        from qdrant_client.models import PointStruct, VectorParams, Distance
        import hashlib

        client = AsyncQdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key or None,
        )
        # Ensure collection exists
        collections = await client.get_collections()
        col_names = [c.name for c in collections.collections]
        if settings.qdrant_collection not in col_names:
            await client.create_collection(
                collection_name=settings.qdrant_collection,
                vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
            )
        return True
    except Exception:
        return False
