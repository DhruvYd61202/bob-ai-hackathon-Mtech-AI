import datetime
import uuid
from pathlib import Path
from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from app.core.config import settings
from app.core.storage import (
    get_case_file_path,
    get_report_file_path,
    load_json,
    save_json,
    save_uploaded_file,
    validate_media_file,
)
from app.evidence.schema import CaseModel
from app.pipeline.deepfake_pipeline import pipeline
from app.reporting.pdf_generator import report_generator

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No filename provided")

    case_id = str(uuid.uuid4())
    stored_path, sanitized_name, media_type, file_size = await save_uploaded_file(file, case_id)

    case_data = CaseModel(
        case_id=case_id,
        created_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        filename=sanitized_name,
        media_type=media_type,
        file_size=file_size,
        status="uploaded",
        stored_path=str(stored_path),
        risk_level="unknown"
    )
    save_json(get_case_file_path(case_id), case_data.model_dump())

    return {
        "case_id": case_id,
        "filename": sanitized_name,
        "media_type": media_type,
        "file_size": file_size,
        "status": "uploaded"
    }

@router.post("/analyze/{case_id}")
async def analyze_case(case_id: str):
    case_path = get_case_file_path(case_id)
    case_dict = load_json(case_path)

    stored_path = Path(case_dict.get("stored_path", ""))
    if not stored_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target media file for case {case_id} not found on server"
        )

    case_dict["status"] = "analyzing"
    save_json(case_path, case_dict)

    try:
        result = pipeline.analyze_file(
            file_path=stored_path,
            case_id=case_id,
            filename=case_dict.get("filename", "unknown"),
            media_type=case_dict.get("media_type", "image")
        )

        case_dict["status"] = "completed"
        case_dict["analysis_result"] = result
        case_dict["evidence"] = result.get("evidence", [])
        case_dict["risk_level"] = result.get("prediction", {}).get("risk_level", "low")
        case_dict["prediction_label"] = result.get("prediction", {}).get("label")
        case_dict["confidence"] = result.get("prediction", {}).get("confidence")

        # Save updated case JSON
        save_json(case_path, case_dict)

        # Save standalone JSON Report
        json_report_path = get_report_file_path(case_id, "json")
        save_json(json_report_path, case_dict)

        # Generate and save PDF report
        pdf_report_path = get_report_file_path(case_id, "pdf")
        report_generator.generate_pdf(case_dict, pdf_report_path)

        return result

    except Exception as e:
        case_dict["status"] = "failed"
        case_dict["error_message"] = str(e)
        save_json(case_path, case_dict)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forensic pipeline analysis encountered an error: {str(e)}"
        )

@router.get("/models/status")
async def get_models_status():
    from app.models.model_manager import get_model_manager
    manager = get_model_manager()
    return manager.get_model_status()

@router.get("/{case_id}")
async def get_case_analysis(case_id: str):
    case_dict = load_json(get_case_file_path(case_id))
    return case_dict

@router.get("/{case_id}/evidence")
async def get_case_evidence(case_id: str):
    case_dict = load_json(get_case_file_path(case_id))
    evidence = case_dict.get("evidence") or []
    return {
        "case_id": case_id,
        "total_count": len(evidence),
        "evidence": evidence
    }

@router.get("/{case_id}/frames")
async def get_case_frames(case_id: str):
    case_dict = load_json(get_case_file_path(case_id))
    analysis = case_dict.get("analysis_result") or {}
    # Frame list might be stored in temporal or raw analysis
    frames = analysis.get("temporal", {}).get("frames") or analysis.get("frames") or []
    top_frames = analysis.get("top_suspicious_frames") or []
    return {
        "case_id": case_id,
        "total_frames": len(frames),
        "frames": frames,
        "top_suspicious_frames": top_frames
    }

@router.get("/{case_id}/explanations")
async def get_case_explanations(case_id: str):
    case_dict = load_json(get_case_file_path(case_id))
    analysis = case_dict.get("analysis_result") or {}
    explanations = analysis.get("explanations") or {}
    top_frames = analysis.get("top_suspicious_frames") or []
    return {
        "case_id": case_id,
        "explanations": explanations,
        "top_suspicious_frames": top_frames
    }

@router.get("/{case_id}/report")
async def get_case_report(case_id: str):
    json_path = get_report_file_path(case_id, "json")
    if not json_path.exists():
        case_dict = load_json(get_case_file_path(case_id))
        if case_dict.get("status") != "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Case analysis is not yet completed"
            )
        save_json(json_path, case_dict)
    return load_json(json_path)

@router.get("/{case_id}/report/pdf")
async def get_case_report_pdf(case_id: str):
    pdf_path = get_report_file_path(case_id, "pdf")
    if not pdf_path.exists():
        case_dict = load_json(get_case_file_path(case_id))
        if case_dict.get("status") != "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Case analysis is not yet completed"
            )
        report_generator.generate_pdf(case_dict, pdf_path)

    return FileResponse(
        path=str(pdf_path),
        filename=f"DeepFake_ForensicAI_Report_{case_id[:8]}.pdf",
        media_type="application/pdf"
    )

@router.get("/{case_id}/status")
async def get_case_status(case_id: str):
    case_dict = load_json(get_case_file_path(case_id))
    return {
        "case_id": case_id,
        "status": case_dict.get("status", "unknown"),
        "risk_level": case_dict.get("risk_level", "unknown"),
        "prediction_label": case_dict.get("prediction_label"),
        "confidence": case_dict.get("confidence"),
        "bob_status": case_dict.get("bob_status", "unavailable")
    }

@router.get("/{case_id}/custody")
async def get_case_custody(case_id: str):
    case_dict = load_json(get_case_file_path(case_id))
    custody = case_dict.get("chain_of_custody") or {}
    return {
        "case_id": case_id,
        "chain_of_custody": custody
    }

@router.get("/{case_id}/download-report")
async def download_case_report(case_id: str):
    """Direct alias for downloading the PDF report."""
    return await get_case_report_pdf(case_id)

@router.post("/{case_id}/generate-report")
async def generate_case_report(case_id: str):
    case_path = get_case_file_path(case_id)
    case_dict = load_json(case_path)
    pdf_path = get_report_file_path(case_id, "pdf")
    json_path = get_report_file_path(case_id, "json")
    save_json(json_path, case_dict)
    report_generator.generate_pdf(case_dict, pdf_path)
    return {
        "status": "success",
        "case_id": case_id,
        "pdf_path": str(pdf_path),
        "json_path": str(json_path)
    }
