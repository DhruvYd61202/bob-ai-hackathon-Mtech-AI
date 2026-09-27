from pathlib import Path
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, status
from app.core.config import settings
from app.core.storage import get_case_file_path, get_report_file_path, load_json

router = APIRouter(prefix="/api/cases", tags=["Cases"])

@router.get("")
@router.get("/")
async def list_cases() -> List[Dict[str, Any]]:
    cases: List[Dict[str, Any]] = []
    case_dir = settings.case_path
    for path in case_dir.glob("*.json"):
        try:
            data = load_json(path)
            ev = data.get("evidence") or []
            cases.append({
                "case_id": data.get("case_id"),
                "created_at": data.get("created_at"),
                "filename": data.get("filename"),
                "media_type": data.get("media_type"),
                "file_size": data.get("file_size"),
                "status": data.get("status"),
                "risk_level": data.get("risk_level", "low"),
                "prediction_label": data.get("prediction_label"),
                "confidence": data.get("confidence"),
                "evidence_count": len(ev)
            })
        except Exception:
            continue

    cases.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    return cases

@router.get("/{case_id}")
async def get_case(case_id: str) -> Dict[str, Any]:
    case_path = get_case_file_path(case_id)
    return load_json(case_path)

@router.delete("/{case_id}")
async def delete_case(case_id: str) -> Dict[str, Any]:
    case_path = get_case_file_path(case_id)
    case_dict = load_json(case_path)

    # Delete media upload file if present
    stored_path_str = case_dict.get("stored_path")
    if stored_path_str:
        p = Path(stored_path_str)
        if p.exists():
            p.unlink(missing_ok=True)

    # Delete json and pdf reports
    json_report = get_report_file_path(case_id, "json")
    if json_report.exists():
        json_report.unlink(missing_ok=True)

    pdf_report = get_report_file_path(case_id, "pdf")
    if pdf_report.exists():
        pdf_report.unlink(missing_ok=True)

    import shutil
    # Delete case json file
    if case_path.exists():
        case_path.unlink(missing_ok=True)

    flat_path = settings.case_path / f"{case_id}.json"
    if flat_path.exists():
        flat_path.unlink(missing_ok=True)

    # Delete case directory (frames, explanations)
    case_sub_dir = settings.case_path / case_id
    if case_sub_dir.exists() and case_sub_dir.is_dir():
        shutil.rmtree(case_sub_dir, ignore_errors=True)

    return {"status": "deleted", "case_id": case_id}
