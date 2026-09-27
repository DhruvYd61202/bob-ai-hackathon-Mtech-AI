from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class BobEvidencePackage(BaseModel):
    """
    Structured evidence package ingested by IBM Bob to synthesize
    a courtroom-ready digital forensic investigation report.
    """
    case_id: str
    media_name: str
    media_type: str
    file_sha256: str
    file_size_bytes: int
    verdict: str
    confidence: float = Field(ge=0.0, le=1.0)
    risk_level: str
    scores: Dict[str, float] = {}
    ai_models_used: List[Dict[str, str]] = []
    face_analysis: Optional[Dict[str, Any]] = None
    visual_analysis: Optional[Dict[str, Any]] = None
    audio_analysis: Optional[Dict[str, Any]] = None
    temporal_analysis: Optional[Dict[str, Any]] = None
    sync_analysis: Optional[Dict[str, Any]] = None
    metadata_analysis: Optional[Dict[str, Any]] = None
    top_evidence_items: List[Dict[str, Any]] = []
    limitations: List[str] = []
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BobReportOutput(BaseModel):
    """
    Standardized, structured report output returned by IBM Bob.
    Strictly parsed and validated against this schema.
    """
    case_summary: str
    overall_forensic_assessment: str
    verdict_statement: str
    visual_forensic_analysis: str
    audio_forensic_analysis: str
    temporal_forensic_analysis: str
    synchronization_analysis: str
    metadata_forensic_analysis: str
    conflicting_evidence_analysis: str
    limitations_and_caveats: List[str] = []
    forensic_recommendations: List[str] = []
    confidence_assessment: str
    chain_of_custody_notes: str
    generated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    model_id: str = "ibm-bob-forensic-v1"
    is_valid: bool = True

class BobStatusResponse(BaseModel):
    """IBM Bob service availability and health status."""
    configured: bool
    reachable: bool
    service: str = "IBM Bob"
    status_message: str
    model: str
    endpoint: str
