"""
LangGraph State Machine for RFP processing pipeline.

States:
  uploaded → parsing → qualification_needed → qualified → drafting
          → sme_needed → critic_done → human_review → export_ready → completed

This module defines the full graph with all nodes and edges.
"""
import asyncio
from typing import TypedDict, Optional, List, Dict, Any, Annotated
import operator

from langgraph.graph import StateGraph, END


# ── State definition ──────────────────────────────────────────────────────────

class QuestionState(TypedDict):
    id: str
    text: str
    draft: Optional[str]
    confidence: Optional[float]
    needs_sme: bool
    sme_answer: Optional[str]
    final_answer: Optional[str]
    sort_order: int


class RFPState(TypedDict):
    rfp_id: str
    org_id: str
    status: str
    raw_text: str
    questions: List[QuestionState]
    critic_report: Optional[Dict[str, Any]]
    export_format: Optional[str]
    brand_voice: Optional[str]
    # Error tracking
    error: Optional[str]


# ── Node implementations ──────────────────────────────────────────────────────

async def node_parse(state: RFPState) -> RFPState:
    """Parse raw RFP text into structured questions, then auto-proceed to drafting."""
    from app.agents.parser_agent import parse_rfp

    questions_raw = await parse_rfp(state["raw_text"])
    questions: List[QuestionState] = [
        {
            "id": q["id"],
            "text": q["text"],
            "draft": None,
            "confidence": None,
            "needs_sme": False,
            "sme_answer": None,
            "final_answer": None,
            "sort_order": q["sort_order"],
        }
        for q in questions_raw
    ]

    # Auto-proceed — no manual Go/No-Go gate
    return {**state, "status": "drafting", "questions": questions}


async def node_qualify(state: RFPState) -> RFPState:
    """
    Pause point: wait for human Go/No-Go.
    The graph pauses here; resume is triggered via API.
    """
    return {**state, "status": "qualification_needed"}


async def node_draft(state: RFPState) -> RFPState:
    """Run copywriter + retriever agents on each question."""
    from app.agents.copywriter_agent import draft_answer
    from app.agents.retriever_agent import retrieve_context

    brand_voice = state.get("brand_voice") or "professional"
    updated_questions = []

    for i, q in enumerate(state["questions"]):
        context = await retrieve_context(q["text"], state["org_id"])
        result = await draft_answer(q, context, brand_voice, q_index=i)

        updated_questions.append({
            **q,
            "draft": result["draft"],
            "confidence": result["confidence"],
            "needs_sme": result["needs_sme"],
            "sme_answer": q.get("sme_answer"),
            "final_answer": None,
        })

    # Check if any questions need SME
    needs_sme_any = any(q["needs_sme"] and not q.get("sme_answer") for q in updated_questions)
    new_status = "sme_needed" if needs_sme_any else "critic_done"

    return {**state, "status": new_status, "questions": updated_questions}


async def node_sme_collect(state: RFPState) -> RFPState:
    """
    Pause point: wait for SME answers to flagged questions.
    The graph pauses here; resume triggered via API after SME provides answers.
    """
    return {**state, "status": "sme_needed"}


async def node_merge_sme(state: RFPState) -> RFPState:
    """Merge SME answers into final_answer for relevant questions."""
    updated_questions = []
    for q in state["questions"]:
        if q.get("needs_sme") and q.get("sme_answer"):
            final = (
                f"{q.get('draft', '')}\n\n"
                f"[SME Input]: {q['sme_answer']}"
            ).strip()
            updated_questions.append({**q, "final_answer": final})
        else:
            updated_questions.append({**q, "final_answer": q.get("draft")})

    return {**state, "status": "critic_done", "questions": updated_questions}


async def node_critique(state: RFPState) -> RFPState:
    """Run critic agent on the full proposal."""
    from app.agents.critic_agent import critique_proposal

    brand_voice = state.get("brand_voice") or "professional"
    report = await critique_proposal(state["questions"], brand_voice)

    return {**state, "status": "human_review", "critic_report": report}


async def node_human_review(state: RFPState) -> RFPState:
    """
    Pause point: human reviews and approves/rejects.
    """
    return {**state, "status": "human_review"}


async def node_finalize(state: RFPState) -> RFPState:
    """Finalize answers: use final_answer or fall back to draft."""
    updated_questions = []
    for q in state["questions"]:
        final = q.get("final_answer") or q.get("draft") or ""
        updated_questions.append({**q, "final_answer": final})

    return {**state, "status": "export_ready", "questions": updated_questions}


async def node_export(state: RFPState) -> RFPState:
    """Mark as completed — actual export is triggered via API endpoint."""
    return {**state, "status": "completed"}


# ── Routing functions ─────────────────────────────────────────────────────────

def route_after_draft(state: RFPState) -> str:
    if state["status"] == "sme_needed":
        return "sme_collect"
    return "critique"


def route_after_qualify(state: RFPState) -> str:
    """After qualification node — always moves to drafting (rejection handled externally)."""
    if state["status"] == "qualified":
        return "draft"
    return "qualify"  # stay


def route_after_sme(state: RFPState) -> str:
    """Check if all SME questions are resolved."""
    pending = [q for q in state["questions"] if q.get("needs_sme") and not q.get("sme_answer")]
    if pending:
        return "sme_collect"  # stay paused
    return "merge_sme"


# ── Graph builder ─────────────────────────────────────────────────────────────

def build_rfp_graph() -> StateGraph:
    """Construct and compile the full RFP LangGraph state machine."""
    graph = StateGraph(RFPState)

    # Add all nodes
    graph.add_node("parse", node_parse)
    graph.add_node("draft", node_draft)
    graph.add_node("sme_collect", node_sme_collect)
    graph.add_node("merge_sme", node_merge_sme)
    graph.add_node("critique", node_critique)
    graph.add_node("human_review", node_human_review)

    # Set entry point
    graph.set_entry_point("parse")

    # Auto-proceed: parse → draft (no manual Go/No-Go gate)
    graph.add_edge("parse", "draft")

    graph.add_conditional_edges(
        "draft",
        route_after_draft,
        {"sme_collect": "sme_collect", "critique": "critique"},
    )

    graph.add_conditional_edges(
        "sme_collect",
        route_after_sme,
        {"sme_collect": END, "merge_sme": "merge_sme"},
    )

    graph.add_edge("merge_sme", "critique")
    graph.add_edge("critique", "human_review")
    graph.add_edge("human_review", END)

    return graph.compile()
