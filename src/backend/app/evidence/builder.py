from typing import Any, Dict, List, Optional
from app.evidence.schema import EvidenceCategory, EvidenceCollection, EvidenceItem, SeverityLevel

class EvidenceBuilder:
    def __init__(self, case_id: str):
        self.case_id = case_id
        self._items: List[EvidenceItem] = []
        self._counter = 1

    def _next_id(self, category: str) -> str:
        cid = f"EV-{category.upper()[:3]}-{self._counter:03d}"
        self._counter += 1
        return cid

    def add_evidence(
        self,
        category: EvidenceCategory,
        title: str,
        description: str,
        severity: SeverityLevel = "info",
        confidence: float = 0.5,
        source: str = "ForensicPipeline",
        timestamp: Optional[float] = None,
        frame_number: Optional[int] = None,
        location: Optional[Dict[str, Any]] = None,
        technical_details: Optional[Dict[str, Any]] = None,
        model_name: Optional[str] = None,
        model_id: Optional[str] = None,
        model_version: Optional[str] = None
    ) -> EvidenceItem:
        confidence_clamped = max(0.0, min(1.0, float(confidence)))
        item = EvidenceItem(
            id=self._next_id(category),
            category=category,
            title=title,
            description=description,
            severity=severity,
            confidence=round(confidence_clamped, 3),
            source=source,
            timestamp=timestamp,
            frame_number=frame_number,
            location=location,
            technical_details=technical_details or {},
            model_name=model_name,
            model_id=model_id,
            model_version=model_version
        )
        self._items.append(item)
        return item

    def add_ai_model_evidence(
        self,
        model_name: str,
        model_id: str,
        fake_probability: float,
        title: str,
        description: str,
        category: EvidenceCategory = "model",
        frame_number: Optional[int] = None,
        timestamp: Optional[float] = None,
        confidence: Optional[float] = None,
        model_version: str = "1.0.0",
        technical_details: Optional[Dict[str, Any]] = None
    ) -> EvidenceItem:
        if fake_probability >= 0.75:
            severity = "critical" if fake_probability >= 0.90 else "high"
        elif fake_probability >= 0.50:
            severity = "medium"
        else:
            severity = "low" if fake_probability >= 0.25 else "info"

        conf = confidence if confidence is not None else max(fake_probability, 1.0 - fake_probability)
        tech = technical_details or {}
        tech.update({
            "model_name": model_name,
            "model_id": model_id,
            "model_version": model_version,
            "fake_probability": round(fake_probability, 4),
            "confidence": round(conf, 4)
        })

        return self.add_evidence(
            category=category,
            title=title,
            description=description,
            severity=severity,
            confidence=conf,
            source=model_name,
            frame_number=frame_number,
            timestamp=timestamp,
            technical_details=tech,
            model_name=model_name,
            model_id=model_id,
            model_version=model_version
        )

    def add_metadata_evidence(
        self,
        title: str,
        description: str,
        severity: SeverityLevel = "info",
        confidence: float = 0.8,
        technical_details: Optional[Dict[str, Any]] = None
    ) -> EvidenceItem:
        return self.add_evidence(
            category="metadata",
            title=title,
            description=description,
            severity=severity,
            confidence=confidence,
            source="MetadataParser",
            technical_details=technical_details
        )

    def add_visual_evidence(
        self,
        title: str,
        description: str,
        severity: SeverityLevel = "low",
        confidence: float = 0.7,
        frame_number: Optional[int] = None,
        technical_details: Optional[Dict[str, Any]] = None
    ) -> EvidenceItem:
        return self.add_evidence(
            category="visual",
            title=title,
            description=description,
            severity=severity,
            confidence=confidence,
            source="VisualAnalyzer",
            frame_number=frame_number,
            technical_details=technical_details
        )

    def add_face_evidence(
        self,
        title: str,
        description: str,
        severity: SeverityLevel = "low",
        confidence: float = 0.75,
        frame_number: Optional[int] = None,
        location: Optional[Dict[str, Any]] = None,
        technical_details: Optional[Dict[str, Any]] = None
    ) -> EvidenceItem:
        return self.add_evidence(
            category="face",
            title=title,
            description=description,
            severity=severity,
            confidence=confidence,
            source="FaceDetector",
            frame_number=frame_number,
            location=location,
            technical_details=technical_details
        )

    def add_audio_evidence(
        self,
        title: str,
        description: str,
        severity: SeverityLevel = "low",
        confidence: float = 0.7,
        timestamp: Optional[float] = None,
        technical_details: Optional[Dict[str, Any]] = None
    ) -> EvidenceItem:
        return self.add_evidence(
            category="audio",
            title=title,
            description=description,
            severity=severity,
            confidence=confidence,
            source="AudioAnalyzer",
            timestamp=timestamp,
            technical_details=technical_details
        )

    def add_temporal_evidence(
        self,
        title: str,
        description: str,
        severity: SeverityLevel = "low",
        confidence: float = 0.7,
        technical_details: Optional[Dict[str, Any]] = None
    ) -> EvidenceItem:
        return self.add_evidence(
            category="temporal",
            title=title,
            description=description,
            severity=severity,
            confidence=confidence,
            source="TemporalAggregator",
            technical_details=technical_details
        )

    def build(self) -> List[EvidenceItem]:
        return list(self._items)

    def get_collection(self) -> EvidenceCollection:
        breakdown: Dict[str, int] = {}
        for it in self._items:
            breakdown[it.severity] = breakdown.get(it.severity, 0) + 1
        return EvidenceCollection(
            items=list(self._items),
            total_count=len(self._items),
            severity_breakdown=breakdown
        )

    def get_evidence(self) -> List[EvidenceItem]:
        return self.build()