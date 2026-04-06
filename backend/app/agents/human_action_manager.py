"""
Human Action Manager: manages human-in-the-loop checkpoints.
Tracks what's waiting for human input and routes responses back to the pipeline.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid


class HumanActionManager:
    """
    Tracks pending human actions. In production this would integrate with
    notifications (email / Slack). For now it's an in-memory record with
    DB-backed state.
    """

    @staticmethod
    def pending_actions_for_rfp(rfp_status: str, questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Return a list of pending human actions for this RFP."""
        actions = []

        if rfp_status == "qualification_needed":
            actions.append({
                "type": "qualification",
                "title": "Go / No-Go Decision Required",
                "description": "Review the parsed RFP and decide whether to proceed with a full proposal.",
                "priority": "high",
                "required": True,
            })

        if rfp_status in ("sme_needed", "drafting"):
            sme_questions = [q for q in questions if q.get("needs_sme") and not q.get("sme_answer")]
            for q in sme_questions:
                actions.append({
                    "type": "sme_answer",
                    "title": f"SME Input Required",
                    "description": q.get("text", ""),
                    "question_id": q.get("id"),
                    "priority": "medium",
                    "required": True,
                })

        if rfp_status == "human_review":
            actions.append({
                "type": "review",
                "title": "Final Proposal Review",
                "description": "Review all drafted answers and critic scores before export.",
                "priority": "high",
                "required": True,
            })

        return actions

    @staticmethod
    def format_qualification_prompt(rfp_title: str, questions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Build the Go/No-Go qualification prompt data."""
        return {
            "rfp_title": rfp_title,
            "question_count": len(questions),
            "sample_questions": [q["text"] for q in questions[:3]],
            "checklist": [
                "Is this RFP within our service offering?",
                "Do we have available capacity to respond by the deadline?",
                "Is the deal size worth the bid effort?",
                "Do we have relevant case studies/references?",
                "Is the client a good strategic fit?",
            ],
            "instruction": "Review the above and decide whether to proceed with the full proposal.",
        }
