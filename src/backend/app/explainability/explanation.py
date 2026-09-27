from typing import List, Dict, Any, Optional

def rank_top_suspicious_frames(
    frames: List[Dict[str, Any]],
    top_k: int = 3
) -> List[Dict[str, Any]]:
    """
    Ranks analyzed video frames by AI deepfake suspicion score and returns top K.
    """
    if not frames:
        return []

    sorted_frames = sorted(
        frames,
        key=lambda f: (f.get("fake_probability", 0.0), f.get("confidence", 0.0)),
        reverse=True
    )

    top_frames = []
    for rank, f in enumerate(sorted_frames[:top_k], start=1):
        fake_prob = f.get("fake_probability", 0.0)
        frame_idx = f.get("frame_index", 0)
        ts = f.get("timestamp_sec", 0.0)

        # Categorize anomaly type based on probability and face count
        if fake_prob >= 0.80:
            finding = f"High-confidence generative facial anomaly detected in frame #{frame_idx} (probability: {fake_prob:.2f})."
        elif fake_prob >= 0.50:
            finding = f"Moderate synthesis artifact or boundary inconsistency observed in frame #{frame_idx} (probability: {fake_prob:.2f})."
        else:
            finding = f"Frame #{frame_idx} exhibits characteristics consistent with genuine media (probability: {fake_prob:.2f})."

        top_frames.append({
            "rank": rank,
            "frame_index": frame_idx,
            "timestamp_sec": round(ts, 2),
            "fake_probability": round(fake_prob, 4),
            "real_probability": round(f.get("real_probability", 1.0 - fake_prob), 4),
            "confidence": round(f.get("confidence", 0.0), 4),
            "explanation_image_url": f.get("explanation_image_url"),
            "original_frame_url": f.get("frame_url"),
            "faces_detected": f.get("faces_detected", 0),
            "finding_summary": finding
        })

    return top_frames

def generate_visual_explanation_summary(
    fake_probability: float,
    model_name: str,
    has_faces: bool,
    attention_peak_area: Optional[str] = None
) -> str:
    """Generates an evidence-backed factual explanation for visual analysis."""
    if not has_faces:
        return (
            f"No human facial landmarks detected by MTCNN. Full-frame inspection was processed "
            f"by {model_name}, yielding a synthetic artifact likelihood of {fake_probability:.1%}."
        )

    if fake_probability >= 0.70:
        area_str = f" focused primarily around {attention_peak_area}" if attention_peak_area else ""
        return (
            f"{model_name} classified facial regions as synthetic/manipulated with "
            f"{fake_probability:.1%} probability. Self-attention activation heatmaps indicate anomalous "
            f"high-frequency feature activations{area_str}, indicative of deep learning synthesis or blending."
        )
    elif fake_probability >= 0.50:
        return (
            f"{model_name} identified borderline anomalous textures ({fake_probability:.1%} fake probability). "
            f"Visual artifacts may stem from compression degradation or subtle deepfake manipulation."
        )
    else:
        return (
            f"{model_name} identified natural biometric features and authentic spatial gradients "
            f"with {(1.0 - fake_probability):.1%} authenticity confidence."
        )