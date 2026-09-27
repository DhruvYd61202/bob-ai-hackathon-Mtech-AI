from typing import Any, Dict
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.bob.service import bob_service
from app.bob.schemas import BobStatusResponse, BobReportOutput, BobEvidencePackage
from app.core.storage import get_case_file_path, load_json, save_json

router = APIRouter(prefix="/api/bob", tags=["BOB Assistant"])

class BobChatRequest(BaseModel):
    message: str

class BobChatResponse(BaseModel):
    case_id: str
    query: str
    answer: str
    source: str
    citations: list

@router.get("/status", response_model=BobStatusResponse)
async def get_bob_status():
    """Returns the operational status, reachability, and configuration of IBM Bob."""
    status_data = await bob_service.health_check()
    return BobStatusResponse(**status_data)

@router.post("/chat/{case_id}", response_model=BobChatResponse)
async def chat_with_bob(case_id: str, payload: BobChatRequest):
    case_dict = load_json(get_case_file_path(case_id))
    if not payload.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chat message query cannot be empty"
        )

    response = await bob_service.answer_query(case_dict, payload.message)
    return BobChatResponse(
        case_id=case_id,
        query=payload.message,
        answer=response.get("answer", ""),
        source=response.get("source", "BOB Local Engine"),
        citations=response.get("citations", [])
    )

@router.get("/summary/{case_id}")
async def get_bob_summary(case_id: str):
    case_dict = load_json(get_case_file_path(case_id))
    response = await bob_service.answer_query(case_dict, "Generate investigator summary")
    return response

@router.post("/generate-report/{case_id}")
async def generate_bob_report_for_case(case_id: str):
    """
    Explicitly requests IBM Bob to synthesize a courtroom-ready forensic report for an existing case.
    If IBM Bob is unconfigured or unreachable, returns status with clear notice.
    """
    case_file = get_case_file_path(case_id)
    case_dict = load_json(case_file)
    analysis = case_dict.get("analysis_result") or {}
    pred = analysis.get("prediction") or {}
    scores = analysis.get("scores") or {}
    media = analysis.get("media") or {}

    pkg = BobEvidencePackage(
        case_id=case_id,
        media_name=case_dict.get("filename", "unknown"),
        media_type=case_dict.get("media_type", "unknown"),
        file_sha256=media.get("sha256", ""),
        file_size_bytes=case_dict.get("file_size", 0),
        verdict=pred.get("label", "inconclusive"),
        confidence=pred.get("confidence", 0.5),
        risk_level=pred.get("risk_level", "low"),
        scores=scores,
        face_analysis=analysis.get("faces"),
        visual_analysis=analysis.get("visual"),
        audio_analysis=analysis.get("audio"),
        temporal_analysis=analysis.get("temporal"),
        sync_analysis=analysis.get("sync_analysis"),
        metadata_analysis=analysis.get("metadata"),
        top_evidence_items=case_dict.get("evidence", [])[:5],
        limitations=analysis.get("limitations", [])
    )

    report = await bob_service.generate_forensic_report(pkg)
    if report:
        case_dict["bob_report"] = report.model_dump()
        case_dict["bob_status"] = "generated"
        case_dict["bob_message"] = "IBM Bob report successfully generated."
        save_json(case_file, case_dict)
        return {
            "status": "success",
            "bob_status": "generated",
            "report": report.model_dump()
        }
    else:
        case_dict["bob_status"] = "unavailable"
        case_dict["bob_message"] = "IBM Bob reporting service unavailable."
        save_json(case_file, case_dict)
        return {
            "status": "unavailable",
            "bob_status": "unavailable",
            "message": "IBM Bob reporting service unavailable. Set your API key in backend/app/bob/config.py."
        }
