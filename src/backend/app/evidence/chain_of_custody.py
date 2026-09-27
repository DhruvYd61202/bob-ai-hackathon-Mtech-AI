from datetime import datetime, timezone
import hashlib
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class CustodyEvent(BaseModel):
    event_id: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    event_type: str  # INGESTION, PREPROCESSING, MODEL_EXECUTION, FUSION, BOB_REPORTING, EXPORT
    actor_or_component: str
    description: str
    device: Optional[str] = None
    input_hash: Optional[str] = None
    output_hash: Optional[str] = None
    metadata: Dict[str, Any] = {}
    previous_event_hash: Optional[str] = None
    event_signature: Optional[str] = None

class ChainOfCustodyLedger:
    """
    Maintains a cryptographically chained, immutable audit trail for forensic evidence,
    model invocations, and IBM Bob reporting events.
    """
    def __init__(self, case_id: str, media_sha256: str = ""):
        self.case_id = case_id
        self.media_sha256 = media_sha256
        self.created_at = datetime.now(timezone.utc).isoformat()
        self.events: List[CustodyEvent] = []

    def _compute_event_hash(self, event_dict: Dict[str, Any], prev_hash: str) -> str:
        serialized = json.dumps(event_dict, sort_keys=True) + prev_hash
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def add_event(
        self,
        event_type: str,
        actor: str,
        description: str,
        device: Optional[str] = None,
        input_hash: Optional[str] = None,
        output_hash: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> CustodyEvent:
        prev_hash = self.events[-1].event_signature if self.events else "GENESIS_BLOCK"
        event_id = f"EVT-{len(self.events) + 1:04d}"
        meta = metadata or {}

        raw_event = {
            "event_id": event_id,
            "event_type": event_type,
            "actor_or_component": actor,
            "description": description,
            "device": device,
            "input_hash": input_hash,
            "output_hash": output_hash,
            "metadata": meta,
            "previous_event_hash": prev_hash
        }

        signature = self._compute_event_hash(raw_event, prev_hash)
        custody_evt = CustodyEvent(
            **raw_event,
            event_signature=signature
        )
        self.events.append(custody_evt)
        return custody_evt

    def record_ingestion(self, filename: str, file_size: int, sha256: str, md5: str):
        self.media_sha256 = sha256
        return self.add_event(
            event_type="INGESTION",
            actor="StorageManager",
            description=f"Ingested media '{filename}' ({file_size:,} bytes) with cryptographic validation.",
            input_hash=sha256,
            metadata={"filename": filename, "file_size": file_size, "sha256": sha256, "md5": md5}
        )

    def record_preprocessing(self, description: str, details: Dict[str, Any]):
        return self.add_event(
            event_type="PREPROCESSING",
            actor="MediaPreprocessor",
            description=description,
            metadata=details
        )

    def record_model_execution(
        self,
        model_name: str,
        model_id: str,
        device: str,
        duration_ms: float,
        details: Dict[str, Any]
    ):
        return self.add_event(
            event_type="MODEL_EXECUTION",
            actor=model_name,
            description=f"Executed neural inference using {model_id} on {device.upper()} in {duration_ms:.1f}ms.",
            device=device,
            metadata={"model_id": model_id, "duration_ms": duration_ms, **details}
        )

    def record_fusion(self, verdict: str, confidence: float, risk_level: str, weights: Dict[str, float]):
        return self.add_event(
            event_type="FUSION",
            actor="MultimodalFusionEngine",
            description=f"Synthesized evidence channels into final verdict: {verdict} ({confidence:.1%}, risk: {risk_level.upper()}).",
            metadata={"verdict": verdict, "confidence": confidence, "risk_level": risk_level, "weights": weights}
        )

    def record_bob_event(self, status: str, model_id: str, details: Dict[str, Any]):
        desc = (
            f"IBM Bob reporting agent generated courtroom-ready forensic dossier ({model_id})."
            if status == "generated"
            else f"IBM Bob reporting service unavailable; case registered with verified AI model findings."
        )
        return self.add_event(
            event_type="BOB_REPORTING",
            actor="IBMBobService",
            description=desc,
            metadata={"status": status, "model_id": model_id, **details}
        )

    def record_export(self, export_type: str, file_path: str, sha256: str):
        return self.add_event(
            event_type="EXPORT",
            actor="ForensicReportGenerator",
            description=f"Exported forensic {export_type.upper()} dossier with cryptographic integrity hash.",
            output_hash=sha256,
            metadata={"export_type": export_type, "file_path": file_path, "sha256": sha256}
        )

    def verify_integrity(self) -> bool:
        """Verifies that all event signatures form an unbroken cryptographic chain."""
        expected_prev = "GENESIS_BLOCK"
        for evt in self.events:
            if evt.previous_event_hash != expected_prev:
                return False
            raw_event = {
                "event_id": evt.event_id,
                "event_type": evt.event_type,
                "actor_or_component": evt.actor_or_component,
                "description": evt.description,
                "device": evt.device,
                "input_hash": evt.input_hash,
                "output_hash": evt.output_hash,
                "metadata": evt.metadata,
                "previous_event_hash": evt.previous_event_hash
            }
            computed_sig = self._compute_event_hash(raw_event, expected_prev)
            if computed_sig != evt.event_signature:
                return False
            expected_prev = evt.event_signature
        return True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "case_id": self.case_id,
            "media_sha256": self.media_sha256,
            "created_at": self.created_at,
            "total_events": len(self.events),
            "integrity_verified": self.verify_integrity(),
            "events": [evt.model_dump() for evt in self.events]
        }

    def save_to_file(self, path: Path):
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, indent=2)

    @classmethod
    def load_from_file(cls, path: Path) -> "ChainOfCustodyLedger":
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        ledger = cls(case_id=data["case_id"], media_sha256=data.get("media_sha256", ""))
        ledger.created_at = data.get("created_at", datetime.now(timezone.utc).isoformat())
        for e in data.get("events", []):
            ledger.events.append(CustodyEvent(**e))
        return ledger
