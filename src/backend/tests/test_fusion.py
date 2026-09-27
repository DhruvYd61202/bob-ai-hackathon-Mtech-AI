import pytest
from app.pipeline.fusion import fuse_multimodal_predictions

def test_image_fusion_dominant_ai():
    visual_res = {
        "model_name": "Vision Transformer",
        "model_id": "dima806/deepfake_vs_real_image_detection",
        "fake_probability": 0.88,
        "confidence": 0.88
    }
    heuristics = {"supporting_forensic_score": 0.20}
    fused = fuse_multimodal_predictions(
        media_type="image",
        visual_result=visual_res,
        supporting_forensics=heuristics
    )
    # AI dominates with 90% weight
    expected = (0.90 * 0.88) + (0.10 * 0.20)
    assert abs(fused["fake_probability"] - expected) < 0.01
    assert fused["verdict"] == "SUSPICIOUS_DEEPFAKE"
    assert fused["risk_level"] == "HIGH"

def test_audio_fusion_authentic():
    audio_res = {
        "model_name": "Wav2Vec2",
        "model_id": "MelodyMachine/Deepfake-audio-detection",
        "fake_probability": 0.05,
        "confidence": 0.95
    }
    heuristics = {"supporting_forensic_score": 0.10}
    fused = fuse_multimodal_predictions(
        media_type="audio",
        audio_result=audio_res,
        supporting_forensics=heuristics
    )
    assert fused["verdict"] == "LIKELY_AUTHENTIC"
    assert fused["risk_level"] == "LOW"