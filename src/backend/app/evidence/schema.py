from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

EvidenceCategory = Literal[
    "metadata", "visual", "face", "audio", "temporal", "compression", "model", "system"
]
SeverityLevel = Literal["info", "low", "medium", "high", "critical"]
PredictionLabel = Literal["authentic", "inconclusive", "potentially_manipulated"]
RiskLevel = Literal["low", "medium", "high"]

class EvidenceItem(BaseModel):
    id: str
    category: EvidenceCategory
    title: str
    description: str
    severity: SeverityLevel = "info"
    confidence: float = Field(ge=0.0, le=1.0)
    source: str
    timestamp: Optional[float] = None
    frame_number: Optional[int] = None
    location: Optional[Dict[str, Any]] = None
    technical_details: Optional[Dict[str, Any]] = None
    model_name: Optional[str] = None
    model_id: Optional[str] = None
    model_version: Optional[str] = None

class EvidenceCollection(BaseModel):
    items: List[EvidenceItem] = []
    total_count: int = 0
    severity_breakdown: Dict[str, int] = {}

class EvidenceGraphNode(BaseModel):
    id: str
    label: str
    type: str  # case, media, frame, face, model, prediction, explanation, signal, evidence, conclusion
    severity: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class EvidenceGraphEdge(BaseModel):
    source: str
    target: str
    relation: str

class EvidenceGraphData(BaseModel):
    nodes: List[EvidenceGraphNode]
    edges: List[EvidenceGraphEdge]

class ScoresResult(BaseModel):
    visual: float = Field(ge=0.0, le=1.0, default=0.0)
    audio: float = Field(ge=0.0, le=1.0, default=0.0)
    metadata: float = Field(ge=0.0, le=1.0, default=0.0)
    temporal: float = Field(ge=0.0, le=1.0, default=0.0)
    fusion: float = Field(ge=0.0, le=1.0, default=0.0)

class PredictionResult(BaseModel):
    label: PredictionLabel = "inconclusive"
    confidence: float = Field(ge=0.0, le=1.0, default=0.0)
    risk_level: RiskLevel = "low"

class ForensicResult(BaseModel):
    case_id: str
    media: Dict[str, Any] = {}
    prediction: PredictionResult
    scores: ScoresResult
    metadata: Dict[str, Any] = {}
    faces: Dict[str, Any] = {}
    audio: Dict[str, Any] = {}
    visual: Dict[str, Any] = {}
    temporal: Dict[str, Any] = {}
    sync_analysis: Optional[Dict[str, Any]] = None
    chain_of_custody: Optional[Dict[str, Any]] = None
    bob_status: Optional[str] = "unavailable"
    bob_report: Optional[Dict[str, Any]] = None
    bob_message: Optional[str] = None
    evidence: List[EvidenceItem] = []
    evidence_graph: Dict[str, Any] = {}
    bob_explanation: str = ""
    limitations: List[str] = []
    model_status: str = "loaded"
    models_provenance: Optional[Dict[str, Any]] = None
    explanations: Optional[Dict[str, Any]] = None
    top_suspicious_frames: Optional[List[Dict[str, Any]]] = None

class CaseModel(BaseModel):
    case_id: str
    created_at: str
    filename: str
    media_type: str
    file_size: int
    status: str = "uploaded"  # uploaded, analyzing, completed, failed
    stored_path: Optional[str] = None
    risk_level: str = "low"
    prediction_label: Optional[str] = None
    confidence: Optional[float] = None
    analysis_result: Optional[Dict[str, Any]] = None
    evidence: Optional[List[Dict[str, Any]]] = None
    sync_analysis: Optional[Dict[str, Any]] = None
    chain_of_custody: Optional[Dict[str, Any]] = None
    bob_status: Optional[str] = "unavailable"
    bob_report: Optional[Dict[str, Any]] = None
    bob_message: Optional[str] = None
    error_message: Optional[str] = None