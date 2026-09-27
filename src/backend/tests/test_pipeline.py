import io
import pytest
import numpy as np
from PIL import Image
from app.pipeline.deepfake_pipeline import pipeline

def test_pipeline_image_no_face(tmp_path):
    # Create simple abstract image without any human face
    img_path = tmp_path / "abstract.png"
    img = Image.new("RGB", (100, 100), color=(50, 100, 150))
    img.save(img_path)

    result = pipeline.analyze_image(img_path, "case-test-img", "abstract.png")

    assert result["case_id"] == "case-test-img"
    assert result["prediction"]["label"] in ["authentic", "inconclusive", "potentially_manipulated"]
    assert "confidence" in result["prediction"]
    assert "risk_level" in result["prediction"]
    assert "scores" in result
    assert "faces" in result
    assert result["faces"]["face_count"] == 0
    assert result["model_status"] in ["loaded", "heuristic_only"]
    assert len(result["evidence"]) >= 1
    assert "bob_explanation" in result
    assert len(result["limitations"]) >= 1

def test_pipeline_audio_synthetic_detection(tmp_path):
    import soundfile as sf
    audio_path = tmp_path / "tone.wav"
    sr = 16000
    t = np.linspace(0, 1.0, sr)
    # Generate 440Hz sine wave tone
    tone = (0.5 * np.sin(2 * np.pi * 440 * t)).astype(np.float32)
    sf.write(str(audio_path), tone, sr)

    result = pipeline.analyze_audio(audio_path, "case-test-audio", "tone.wav")
    assert result["case_id"] == "case-test-audio"
    assert result["media"]["media_type"] == "audio"
    assert "audio" in result["scores"]
    assert result["prediction"]["label"] in ["authentic", "inconclusive", "potentially_manipulated"]
