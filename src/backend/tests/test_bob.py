import pytest
from app.bob.service import bob_service

@pytest.mark.asyncio
async def test_bob_not_fabricating_evidence():
    # Case with no evidence
    clean_case = {
        "case_id": "test-clean-case",
        "filename": "camera_photo.jpg",
        "media_type": "image",
        "analysis_result": {
            "prediction": {"label": "authentic", "confidence": 0.88, "risk_level": "low"},
            "scores": {"visual": 0.1, "audio": 0.0, "metadata": 0.1, "temporal": 0.0, "fusion": 0.1},
            "limitations": ["Automated indicators require human review."]
        },
        "evidence": []
    }

    # Query about evidence
    res = await bob_service.answer_query(clean_case, "What evidence was found?")
    assert "No suspicious forensic indicators" in res["answer"]
    assert res["citations"] == []

@pytest.mark.asyncio
async def test_bob_evidence_grounded_response():
    # Case with specific fabricated noise finding
    flagged_case = {
        "case_id": "test-flagged-case",
        "filename": "deepfake_video.mp4",
        "media_type": "video",
        "analysis_result": {
            "prediction": {"label": "potentially_manipulated", "confidence": 0.84, "risk_level": "high"},
            "scores": {"visual": 0.7, "audio": 0.0, "metadata": 0.3, "temporal": 0.8, "fusion": 0.76},
            "limitations": ["Video codec compression may alter noise profile."]
        },
        "evidence": [
            {
                "id": "EV-TEM-001",
                "category": "temporal",
                "title": "Facial Intermittent Discontinuity / Flickering",
                "description": "Facial region dropped and reappeared 4 times across sampled frames",
                "severity": "high",
                "confidence": 0.82,
                "frame_number": 14
            }
        ]
    }

    # Query why flagged
    res = await bob_service.answer_query(flagged_case, "Why was this file flagged?")
    assert "Facial Intermittent Discontinuity" in res["answer"]
    assert "EV-TEM-001" in res["citations"]

    # Query limitations
    lim_res = await bob_service.answer_query(flagged_case, "What are the limitations?")
    assert "compression" in lim_res["answer"].lower() or "limitations" in lim_res["answer"].lower()
