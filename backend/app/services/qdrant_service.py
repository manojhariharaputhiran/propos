"""
Qdrant service: initialises the collection and provides search/upsert helpers.
"""
from typing import List, Dict, Any, Optional

from app.core.config import settings


async def ensure_collection() -> bool:
    """Create Qdrant collection if it doesn't exist."""
    if not settings.use_real_llm:
        return True

    try:
        from qdrant_client import AsyncQdrantClient
        from qdrant_client.models import VectorParams, Distance

        client = AsyncQdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key or None,
        )
        collections = await client.get_collections()
        names = [c.name for c in collections.collections]

        if settings.qdrant_collection not in names:
            await client.create_collection(
                collection_name=settings.qdrant_collection,
                vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
            )
        return True
    except Exception as e:
        return False


async def search(
    query_vector: List[float],
    org_id: str,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """Search for similar documents."""
    if not settings.use_real_llm:
        return []

    try:
        from qdrant_client import AsyncQdrantClient
        from qdrant_client.models import Filter, FieldCondition, MatchValue

        client = AsyncQdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key or None,
        )

        results = await client.search(
            collection_name=settings.qdrant_collection,
            query_vector=query_vector,
            query_filter=Filter(
                must=[FieldCondition(key="org_id", match=MatchValue(value=org_id))]
            ),
            limit=limit,
            with_payload=True,
        )

        return [
            {"text": r.payload.get("text", ""), "score": r.score}
            for r in results
        ]
    except Exception:
        return []


async def upsert_document(
    doc_id: str,
    vector: List[float],
    text: str,
    org_id: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> bool:
    """Insert or update a document vector."""
    if not settings.use_real_llm:
        return True

    try:
        from qdrant_client import AsyncQdrantClient
        from qdrant_client.models import PointStruct

        client = AsyncQdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key or None,
        )

        payload = {"text": text, "org_id": org_id, **(metadata or {})}
        point = PointStruct(id=doc_id, vector=vector, payload=payload)

        await client.upsert(
            collection_name=settings.qdrant_collection,
            points=[point],
        )
        return True
    except Exception:
        return False
