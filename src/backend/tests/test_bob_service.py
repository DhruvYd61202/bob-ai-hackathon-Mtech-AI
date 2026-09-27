import pytest
from unittest.mock import patch, MagicMock
from app.bob.config import is_bob_configured, get_active_bob_key
from app.bob.schemas import BobEvidencePackage, BobReportOutput
from app.bob.validator import ReportValidator, BobValidationError
from app.bob.service import BobForensicService

def test_bob_config_detection():
    with patch("app.bob.config.IBM_BOB_API_KEY", "PASTE_YOUR_IBM_BOB_API_KEY_HERE"):
        with patch.dict("os.environ", {}, clear=True):
            assert is_bob_configured() is False
            assert get_active_bob_key() == ""

    with patch("app.bob.config.IBM_BOB_API_KEY", "valid_test_api_key_12345"):
        assert is_bob_configured() is True
        assert get_active_bob_key() == "valid_test_api_key_12345"

def test_report_validator_success():
    valid_payload = {
        "case_summary": "Test case summary.",
        "overall_forensic_assessment": "Assessed as authentic with high confidence.",
        "verdict_statement": "Authentic digital media.",
        "visual_forensic_analysis": "ViT shows natural textures.",
        "audio_forensic_analysis": "Wav2Vec2 confirms natural acoustics.",
        "temporal_forensic_analysis": "No temporal jitter observed.",
        "synchronization_analysis": "Speech aligns with facial gestures.",
        "metadata_forensic_analysis": "Standard camera metadata intact.",
        "conflicting_evidence_analysis": "None.",
        "limitations_and_caveats": ["Standard compression limits apply."],
        "forensic_recommendations": ["Archived for baseline."],
        "confidence_assessment": "95% statistical confidence.",
        "chain_of_custody_notes": "Cryptographic chain verified."
    }
    validated = ReportValidator.parse_and_validate(valid_payload)
    assert isinstance(validated, BobReportOutput)
    assert validated.verdict_statement == "Authentic digital media."

def test_report_validator_markdown_json_wrap():
    raw_str = """```json
    {
        "case_summary": "Wrapped JSON summary.",
        "overall_forensic_assessment": "Assessment details.",
        "verdict_statement": "Potential manipulation.",
        "visual_forensic_analysis": "Visual details.",
        "audio_forensic_analysis": "Audio details.",
        "temporal_forensic_analysis": "Temporal details.",
        "synchronization_analysis": "Sync details.",
        "metadata_forensic_analysis": "Metadata details.",
        "conflicting_evidence_analysis": "None.",
        "limitations_and_caveats": [],
        "forensic_recommendations": [],
        "confidence_assessment": "Moderate confidence.",
        "chain_of_custody_notes": "All signatures matched."
    }
    ```"""
    validated = ReportValidator.parse_and_validate(raw_str)
    assert isinstance(validated, BobReportOutput)
    assert validated.verdict_statement == "Potential manipulation."

def test_report_validator_missing_fields_raises_error():
    invalid_payload = {"case_summary": "Incomplete payload"}
    with pytest.raises(BobValidationError) as excinfo:
        ReportValidator.parse_and_validate(invalid_payload)
    assert "Missing or invalid fields" in str(excinfo.value)

def test_bob_service_unconfigured_returns_none():
    service = BobForensicService()
    pkg = BobEvidencePackage(
        case_id="case-123",
        media_name="test.jpg",
        media_type="image",
        file_sha256="abc",
        file_size_bytes=1000,
        verdict="authentic",
        confidence=0.9,
        risk_level="low"
    )
    with patch.object(service, "is_configured", return_value=False):
        report = service.generate_forensic_report_sync(pkg)
        assert report is None

def test_bob_service_mock_api_success():
    service = BobForensicService()
    pkg = BobEvidencePackage(
        case_id="case-123",
        media_name="test.jpg",
        media_type="image",
        file_sha256="abc",
        file_size_bytes=1000,
        verdict="potentially_manipulated",
        confidence=0.92,
        risk_level="high"
    )

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [{
            "message": {
                "content": """{
                    "case_summary": "Manipulated face synthesis.",
                    "overall_forensic_assessment": "ViT detected synthetic patch boundaries.",
                    "verdict_statement": "Potentially Manipulated Media.",
                    "visual_forensic_analysis": "Rollout attention highlights generative artifacts.",
                    "audio_forensic_analysis": "N/A for static image.",
                    "temporal_forensic_analysis": "N/A",
                    "synchronization_analysis": "N/A",
                    "metadata_forensic_analysis": "Exif stripped.",
                    "conflicting_evidence_analysis": "None.",
                    "limitations_and_caveats": ["Lossy compression"],
                    "forensic_recommendations": ["Secondary verification"],
                    "confidence_assessment": "High confidence (92%).",
                    "chain_of_custody_notes": "Chain unbroken."
                }"""
            }
        }]
    }

    with patch.object(service, "is_configured", return_value=True):
        with patch("httpx.Client.post", return_value=mock_response):
            report = service.generate_forensic_report_sync(pkg)
            assert report is not None
            assert isinstance(report, BobReportOutput)
            assert report.verdict_statement == "Potentially Manipulated Media."

def test_bob_service_fallback_to_embedded_report_when_remote_fails():
    import httpx
    service = BobForensicService()
    pkg = BobEvidencePackage(
        case_id="case-fallback-999",
        media_name="suspect_manipulation.mp4",
        media_type="video",
        file_sha256="9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
        file_size_bytes=5242880,
        verdict="deepfake",
        confidence=0.965,
        risk_level="critical",
        scores={"visual": 0.94, "audio": 0.89, "temporal": 0.78, "metadata": 0.2, "sync": 0.85},
        sync_analysis={"correlation": 0.12, "lag_seconds": 0.35, "is_anomalous": True, "available": True},
        temporal_analysis={"temporal_risk_score": 0.78, "peak_frame_index": 14, "anomalous_frames": [12, 14, 15]}
    )

    with patch.object(service, "is_configured", return_value=True):
        with patch("httpx.Client.post", side_effect=httpx.ConnectError("Remote endpoint unreachable")):
            report = service.generate_forensic_report_sync(pkg)
            assert report is not None
            assert isinstance(report, BobReportOutput)
            assert "DEEPFAKE" in report.verdict_statement
            assert "suspect_manipulation.mp4" in report.case_summary
            assert "Vision Transformer" in report.visual_forensic_analysis
            assert "Wav2Vec" in report.audio_forensic_analysis
            assert "desynchronization" in report.synchronization_analysis
            assert len(report.forensic_recommendations) > 0
            assert len(report.limitations_and_caveats) > 0

@pytest.mark.asyncio
async def test_bob_health_check_operational_when_configured():
    service = BobForensicService()
    with patch.object(service, "is_configured", return_value=True):
        status = await service.health_check()
        assert status["configured"] is True
        assert status["reachable"] is True
        assert "IBM Bob ready" in status["status_message"] or "ready" in status["status_message"]
