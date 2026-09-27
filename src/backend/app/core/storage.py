import json
import mimetypes
import re
import uuid
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
from fastapi import HTTPException, UploadFile, status
from app.core.config import settings

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}
ALLOWED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".flac", ".m4a", ".ogg"}

ALLOWED_EXTENSIONS = ALLOWED_IMAGE_EXTENSIONS | ALLOWED_VIDEO_EXTENSIONS | ALLOWED_AUDIO_EXTENSIONS

def sanitize_filename(filename: str) -> str:
    """Removes path separators and dangerous characters from filename."""
    name = Path(filename).name
    name = re.sub(r'[^a-zA-Z0-9_.-]', '_', name)
    return name or "unnamed_media"

def get_media_type_from_ext(extension: str) -> str:
    ext = extension.lower()
    if ext in ALLOWED_IMAGE_EXTENSIONS:
        return "image"
    if ext in ALLOWED_VIDEO_EXTENSIONS:
        return "video"
    if ext in ALLOWED_AUDIO_EXTENSIONS:
        return "audio"
    return "unknown"

def validate_media_file(filename: str, file_size: Optional[int] = None) -> Tuple[str, str]:
    if ".." in filename or filename.startswith("/") or filename.startswith("\\"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Illegal filename path attempt"
        )
    sanitized = sanitize_filename(filename)
    ext = Path(sanitized).suffix.lower()
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported media format '{ext}'. Allowed formats: {sorted(list(ALLOWED_EXTENSIONS))}"
        )
        
    if file_size is not None:
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if file_size > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum limit of {settings.MAX_UPLOAD_SIZE_MB}MB"
            )
            
    media_type = get_media_type_from_ext(ext)
    return sanitized, media_type

def get_safe_path(base_dir: Path, filename: str) -> Path:
    """Prevents directory traversal and ensures file remains within base_dir."""
    if ".." in filename or filename.startswith("/") or filename.startswith("\\"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Illegal path traversal attempt detected"
        )
    clean_name = sanitize_filename(filename)
    target_path = (base_dir / clean_name).resolve()
    base_resolved = base_dir.resolve()
    if not str(target_path).startswith(str(base_resolved)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Illegal path traversal attempt detected"
        )
    return target_path

async def save_uploaded_file(upload_file: UploadFile, case_id: str) -> Tuple[Path, str, str, int]:
    sanitized, media_type = validate_media_file(upload_file.filename or "uploaded_media")
    ext = Path(sanitized).suffix.lower()
    safe_stored_name = f"{case_id}_{uuid.uuid4().hex[:8]}{ext}"
    target_path = get_safe_path(settings.upload_path, safe_stored_name)
    
    bytes_read = 0
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    
    with open(target_path, "wb") as buffer:
        while chunk := await upload_file.read(1024 * 1024):
            bytes_read += len(chunk)
            if bytes_read > max_bytes:
                target_path.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB"
                )
            buffer.write(chunk)
            
    return target_path, sanitized, media_type, bytes_read

def save_json(file_path: Path, data: Dict[str, Any]) -> None:
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)

def load_json(file_path: Path) -> Dict[str, Any]:
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def get_case_file_path(case_id: str) -> Path:
    safe_case_id = re.sub(r'[^a-zA-Z0-9_-]', '', case_id)
    # Check if case exists in case_dir/safe_case_id/case.json or safe_case_id.json
    nested_path = settings.case_path / safe_case_id / "case.json"
    if nested_path.exists():
        return nested_path
    return get_safe_path(settings.case_path, f"{safe_case_id}.json")

def get_case_dir(case_id: str) -> Path:
    safe_case_id = re.sub(r'[^a-zA-Z0-9_-]', '', case_id)
    target = settings.case_path / safe_case_id
    target.mkdir(parents=True, exist_ok=True)
    return target

def get_case_explanations_dir(case_id: str) -> Path:
    target = get_case_dir(case_id) / "explanations"
    target.mkdir(parents=True, exist_ok=True)
    return target

def get_case_frames_dir(case_id: str) -> Path:
    target = get_case_dir(case_id) / "frames"
    target.mkdir(parents=True, exist_ok=True)
    return target

def get_report_file_path(case_id: str, extension: str = "pdf") -> Path:
    safe_case_id = re.sub(r'[^a-zA-Z0-9_-]', '', case_id)
    clean_ext = extension.lstrip(".")
    return get_safe_path(settings.report_path, f"report_{safe_case_id}.{clean_ext}")
