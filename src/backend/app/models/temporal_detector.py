from typing import List, Dict, Any, Optional
import numpy as np
import torch
from app.models.base import BaseTemporalDetector
from app.models.registry import MODEL_REGISTRY

class TemporalAggregationDetector(BaseTemporalDetector):
    def __init__(self, device: Optional[torch.device] = None):
        meta = MODEL_REGISTRY["temporal_aggregation_engine"]
        super().__init__(model_name=meta.name, model_id=meta.model_id, device=device)
        self.is_loaded = True

    def load(self) -> None:
        self.is_loaded = True
        self.load_error = None

    def predict(self, frame_predictions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes frame-level visual model outputs across the video timeline.
        Computes temporal consistency, inter-frame jitter, peak anomalies, and aggregate score.
        """
        if not frame_predictions:
            return {
                "temporal_risk_score": 0.0,
                "mean_fake_probability": 0.0,
                "peak_fake_probability": 0.0,
                "variance": 0.0,
                "inter_frame_jitter": 0.0,
                "peak_frame_index": 0,
                "suspicious_frame_indices": [],
                "confidence": 0.5,
                "predicted_label": "REAL",
                "model_name": self.model_name,
                "model_id": self.model_id
            }

        scores = [f.get("fake_probability", 0.0) for f in frame_predictions]
        frame_indices = [f.get("frame_index", idx) for idx, f in enumerate(frame_predictions)]
        arr = np.array(scores, dtype=np.float32)
        n = len(arr)

        mean_p = float(np.mean(arr))
        peak_p = float(np.max(arr))
        peak_idx_local = int(np.argmax(arr))
        peak_frame = frame_indices[peak_idx_local] if peak_idx_local < len(frame_indices) else peak_idx_local

        # Variance and standard deviation
        var = float(np.var(arr)) if n > 1 else 0.0

        # Inter-frame jitter (first-order difference)
        if n > 1:
            diffs = np.abs(np.diff(arr))
            jitter = float(np.mean(diffs))
        else:
            jitter = 0.0

        # Top peak frames average (top 3 or 20% of frames)
        k = max(1, min(3, n))
        top_k_indices = np.argsort(arr)[-k:][::-1]
        top_k_avg = float(np.mean(arr[top_k_indices]))
        suspicious_frames = [frame_indices[i] for i in top_k_indices if arr[i] >= 0.50]

        # Multi-factor temporal risk formulation
        instability_penalty = min(1.0, (var * 4.0) + (jitter * 2.5))
        temporal_risk = (0.45 * mean_p) + (0.40 * top_k_avg) + (0.15 * instability_penalty)
        temporal_risk = float(np.clip(temporal_risk, 0.0, 1.0))

        predicted_label = "FAKE" if temporal_risk >= 0.50 else "REAL"
        confidence = float(max(temporal_risk, 1.0 - temporal_risk))

        return {
            "temporal_risk_score": round(temporal_risk, 4),
            "mean_fake_probability": round(mean_p, 4),
            "peak_fake_probability": round(peak_p, 4),
            "variance": round(var, 4),
            "inter_frame_jitter": round(jitter, 4),
            "peak_frame_index": peak_frame,
            "suspicious_frame_indices": suspicious_frames,
            "confidence": round(confidence, 4),
            "predicted_label": predicted_label,
            "model_name": self.model_name,
            "model_id": self.model_id
        }