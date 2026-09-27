from typing import Any, Dict, List, Optional

class BobForensicTools:
    """Deterministic extractor tools for BOB Forensic Briefing Assistant."""

    @staticmethod
    def get_case_summary(case_data: Dict[str, Any]) -> Dict[str, Any]:
        analysis = case_data.get("analysis_result") or {}
        prediction = analysis.get("prediction") or {}
        scores = analysis.get("scores") or {}
        evidence = case_data.get("evidence") or []
        return {
            "case_id": case_data.get("case_id"),
            "filename": case_data.get("filename"),
            "media_type": case_data.get("media_type"),
            "label": prediction.get("label", "inconclusive"),
            "confidence": prediction.get("confidence", 0.0),
            "risk_level": prediction.get("risk_level", "low"),
            "scores": scores,
            "evidence_count": len(evidence),
            "model_status": analysis.get("model_status", "loaded")
        }

    @staticmethod
    def get_evidence(case_data: Dict[str, Any], severity_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        evidence = case_data.get("evidence") or []
        if severity_filter:
            return [e for e in evidence if e.get("severity") == severity_filter]
        return evidence

    @staticmethod
    def get_media_metadata(case_data: Dict[str, Any]) -> Dict[str, Any]:
        analysis = case_data.get("analysis_result") or {}
        return {
            "media": analysis.get("media") or {},
            "metadata": analysis.get("metadata") or {}
        }

    @staticmethod
    def get_visual_findings(case_data: Dict[str, Any]) -> Dict[str, Any]:
        analysis = case_data.get("analysis_result") or {}
        return analysis.get("visual") or {}

    @staticmethod
    def get_audio_findings(case_data: Dict[str, Any]) -> Dict[str, Any]:
        analysis = case_data.get("analysis_result") or {}
        return analysis.get("audio") or {}

    @staticmethod
    def get_face_findings(case_data: Dict[str, Any]) -> Dict[str, Any]:
        analysis = case_data.get("analysis_result") or {}
        return analysis.get("faces") or {}

    @staticmethod
    def get_temporal_findings(case_data: Dict[str, Any]) -> Dict[str, Any]:
        analysis = case_data.get("analysis_result") or {}
        return analysis.get("temporal") or {}

    @staticmethod
    def get_top_suspicious_frames(case_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        analysis = case_data.get("analysis_result") or {}
        return analysis.get("top_suspicious_frames") or []

    @staticmethod
    def get_models_provenance(case_data: Dict[str, Any]) -> Dict[str, Any]:
        analysis = case_data.get("analysis_result") or {}
        return analysis.get("models_provenance") or {}

    @staticmethod
    def get_evidence_graph(case_data: Dict[str, Any]) -> Dict[str, Any]:
        analysis = case_data.get("analysis_result") or {}
        return analysis.get("evidence_graph") or {}

    @staticmethod
    def get_limitations(case_data: Dict[str, Any]) -> List[str]:
        analysis = case_data.get("analysis_result") or {}
        return analysis.get("limitations") or []