"""
Tests for the RFP API endpoints and core agents.
Run with: pytest backend/tests/ -v
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
import uuid


# ── Agent unit tests ──────────────────────────────────────────────────────────

class TestParserAgent:
    def test_mock_parse_returns_questions(self):
        import asyncio
        from app.agents.parser_agent import parse_rfp

        raw = "This is an RFP with various requirements and questions for vendors."
        result = asyncio.get_event_loop().run_until_complete(parse_rfp(raw))

        assert isinstance(result, list)
        assert len(result) >= 1
        for q in result:
            assert "id" in q
            assert "text" in q
            assert "sort_order" in q

    def test_mock_parse_question_structure(self):
        import asyncio
        from app.agents.parser_agent import parse_rfp

        result = asyncio.get_event_loop().run_until_complete(parse_rfp("short text"))
        assert all(isinstance(q["text"], str) for q in result)
        assert all(q["needs_sme"] is False for q in result)


class TestCopywriterAgent:
    def test_mock_draft_returns_complete_structure(self):
        import asyncio
        from app.agents.copywriter_agent import draft_answer

        question = {"id": str(uuid.uuid4()), "text": "Describe your experience.", "sort_order": 0}
        result = asyncio.get_event_loop().run_until_complete(
            draft_answer(question, [], "professional", 0)
        )

        assert "draft" in result
        assert "confidence" in result
        assert "needs_sme" in result
        assert "sme_question" in result
        assert isinstance(result["confidence"], float)
        assert 0.0 <= result["confidence"] <= 1.0

    def test_mock_draft_sme_flagging(self):
        import asyncio
        from app.agents.copywriter_agent import draft_answer

        # Question at index 3 should flag for SME (pricing question)
        question = {"id": str(uuid.uuid4()), "text": "What is your pricing?", "sort_order": 3}
        result = asyncio.get_event_loop().run_until_complete(
            draft_answer(question, [], "professional", 3)
        )
        assert result["needs_sme"] is True


class TestCriticAgent:
    def test_mock_critic_report_structure(self):
        import asyncio
        from app.agents.critic_agent import critique_proposal

        questions = [
            {"text": "Question 1", "draft": "Answer 1"},
            {"text": "Question 2", "draft": "Answer 2"},
        ]
        result = asyncio.get_event_loop().run_until_complete(critique_proposal(questions))

        assert "win_probability" in result
        assert "completeness" in result
        assert "persuasiveness" in result
        assert "compliance" in result
        assert "suggestions" in result
        assert "critical_flags" in result

        assert 0 <= result["win_probability"] <= 100
        assert 0 <= result["completeness"] <= 100
        assert isinstance(result["suggestions"], list)


class TestDesignAgent:
    def test_build_default_ppt(self):
        from app.agents.design_agent import build_ppt

        questions = [
            {"text": "Q1", "draft": "Answer 1", "confidence": 0.9, "final_answer": "Final 1"},
            {"text": "Q2", "draft": "Answer 2", "confidence": 0.7, "final_answer": "Final 2"},
        ]
        critic = {
            "win_probability": 80,
            "completeness": 85,
            "persuasiveness": 75,
            "compliance": 90,
            "suggestions": ["Improve X", "Add Y"],
            "critical_flags": [],
        }

        result = build_ppt(questions=questions, title="Test RFP", critic_report=critic)
        assert isinstance(result, bytes)
        assert len(result) > 1000  # Should produce a non-trivial file


class TestExportService:
    def test_export_word(self):
        from app.services.export_service import export_word

        questions = [
            {"text": "Question 1", "draft": "Draft answer", "confidence": 0.85, "final_answer": "Final answer"},
        ]
        result = export_word("Test RFP", questions)
        assert isinstance(result, bytes)
        assert len(result) > 0

    def test_export_sheets(self):
        from app.services.export_service import export_sheets

        questions = [
            {"text": "Question 1", "draft_answer": "Draft", "confidence": 0.9, "needs_sme": False, "final_answer": "Final"},
        ]
        result = export_sheets("Test RFP", questions)
        assert isinstance(result, bytes)
        assert len(result) > 0

    def test_export_ppt(self):
        from app.services.export_service import export_ppt

        questions = [{"text": "Q1", "draft": "A1", "confidence": 0.8, "final_answer": "A1"}]
        result = export_ppt("Test", questions)
        assert isinstance(result, bytes)


class TestComplianceAgent:
    def test_mock_compliance_check(self):
        import asyncio
        from app.agents.compliance_agent import check_compliance

        questions = [
            {"text": "HIPAA?", "draft": "We maintain HIPAA BAA and SOC 2 Type II certification."},
            {"text": "Security?", "draft": "We use AES-256 encryption at rest and in transit."},
        ]
        result = asyncio.get_event_loop().run_until_complete(check_compliance(questions))

        assert "passed" in result
        assert "warnings" in result
        assert "score" in result
        assert isinstance(result["score"], int)


# ── Graph unit tests ──────────────────────────────────────────────────────────

class TestRFPGraph:
    def test_graph_builds_without_error(self):
        from app.graph.rfp_graph import build_rfp_graph
        graph = build_rfp_graph()
        assert graph is not None

    def test_initial_state_structure(self):
        from app.graph.rfp_graph import RFPState
        state: RFPState = {
            "rfp_id": str(uuid.uuid4()),
            "org_id": str(uuid.uuid4()),
            "status": "uploaded",
            "raw_text": "Sample RFP text",
            "questions": [],
            "critic_report": None,
            "export_format": None,
            "brand_voice": "professional",
            "error": None,
        }
        assert state["status"] == "uploaded"
        assert state["questions"] == []


# ── Config tests ──────────────────────────────────────────────────────────────

class TestConfig:
    def test_settings_load(self):
        from app.core.config import settings
        assert settings.app_name == "RFP Automation API"
        assert settings.jwt_algorithm == "HS256"

    def test_use_real_llm_false_without_key(self):
        from app.core.config import settings
        # In test env, ANTHROPIC_API_KEY is not set
        # use_real_llm should be False
        if not settings.anthropic_api_key:
            assert settings.use_real_llm is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
