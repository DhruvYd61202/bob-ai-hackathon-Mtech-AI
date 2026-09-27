from typing import Dict, Any, Optional

def fuse_multimodal_predictions(
    media_type: str,
    visual_result: Optional[Dict[str, Any]] = None,
    audio_result: Optional[Dict[str, Any]] = None,
    temporal_result: Optional[Dict[str, Any]] = None,
    supporting_forensics: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Fuses primary deep learning predictions with secondary supporting forensic signals.
    Ensures pre-trained neural networks dominate the decision with 85-90% weight.
    """
    supporting_forensics = supporting_forensics or {}
    heuristic_score = supporting_forensics.get("supporting_forensic_score", 0.0)

    breakdown: Dict[str, Any] = {
        "media_type": media_type,
        "visual_ai": None,
        "audio_ai": None,
        "temporal_ai": None,
        "supporting_heuristics": round(heuristic_score, 4)
    }

    if media_type == "image":
        if visual_result is None:
            raise ValueError("Visual deep learning result is required for image analysis")

        v_prob = visual_result.get("fake_probability", 0.0)
        v_conf = visual_result.get("confidence", 0.5)
        breakdown["visual_ai"] = {
            "model_name": visual_result.get("model_name"),
            "model_id": visual_result.get("model_id"),
            "fake_probability": v_prob,
            "confidence": v_conf
        }

        # 90% Primary Visual AI, 10% Supporting Heuristics
        fused_fake_prob = (0.90 * v_prob) + (0.10 * heuristic_score)
        fused_conf = max(v_conf, 0.70)
        dominant_signal = "Vision Transformer Facial Texture & Feature Representation"

    elif media_type == "audio":
        if audio_result is None:
            raise ValueError("Audio deep learning result is required for audio analysis")

        a_prob = audio_result.get("fake_probability", 0.0)
        a_conf = audio_result.get("confidence", 0.5)
        breakdown["audio_ai"] = {
            "model_name": audio_result.get("model_name"),
            "model_id": audio_result.get("model_id"),
            "fake_probability": a_prob,
            "confidence": a_conf
        }

        # 90% Primary Audio AI, 10% Supporting Heuristics
        fused_fake_prob = (0.90 * a_prob) + (0.10 * heuristic_score)
        fused_conf = max(a_conf, 0.70)
        dominant_signal = "Wav2Vec2 Neural Acoustic Speech Latents"

    elif media_type == "video":
        has_visual = visual_result is not None or temporal_result is not None
        has_audio = audio_result is not None

        if not has_visual and not has_audio:
            raise ValueError("Video analysis requires at least visual or audio inference results")

        v_score = 0.0
        v_weight = 0.0
        if temporal_result:
            v_score = temporal_result.get("temporal_risk_score", 0.0)
            breakdown["temporal_ai"] = {
                "model_name": temporal_result.get("model_name"),
                "model_id": temporal_result.get("model_id"),
                "temporal_risk_score": v_score,
                "confidence": temporal_result.get("confidence", 0.5)
            }
        elif visual_result:
            v_score = visual_result.get("fake_probability", 0.0)
            breakdown["visual_ai"] = {
                "model_name": visual_result.get("model_name"),
                "fake_probability": v_score
            }

        a_score = 0.0
        if has_audio and audio_result:
            a_score = audio_result.get("fake_probability", 0.0)
            breakdown["audio_ai"] = {
                "model_name": audio_result.get("model_name"),
                "model_id": audio_result.get("model_id"),
                "fake_probability": a_score,
                "confidence": audio_result.get("confidence", 0.5)
            }

        if has_visual and has_audio:
            # 60% Visual/Temporal AI, 30% Audio AI, 10% Supporting Heuristics
            fused_fake_prob = (0.60 * v_score) + (0.30 * a_score) + (0.10 * heuristic_score)
            fused_conf = 0.85
            dominant_signal = "Multimodal Audio-Visual Neural Feature Discrepancy"
        elif has_visual:
            # 90% Visual/Temporal AI, 10% Supporting Heuristics
            fused_fake_prob = (0.90 * v_score) + (0.10 * heuristic_score)
            fused_conf = 0.80
            dominant_signal = "Temporal & Visual Vision Transformer Frame Anomalies"
        else:
            # 90% Audio AI, 10% Supporting Heuristics
            fused_fake_prob = (0.90 * a_score) + (0.10 * heuristic_score)
            fused_conf = 0.80
            dominant_signal = "Wav2Vec2 Neural Audio Track Synthesis"

    else:
        raise ValueError(f"Unknown media type: {media_type}")

    fused_fake_prob = float(min(1.0, max(0.0, fused_fake_prob)))
    fused_real_prob = float(1.0 - fused_fake_prob)

    # Classify forensic verdict
    if fused_fake_prob >= 0.70:
        verdict = "SUSPICIOUS_DEEPFAKE"
        risk_level = "HIGH"
        qualifier = "AI deep learning models indicate strong indicators of synthetic generation or manipulation."
    elif fused_fake_prob >= 0.45:
        verdict = "POTENTIAL_MANIPULATION"
        risk_level = "MEDIUM"
        qualifier = "AI models detected anomalous or borderline synthetic characteristics requiring human verification."
    else:
        verdict = "LIKELY_AUTHENTIC"
        risk_level = "LOW"
        qualifier = "AI models and forensic heuristics observe natural biometric distributions consistent with authentic capture."

    return {
        "verdict": verdict,
        "risk_level": risk_level,
        "fake_probability": round(fused_fake_prob, 4),
        "real_probability": round(fused_real_prob, 4),
        "confidence_score": round(fused_conf, 4),
        "dominant_signal": dominant_signal,
        "forensic_qualifier": qualifier,
        "breakdown": breakdown
    }